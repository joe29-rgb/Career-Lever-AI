/**
 * JSEARCH API - GOOGLE JOBS AGGREGATOR
 * 
 * FREE tier: 1,000 requests/month
 * Each request = ~10 jobs
 * Total: 10,000 jobs/month FREE!
 * 
 * This is a Google Jobs API aggregator via RapidAPI
 * - NO scraping
 * - NO maintenance
 * - 100% legal
 * - Zero cost (free tier)
 */

import type { Job } from '@/types/supabase'

interface JSearchParams {
  query: string
  location?: string
  page?: number
  num_pages?: number
  date_posted?: 'all' | 'today' | '3days' | 'week' | 'month'
}

export class JSearchAPI {
  private readonly BASE_URL = 'https://jsearch.p.rapidapi.com'
  private readonly API_KEY = process.env.RAPID_API_KEY || ''
  
  /**
   * Search for jobs
   */
  async search(params: JSearchParams): Promise<Partial<Job>[]> {
    try {
      if (!this.API_KEY) {
        console.error('[JSEARCH] API key not found. Set RAPID_API_KEY in .env')
        return []
      }
      
      const url = new URL(`${this.BASE_URL}/search`)
      url.searchParams.set('query', params.query)
      if (params.location) url.searchParams.set('location', params.location)
      url.searchParams.set('page', (params.page || 1).toString())
      url.searchParams.set('num_pages', (params.num_pages || 1).toString())
      url.searchParams.set('date_posted', params.date_posted || 'week')
      
      console.log(`[JSEARCH] Searching: ${params.query} @ ${params.location || 'Canada'}`)
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.API_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      })
      
      if (!response.ok) {
        console.error(`[JSEARCH] HTTP ${response.status}: ${response.statusText}`)
        return []
      }
      
      const data = await response.json()
      
      if (!data.data || !Array.isArray(data.data)) {
        console.error('[JSEARCH] Invalid response format')
        return []
      }
      
      const jobs: Partial<Job>[] = data.data.map((job: any) => ({
        title: job.job_title || 'Unknown',
        company: job.employer_name || 'Unknown',
        location: this.formatLocation(job),
        description: job.job_description || '',
        url: job.job_apply_link || job.job_google_link || '',
        source: 'jsearch',
        salary_min: job.job_min_salary || undefined,
        salary_max: job.job_max_salary || undefined,
        posted_date: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc).toISOString() : undefined,
        external_id: `jsearch_${job.job_id}`,
        scraped_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        keywords: []
      }))
      
      console.log(`[JSEARCH] Found ${jobs.length} jobs`)
      return jobs
      
    } catch (error) {
      console.error('[JSEARCH] Error:', error)
      return []
    }
  }
  
  /**
   * Format location from job data
   */
  private formatLocation(job: any): string {
    const parts: string[] = []
    if (job.job_city) parts.push(job.job_city)
    if (job.job_state) parts.push(job.job_state)
    if (job.job_country) parts.push(job.job_country)
    return parts.join(', ') || 'Remote'
  }
  
  /**
   * Bulk search with multiple keywords and locations
   */
  async bulkSearch(
    keywords: string[],
    locations: string[],
    options?: { datePosted?: 'week' | 'month'; maxPages?: number }
  ): Promise<Partial<Job>[]> {
    const allJobs: Partial<Job>[] = []
    const datePosted = options?.datePosted || 'week'
    const maxPages = options?.maxPages || 1
    
    console.log(`\n🔍 JSEARCH BULK SEARCH: ${keywords.length} keywords × ${locations.length} locations\n`)
    
    for (const location of locations) {
      for (const keyword of keywords) {
        const jobs = await this.search({
          query: keyword,
          location,
          page: 1,
          num_pages: maxPages,
          date_posted: datePosted
        })
        
        allJobs.push(...jobs)
        console.log(`  ${keyword} @ ${location}: ${jobs.length} jobs (Total: ${allJobs.length})`)
        
        // Rate limiting (RapidAPI free tier: 5 requests/second)
        await sleep(250)
      }
    }
    
    console.log(`\n✅ JSEARCH COMPLETE: ${allJobs.length} jobs\n`)
    return allJobs
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Singleton
let instance: JSearchAPI | null = null

export function getJSearchAPI(): JSearchAPI {
  if (!instance) {
    instance = new JSearchAPI()
  }
  return instance
}
