import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database'
import { logger } from '@/lib/logger'
import { RapidAPIClient } from '@/lib/rapidapi-client'
import GlobalJobsCache from '@/models/GlobalJobsCache'
import { getEnabledCities } from '@/config/markets'
import { extractKeywords } from '@/lib/keyword-extractor'
import { deduplicateJobs } from '@/lib/job-deduplicator'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * BULK JOB DOWNLOAD CRON
 * 
 * Runs Tuesday & Saturday at 3 AM EST
 * Downloads ALL jobs from enabled markets
 * Stores in GlobalJobsCache for 2 weeks
 * 
 * Phase 1 MVP: Edmonton only, Tier 1 sources
 * 
 * Schedule: 0 8 * * 2,6 (8 AM UTC = 3 AM EST)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logger.info('[BULK DOWNLOAD] Starting bulk job download...')
    
    await dbService.connect()

    // Get enabled cities
    const cities = getEnabledCities()
    
    if (cities.length === 0) {
      logger.warn('[BULK DOWNLOAD] No enabled cities found')
      return NextResponse.json({
        success: true,
        message: 'No enabled cities',
        results: { total: 0, success: 0, failed: 0 }
      })
    }

    logger.info(`[BULK DOWNLOAD] Processing ${cities.length} cities`)

    const results = {
      total: cities.length,
      success: 0,
      failed: 0,
      totalJobs: 0,
      newJobs: 0,
      updatedJobs: 0,
      errors: [] as string[]
    }

    // Initialize RapidAPI client
    const rapidAPI = new RapidAPIClient()

    // Process each city
    for (const cityConfig of cities) {
      try {
        logger.info(`[BULK DOWNLOAD] Processing ${cityConfig.city}...`)

        // WAVE 1: Tier 1 sources (fast & comprehensive)
        // Parallel processing for speed
        const { jobs, metadata } = await rapidAPI.queryMultipleSources(
          [
            'google-jobs',      // 520ms - Fastest!
            'active-jobs-db',   // 851ms - 130K+ sources
            'jsearch',          // 3425ms - LinkedIn/Indeed/Glassdoor
            'adzuna'            // 2-3s - Salary data + comprehensive
          ],
          {
            keywords: [], // No keywords - download ALL jobs
            location: cityConfig.city,
            limit: 100 // Max per source
          }
        )

        logger.info(`[BULK DOWNLOAD] Found ${jobs.length} jobs from ${cityConfig.city} in ${metadata.duration}ms`)

        // Deduplicate jobs
        const uniqueJobs = deduplicateJobs(jobs)
        logger.info(`[BULK DOWNLOAD] After deduplication: ${uniqueJobs.length} unique jobs`)

        // Process and store jobs
        let newCount = 0
        let updatedCount = 0

        // Batch insert for performance
        const BATCH_SIZE = 100
        for (let i = 0; i < uniqueJobs.length; i += BATCH_SIZE) {
          const batch = uniqueJobs.slice(i, i + BATCH_SIZE)
          
          for (const job of batch) {
            try {
              // Generate unique job ID
              const jobId = generateJobHash(job, cityConfig)

              // Extract keywords
              const keywords = extractKeywords(job)

              // Calculate expiry (2 weeks from now)
              const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

              // Check if job already exists
              const existing = await GlobalJobsCache.findOne({ jobId })

              if (existing) {
                // Update existing job
                await GlobalJobsCache.updateOne(
                  { jobId },
                  {
                    $set: {
                      title: job.title,
                      company: job.company,
                      description: job.description,
                      salary: job.salary,
                      url: job.url,
                      keywords,
                      lastSeenAt: new Date(),
                      expiresAt // Extend expiry
                    }
                  }
                )
                updatedCount++
              } else {
                // Insert new job
                await GlobalJobsCache.create({
                  jobId,
                  title: job.title,
                  company: job.company,
                  location: cityConfig.city,
                  country: cityConfig.country,
                  province: extractProvince(cityConfig.city),
                  city: extractCity(cityConfig.city),
                  description: job.description,
                  salary: job.salary,
                  url: job.url,
                  source: job.source,
                  keywords,
                  postedDate: job.postedDate ? new Date(job.postedDate) : undefined,
                  downloadedAt: new Date(),
                  expiresAt,
                  lastSeenAt: new Date()
                })
                newCount++
              }
            } catch (error) {
              logger.error(`[BULK DOWNLOAD] Error storing job:`, error)
            }
          }

          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        logger.info(`[BULK DOWNLOAD] ${cityConfig.city}: ${newCount} new, ${updatedCount} updated`)

        results.success++
        results.totalJobs += uniqueJobs.length
        results.newJobs += newCount
        results.updatedJobs += updatedCount

        // Rate limit: wait 12 minutes between cities (stagger across 1 hour)
        if (cities.indexOf(cityConfig) < cities.length - 1) {
          logger.info('[BULK DOWNLOAD] Waiting 12 minutes before next city...')
          await new Promise(resolve => setTimeout(resolve, 12 * 60 * 1000))
        }

      } catch (error) {
        logger.error(`[BULK DOWNLOAD] Error processing ${cityConfig.city}:`, error)
        results.failed++
        results.errors.push(`${cityConfig.city}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    logger.info('[BULK DOWNLOAD] Bulk download completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Bulk job download completed',
      results
    })

  } catch (error) {
    logger.error('[BULK DOWNLOAD] Bulk download failed:', error)
    return NextResponse.json(
      {
        error: 'Bulk download failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate unique hash for job deduplication
 */
function generateJobHash(job: { company: string; title: string }, cityConfig: { city: string }): string {
  const normalized = {
    company: normalizeCompany(job.company),
    title: normalizeTitle(job.title),
    location: cityConfig.city.toLowerCase().trim()
  }
  
  return crypto.createHash('md5')
    .update(JSON.stringify(normalized))
    .digest('hex')
}

/**
 * Normalize company name
 */
function normalizeCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|corp|ltd|llc|co|corporation|incorporated|limited)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Normalize job title
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\b(sr|senior|jr|junior|lead|principal|staff)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Extract province from city string
 */
function extractProvince(cityString: string): string | undefined {
  const parts = cityString.split(',').map(p => p.trim())
  return parts[1] || undefined
}

/**
 * Extract city name from city string
 */
function extractCity(cityString: string): string {
  const parts = cityString.split(',').map(p => p.trim())
  return parts[0]
}
