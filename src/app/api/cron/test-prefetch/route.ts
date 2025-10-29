import { NextResponse } from 'next/server'
import { dbService } from '@/lib/database'
import { logger } from '@/lib/logger'
import { RapidAPIClient } from '@/lib/rapidapi-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * TEST endpoint to pre-fetch jobs for Edmonton, AB
 * 
 * This is for testing the job pre-fetching system before full deployment.
 * Tests with 150km radius around Edmonton.
 * 
 * Usage:
 * GET /api/cron/test-prefetch
 */
export async function GET() {
  try {
    logger.info('[TEST PREFETCH] Starting test job download for Edmonton, AB...')
    
    await dbService.connect()

    // Test configuration for Edmonton
    const testConfig = {
      location: 'Edmonton, AB',
      radius: 150, // km
      keywords: [
        'sales',
        'business development',
        'finance',
        'software developer',
        'project manager',
        'marketing',
        'account manager',
        'operations'
      ],
      maxResults: 50
    }

    logger.info('[TEST PREFETCH] Test configuration:', testConfig)

    const results = {
      location: testConfig.location,
      radius: testConfig.radius,
      keywords: testConfig.keywords,
      searches: [] as Array<{
        keywords: string
        jobCount: number
        success: boolean
        cached?: boolean
        error?: string
      }>,
      totalJobs: 0,
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Test multiple keyword combinations (reduced to 2 for speed)
    const keywordGroups = [
      ['sales', 'business development', 'CRM'],
      ['software developer', 'software engineer', 'developer']
    ]

    // Initialize RapidAPI client
    const rapidAPI = new RapidAPIClient()
    
    for (const keywords of keywordGroups) {
      try {
        const keywordString = keywords.join(', ')
        logger.info(`[TEST PREFETCH] Searching for: ${keywordString}`)

        // Use RapidAPI - MUCH faster than webScraper (seconds vs minutes!)
        // Query multiple sources in parallel for maximum coverage
        const { jobs, metadata } = await rapidAPI.queryMultipleSources(
          ['google-jobs', 'active-jobs-db', 'jsearch', 'linkedin-jobs'],
          {
            keywords: keywords,
            location: testConfig.location,
            limit: testConfig.maxResults
          }
        )

        const jobCount = jobs?.length || 0
        
        logger.info(`[TEST PREFETCH] ✅ Found ${jobCount} jobs for: ${keywordString} in ${metadata.duration}ms`)
        
        results.searches.push({
          keywords: keywordString,
          jobCount,
          success: true,
          cached: false
        })
        
        results.totalJobs += jobCount
        results.success++

        // No rate limit needed - RapidAPI handles this
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        logger.error(`[TEST PREFETCH] Error searching for ${keywords.join(', ')}:`, error)
        results.failed++
        results.errors.push(`${keywords.join(', ')}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    logger.info('[TEST PREFETCH] Test completed:', {
      totalSearches: keywordGroups.length,
      success: results.success,
      failed: results.failed,
      totalJobs: results.totalJobs
    })

    return NextResponse.json({
      success: true,
      message: 'Test job pre-fetch completed',
      results,
      summary: {
        totalSearches: keywordGroups.length,
        successfulSearches: results.success,
        failedSearches: results.failed,
        totalJobsFound: results.totalJobs,
        averageJobsPerSearch: Math.round(results.totalJobs / results.success)
      }
    })

  } catch (error) {
    logger.error('[TEST PREFETCH] Test failed:', error)
    return NextResponse.json(
      {
        error: 'Test job pre-fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
