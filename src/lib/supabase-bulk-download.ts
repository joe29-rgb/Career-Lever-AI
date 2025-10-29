/**
 * Supabase Bulk Download Integration
 * Orchestrates job downloads from RapidAPI and stores in Supabase
 */

import { supabaseAdmin } from './supabase'
import { RapidAPIClient } from './rapidapi-client'
import type { Job } from '@/types/supabase'

const rapidAPI = new RapidAPIClient()

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
      
      const { jobs, metadata } = await rapidAPI.queryMultipleSourcesWithPagination(
        [
          'jsearch',          // ~100 jobs per page (WORKING ✅)
          'google-jobs'       // ~50 jobs per page (WORKING ✅)
        ],
        {
          keywords: [''], // Empty = all jobs
          location,
          limit: 100
        },
        20 // 20 pages per source = ~3,000 jobs (jsearch) + ~1,000 (google) = 4,000 total
      )
      
      // Transform to Supabase format
      const transformedJobs = jobs.map(job => transformJobForSupabase(job, location))
      allJobs.push(...transformedJobs)
      totalDownloaded += jobs.length
      
      console.log(`  Total downloaded for ${location}: ${jobs.length} jobs`)
      
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
 * Batch insert jobs to Supabase
 */
async function batchInsertJobs(jobs: Partial<Job>[], batchSize = 1000) {
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
        totalErrors += batch.length
        continue
      }
      
      const insertedCount = data?.length || 0
      totalInserted += insertedCount
      
      console.log(`[BATCH ${batchNum}] ✅ Inserted/Updated ${insertedCount} jobs`)
      
    } catch (error: any) {
      console.error(`[BATCH ${batchNum}] Exception:`, error.message)
      console.error(`  Stack:`, error.stack)
      totalErrors += batch.length
    }
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
