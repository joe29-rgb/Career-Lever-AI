/**
 * GOOGLE FOR JOBS SCRAPER
 * 
 * Scrapes Google's job search index (the master aggregator)
 * Coverage: 80% of all online jobs
 * Expected: 5,000-10,000 Canadian jobs
 * 
 * Legal: Public search results, no authentication required
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import type { Job } from '@/types/supabase'

export class GoogleForJobsAPI {
  private readonly BASE_URL = 'https://www.google.com/search'
  
  /**
   * Search Google for Jobs
   * Parameter &udm=8 triggers the jobs panel
   */
  async searchJobs(keyword: string, location: string): Promise<Partial<Job>[]> {
    try {
      console.log(`[GOOGLE JOBS] Searching: ${keyword} @ ${location}`)
      
      const query = `${keyword} jobs near ${location}, Canada`
      
      const response = await axios.get(this.BASE_URL, {
        params: {
          q: query,
          udm: '8', // Triggers jobs panel
          hl: 'en',
          gl: 'ca'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': 'https://www.google.com/'
        },
        timeout: 15000,
        proxy: false
      })
      
      const jobs = this.parseGoogleJobs(response.data, location, keyword)
      console.log(`[GOOGLE JOBS] Found ${jobs.length} jobs`)
      return jobs
      
    } catch (error) {
      console.error(`[GOOGLE JOBS] Error:`, error)
      return []
    }
  }
  
  /**
   * Parse Google for Jobs HTML
   */
  private parseGoogleJobs(html: string, location: string, keyword: string = ''): Partial<Job>[] {
    const $ = cheerio.load(html)
    const jobs: Partial<Job>[] = []
    
    // Google for Jobs uses various selectors depending on layout
    // Try multiple selector patterns
    
    // Pattern 1: Job cards in search results
    $('div[data-ved]').each((i, elem) => {
      try {
        const $elem = $(elem)
        
        // Extract job title
        const title = $elem.find('h2, h3, [role="heading"]').first().text().trim()
        if (!title || title.length < 3) return
        
        // Extract company
        const company = $elem.find('div[class*="company"], span[class*="company"]').first().text().trim()
        
        // Extract location
        const jobLocation = $elem.find('div[class*="location"], span[class*="location"]').first().text().trim()
        
        // Extract URL
        const link = $elem.find('a').first().attr('href')
        let url = ''
        if (link) {
          // Google wraps URLs in /url?q= format
          const urlMatch = link.match(/url\?q=([^&]+)/)
          url = urlMatch ? decodeURIComponent(urlMatch[1]) : link
        }
        
        // Extract description snippet
        const description = $elem.find('div[class*="description"], span[class*="snippet"]').first().text().trim()
        
        // Generate external ID from URL or title+company
        const externalId = url 
          ? `google_${Buffer.from(url).toString('base64').slice(0, 16)}`
          : `google_${Buffer.from(title + company).toString('base64').slice(0, 16)}`
        
        if (title && (company || url)) {
          jobs.push({
            title,
            company: company || 'Unknown',
            location: jobLocation || location,
            description: description || title,
            url: url || '',
            source: 'google-jobs',
            external_id: externalId,
            scraped_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            keywords: [keyword]
          })
        }
      } catch (error) {
        // Skip malformed entries
      }
    })
    
    // Pattern 2: Alternative job listing format
    if (jobs.length === 0) {
      $('div[class*="job"], li[class*="job"]').each((i, elem) => {
        try {
          const $elem = $(elem)
          const title = $elem.find('a, h2, h3').first().text().trim()
          const company = $elem.find('div, span').eq(1).text().trim()
          const link = $elem.find('a').first().attr('href')
          
          if (title && title.length > 3) {
            jobs.push({
              title,
              company: company || 'Unknown',
              location,
              description: title,
              url: link || '',
              source: 'google-jobs',
              external_id: `google_${Date.now()}_${i}`,
              scraped_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              keywords: [keyword]
            })
          }
        } catch (error) {
          // Skip malformed entries
        }
      })
    }
    
    return jobs
  }
  
  /**
   * Search all Canadian jobs with keyword permutations
   */
  async searchAllCanadianJobs(): Promise<Partial<Job>[]> {
    const keywords = [
      'software engineer',
      'developer',
      'data analyst',
      'nurse',
      'accountant',
      'manager',
      'sales',
      'marketing',
      'designer',
      'consultant'
    ]
    
    const locations = [
      'Toronto',
      'Vancouver',
      'Montreal',
      'Calgary',
      'Edmonton',
      'Ottawa',
      'Winnipeg'
    ]
    
    const allJobs: Partial<Job>[] = []
    
    console.log(`[GOOGLE JOBS] Searching ${keywords.length} keywords × ${locations.length} locations`)
    
    for (const keyword of keywords) {
      for (const location of locations) {
        try {
          const jobs = await this.searchJobs(keyword, location)
          allJobs.push(...jobs)
          
          // Rate limiting - Google is strict
          await this.sleep(3000)
        } catch (error) {
          console.error(`[GOOGLE JOBS] Error: ${keyword} @ ${location}`)
        }
      }
    }
    
    console.log(`[GOOGLE JOBS] Total fetched: ${allJobs.length} jobs`)
    return allJobs
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton
let instance: GoogleForJobsAPI | null = null

export function getGoogleForJobsAPI(): GoogleForJobsAPI {
  if (!instance) {
    instance = new GoogleForJobsAPI()
  }
  return instance
}
