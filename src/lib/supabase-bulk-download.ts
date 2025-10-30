/**
 * Supabase Bulk Download Integration
 * Orchestrates job downloads from RapidAPI and stores in Supabase
 */

import { supabaseAdmin } from './supabase'
import { RapidAPIClient } from './rapidapi-client'
import { AdzunaAPIClient } from './adzuna-api-client'
import type { Job } from '@/types/supabase'

const rapidAPI = new RapidAPIClient()
const adzunaAPI = new AdzunaAPIClient()

/**
 * Bulk download jobs for multiple locations
 */
export async function bulkDownloadJobs(locations: string[]) {
  console.log(`[BULK] Starting for ${locations.length} locations`)
  
  const startTime = Date.now()
  const allJobs: Partial<Job>[] = []
  let totalDownloaded = 0
  let totalInserted = 0
  let totalErrors = 0
  
  for (const location of locations) {
    console.log(`\n[BULK] Processing ${location}...`)
    
    try {
      // Query RapidAPI sources - targeting 500+ jobs
      // Strategy: Single broad search with high limits and multiple pages
      console.log(`  Searching for jobs in ${location}...`)
      
      // 1. Scrape Adzuna directly - MAXIMIZED with multiple strategies
      console.log(`  [ADZUNA] Scraping with multiple strategies...`)
      const adzunaJobs: any[] = []
      const seenJobIds = new Set<string>()
      
      // Strategy 1: Broad search (all jobs)
      console.log(`  [ADZUNA] Strategy 1: Broad search (all jobs)`)
      for (let page = 1; page <= 100; page++) {
        try {
          const result = await adzunaAPI.searchJobs({
            what: '',
            where: location,
            country: 'ca',
            resultsPerPage: 50,
            page,
            sortBy: 'date'
          })
          
          // CRITICAL: Validate data quality and deduplicate
          const validJobs = result.results.filter((j: any) => {
            // Skip duplicates
            if (seenJobIds.has(j.id)) {
              return false
            }
            
            const hasCompany = j.company?.display_name && j.company.display_name.trim().length > 0
            const hasDescription = j.description && j.description.trim().length > 0
            const hasTitle = j.title && j.title.trim().length > 0
            const hasUrl = j.redirect_url && j.redirect_url.trim().length > 0
            
            if (!hasCompany || !hasDescription || !hasTitle || !hasUrl) {
              return false
            }
            
            seenJobIds.add(j.id)
            return true
          })
          
          adzunaJobs.push(...validJobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.company.display_name,
            location: j.location.display_name,
            description: j.description,
            url: j.redirect_url,
            source: 'adzuna',
            salary: {
              min: j.salary_min || null,
              max: j.salary_max || null
            },
            postedDate: j.created,
            jobType: j.contract_time ? [j.contract_time] : []
          })))
          
          console.log(`    Page ${page}: ${validJobs.length}/${result.results.length} valid jobs (${result.results.length - validJobs.length} rejected)`)
          
          // Stop if no more results
          if (result.results.length === 0) {
            console.log(`    No more results, stopping at page ${page}`)
            break
          }
          
          await sleep(500) // Rate limit (reduced from 1000ms for faster scraping)
          
        } catch (error: any) {
          console.error(`    Page ${page} error:`, error.message)
          break
        }
      }
      
      console.log(`  [ADZUNA] Total: ${adzunaJobs.length} valid jobs scraped`)
      console.log(`  [ADZUNA] Sample job:`, adzunaJobs[0] ? {
        title: adzunaJobs[0].title,
        company: adzunaJobs[0].company,
        hasSalary: !!(adzunaJobs[0].salary?.min || adzunaJobs[0].salary?.max),
        descriptionLength: adzunaJobs[0].description?.length || 0
      } : 'No jobs')
      
      // 2. Scrape RapidAPI sources
      const { jobs, metadata } = await rapidAPI.queryMultipleSourcesWithPagination(
        [
          'jsearch',          // JSearch API (working)
          'google-jobs'       // Google Jobs API (working)
        ],
        {
          keywords: [''], // Empty = all jobs
          location,
          limit: 100
        },
        20 // 20 pages per source
      )
      
      // Combine all jobs
      const allLocationJobs = [...adzunaJobs, ...jobs]
      
      // Transform to Supabase format
      const transformedJobs = allLocationJobs.map(job => transformJobForSupabase(job, location))
      allJobs.push(...transformedJobs)
      totalDownloaded += allLocationJobs.length
      
      console.log(`  Total downloaded for ${location}: ${allLocationJobs.length} jobs`)
      
      // Rate limit protection
      await sleep(3000)
      
    } catch (error: any) {
      console.error(`  Error processing ${location}:`, error.message)
      totalErrors++
    }
  }
  
  console.log(`\n[DEDUPE] Deduplicating ${allJobs.length} jobs...`)
  const uniqueJobs = deduplicateJobs(allJobs)
  console.log(`[DEDUPE] ${allJobs.length} → ${uniqueJobs.length} unique jobs`)
  
  // Batch insert to Supabase
  console.log(`\n[INSERT] Inserting ${uniqueJobs.length} jobs to Supabase...`)
  const insertResult = await batchInsertJobs(uniqueJobs)
  totalInserted = insertResult.inserted
  
  const duration = Math.round((Date.now() - startTime) / 1000)
  
  // Log to download history
  await logDownloadHistory({
    source: 'bulk-all',
    search_query: locations.join(', '),
    jobs_downloaded: totalDownloaded,
    unique_jobs: uniqueJobs.length,
    duplicates_found: allJobs.length - uniqueJobs.length,
    duration_seconds: duration,
    success: totalErrors === 0
  })
  
  console.log(`\n[BULK] Complete in ${duration}s`)
  console.log(`  - Downloaded: ${totalDownloaded}`)
  console.log(`  - Unique: ${uniqueJobs.length}`)
  console.log(`  - Inserted: ${totalInserted}`)
  console.log(`  - Errors: ${totalErrors}`)
  
  return {
    downloaded: totalDownloaded,
    unique: uniqueJobs.length,
    inserted: totalInserted,
    errors: totalErrors,
    duration
  }
}

