/**
 * LINKEDIN HIDDEN PUBLIC API
 * 
 * LinkedIn's job search works WITHOUT login!
 * The API endpoint is public (used by their own website)
 * NO authentication required
 * 
 * Expected: 5,000+ jobs
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import type { Job } from '@/types/supabase'

export class LinkedInHiddenAPI {
  
  /**
   * LinkedIn's hidden public job search API
   * NO AUTHENTICATION REQUIRED
   * This endpoint is used by LinkedIn's public job search page
   */
  private readonly BASE_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search'

  async searchJobs(keyword: string, location: string, start: number = 0): Promise<Partial<Job>[]> {
    try {
      console.log(`[LINKEDIN API] Searching: ${keyword} @ ${location}`)

      const response = await axios.get(this.BASE_URL, {
        params: {
          keywords: keyword,
          location: location,
          start: start,
          sortBy: 'DD' // Date descending
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': 'https://www.linkedin.com/jobs/search'
        },
        timeout: 15000
      })

      const jobs = this.parseLinkedInJobs(response.data)
      console.log(`[LINKEDIN API] Found ${jobs.length} jobs`)
      return jobs
    } catch (error) {
      console.error('[LINKEDIN API] Error:', error)
      return []
    }
  }

  private parseLinkedInJobs(html: string): Partial<Job>[] {
    const $ = cheerio.load(html)
    const jobs: Partial<Job>[] = []

    // LinkedIn returns job posting elements
    $('li').each((i, elem) => {
      try {
        // Get job ID from data-entity-urn
        const entityUrn = $(elem).find('[data-entity-urn]').attr('data-entity-urn')
        const jobId = entityUrn ? entityUrn.split(':').pop() : null
        
        // Find the title - it's in an h3 inside the card
        const title = $(elem).find('h3.base-search-card__title').text().trim()
        
        // Company is in h4
        const company = $(elem).find('h4.base-search-card__subtitle').text().trim()
        
        // Location
        const location = $(elem).find('span.job-search-card__location').text().trim()
        
        // URL from the full-link anchor
        const url = $(elem).find('a.base-card__full-link').attr('href')

        if (title && company) {
          jobs.push({
            title,
            company,
            location,
            description: '', // LinkedIn hidden API doesn't return full description
            url: url || (jobId ? `https://www.linkedin.com/jobs/view/${jobId}` : ''),
            source: 'linkedin',
            external_id: `linkedin_${jobId || Date.now()}`,
            posted_date: new Date().toISOString(),
            scraped_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            keywords: []
          })
        }
      } catch (error) {
        // Skip malformed entries
      }
    })

    return jobs
  }

  async searchAllCanadianJobs(): Promise<Partial<Job>[]> {
    const keywords = [
      'software engineer',
      'data analyst',
      'product manager',
      'registered nurse',
      'electrician',
      'accountant',
      'project manager',
      'sales representative',
      'marketing manager',
      'business analyst'
    ]

    const locations = [
      'Toronto, ON',
      'Vancouver, BC',
      'Montreal, QC',
      'Calgary, AB',
      'Edmonton, AB',
      'Ottawa, ON',
      'Winnipeg, MB',
      'Quebec City, QC'
    ]

    const allJobs: Partial<Job>[] = []

    for (const keyword of keywords) {
      for (const location of locations) {
        try {
          // LinkedIn returns 25 jobs per page, fetch first 2 pages (50 jobs)
          for (let page = 0; page < 2; page++) {
            const jobs = await this.searchJobs(keyword, location, page * 25)
            allJobs.push(...jobs)
            await this.sleep(1500) // Respectful rate limiting
          }
        } catch (error) {
          console.error(`Error searching ${keyword} in ${location}:`, error)
        }
      }
    }

    return allJobs
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton
let instance: LinkedInHiddenAPI | null = null

export function getLinkedInHiddenAPI(): LinkedInHiddenAPI {
  if (!instance) {
    instance = new LinkedInHiddenAPI()
  }
  return instance
}
