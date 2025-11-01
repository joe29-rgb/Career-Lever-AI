/**
 * ELUTA.CA SCRAPER
 * 
 * Canadian job aggregator - pulls directly from employer websites
 * More reliable than scraping individual company sites
 * 
 * Expected: 4,000 jobs
 */

import * as cheerio from 'cheerio'
import type { Job } from '@/types/supabase'

export class ElutaScraper {
  private readonly BASE_URL = 'https://www.eluta.ca'
  private readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  
  /**
   * Scrape jobs for a keyword and location
   */
  async scrapeJobs(keyword: string, location: string): Promise<Partial<Job>[]> {
    try {
      const url = `${this.BASE_URL}/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`
      
      console.log(`[ELUTA] Scraping: ${keyword} @ ${location}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT
        }
      })
      
      if (!response.ok) {
        console.error(`[ELUTA] HTTP ${response.status}`)
        return []
      }
      
      const html = await response.text()
      const $ = cheerio.load(html)
      
      const jobs: Partial<Job>[] = []
      
      // Eluta uses job cards with class 'job-listing'
      $('.job-listing, .job-result, article.job').each((_, element) => {
        try {
          const $el = $(element)
          
          const title = $el.find('.job-title, h2, h3').first().text().trim()
          const company = $el.find('.company-name, .employer').first().text().trim()
          const locationText = $el.find('.job-location, .location').first().text().trim()
          const description = $el.find('.job-description, .description').first().text().trim()
          const link = $el.find('a').first().attr('href') || ''
          const url = link.startsWith('http') ? link : `${this.BASE_URL}${link}`
          
          if (title && company) {
            jobs.push({
              title,
              company,
              location: locationText || location,
              description,
              url,
              source: 'eluta',
              salary_min: undefined,
              salary_max: undefined,
              posted_date: undefined,
              external_id: `eluta_${Buffer.from(url).toString('base64').slice(0, 16)}`,
              scraped_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              keywords: [keyword]
            })
          }
        } catch (error) {
          // Skip invalid job listings
        }
      })
      
      console.log(`[ELUTA] Found ${jobs.length} jobs`)
      return jobs
      
    } catch (error) {
      console.error(`[ELUTA] Error:`, error)
      return []
    }
  }
  
  /**
   * Bulk scrape with multiple keywords and locations
   */
  async bulkScrape(keywords: string[], locations: string[]): Promise<Partial<Job>[]> {
    const allJobs: Partial<Job>[] = []
    
    console.log(`\n🔍 ELUTA BULK SCRAPE: ${keywords.length} keywords × ${locations.length} locations\n`)
    
    for (const location of locations) {
      for (const keyword of keywords) {
        const jobs = await this.scrapeJobs(keyword, location)
        allJobs.push(...jobs)
        console.log(`  ${keyword} @ ${location}: ${jobs.length} jobs (Total: ${allJobs.length})`)
        
        // Rate limiting (be respectful)
        await sleep(2000)
      }
    }
    
    console.log(`\n✅ ELUTA COMPLETE: ${allJobs.length} jobs\n`)
    return allJobs
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Singleton
let instance: ElutaScraper | null = null

export function getElutaScraper(): ElutaScraper {
  if (!instance) {
    instance = new ElutaScraper()
  }
  return instance
}