/**
 * Transform RapidAPI job to Supabase format
 */
function transformJobForSupabase(job: any, location: string): Partial<Job> {
  const city = parseCity(job.location || location)
  const state = parseState(job.location || location)
  const postedDate = job.postedDate ? new Date(job.postedDate).toISOString() : undefined
  
  return {
    title: job.title || 'Unknown Title',
    company: job.company || 'Unknown Company',
    location: job.location || location,
    description: job.description || '',
    
    salary_min: job.salary?.min || undefined,
    salary_max: job.salary?.max || undefined,
    salary_type: 'yearly',
    salary_currency: 'CAD',
    
    job_type: job.jobType?.[0] || undefined,
    remote_type: job.remote ? 'remote' : 'on-site',
    
    url: job.url || '',
    external_id: job.id || `${job.source}-${Date.now()}-${Math.random()}`,
    source: job.source as any,
    apply_link: job.url || '',
    
    city: city || undefined,
    state: state || undefined,
    country: 'Canada',
    
    keywords: job.keywords || [],
    
    posted_date: postedDate,
    scraped_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    
    raw_data: job
  }
}

/**
 * Batch insert jobs to Supabase with retry logic
 */
async function batchInsertJobs(jobs: Partial<Job>[], batchSize = 100) {
  console.log(`[BATCH INSERT] Starting for ${jobs.length} jobs (batch size: ${batchSize})`)
  
  if (jobs.length === 0) {
    console.log('[BATCH INSERT] No jobs to insert!')
    return { inserted: 0, errors: 0 }
  }
  
  // Log first job for debugging
  console.log('[BATCH INSERT] Sample job:', JSON.stringify(jobs[0], null, 2))
  
  let totalInserted = 0
  let totalErrors = 0
  
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    
    console.log(`[BATCH ${batchNum}] Attempting to insert ${batch.length} jobs...`)
    
    let retries = 3
    let success = false
    
    while (retries > 0 && !success) {
      try {
        const { data, error } = await supabaseAdmin
          .from('jobs')
          .upsert(batch, {
            onConflict: 'company,title,location,source',
            ignoreDuplicates: false
          })
          .select('id')
        
        if (error) {
          console.error(`[BATCH ${batchNum}] Supabase Error:`)
          console.error(`  Code: ${error.code}`)
          console.error(`  Message: ${error.message}`)
          console.error(`  Details: ${JSON.stringify(error.details)}`)
          console.error(`  Hint: ${error.hint}`)
          
          if (retries > 1) {
            console.log(`  Retrying... (${retries - 1} attempts left)`)
            await sleep(2000)
            retries--
            continue
          }
          
          totalErrors += batch.length
          break
        }
        
        const insertedCount = data?.length || 0
        totalInserted += insertedCount
        success = true
        
        console.log(`[BATCH ${batchNum}] ✅ Inserted/Updated ${insertedCount} jobs`)
        
      } catch (error: any) {
        console.error(`[BATCH ${batchNum}] Exception:`, error.message)
        
        if (retries > 1) {
          console.log(`  Retrying... (${retries - 1} attempts left)`)
          await sleep(2000)
          retries--
        } else {
          console.error(`  Stack:`, error.stack)
          totalErrors += batch.length
          break
        }
      }
    }
    
    // Small delay between batches to avoid rate limiting
    await sleep(500)
  }
  
  console.log(`[BATCH INSERT] Complete: ${totalInserted} inserted, ${totalErrors} errors`)
  
  return {
    inserted: totalInserted,
    errors: totalErrors
  }
}

/**
 * Log download history
 */
async function logDownloadHistory(data: {
  source: string
  search_query: string
  jobs_downloaded: number
  unique_jobs: number
  duplicates_found: number
  duration_seconds: number
  success: boolean
}) {
  try {
    await supabaseAdmin
      .from('download_history')
      .insert({
        ...data,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
  } catch (error: any) {
    console.error('[HISTORY] Error logging:', error.message)
  }
}

/**
 * Deduplicate jobs by company + title + location
 */
function deduplicateJobs(jobs: Partial<Job>[]): Partial<Job>[] {
  const seen = new Set<string>()
  
  return jobs.filter(job => {
    const key = `${job.company}|${job.title}|${job.location}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Helper functions
 */
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseCity(location: string): string | null {
  return location?.split(',')[0]?.trim() || null
}

function parseState(location: string): string | null {
  return location?.split(',')[1]?.trim() || null
}
