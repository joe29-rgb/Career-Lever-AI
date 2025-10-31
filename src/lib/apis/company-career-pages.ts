/**
 * COMPANY CAREER PAGES SCRAPER
 * 
 * Scrapes job postings directly from company career pages
 * These are the FRESHEST jobs (posted here first)
 * Expected: 2,000-3,000 Canadian jobs
 * 
 * Legal: Public career pages, no authentication required
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import type { Job } from '@/types/supabase'
import { getTopCompanies, type CompanyCareerPage } from '@/data/top-canadian-companies'

export class CompanyCareerPagesAPI {
  
  /**
   * Scrape a single company's career page
   */
  async scrapeCompany(company: CompanyCareerPage): Promise<Partial<Job>[]> {
    try {
      console.log(`[CAREERS] Scraping: ${company.name}`)
      
      const response = await axios.get(company.careerUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000,
        proxy: false
      })
      
      const jobs = this.parseCareerPage(response.data, company)
      console.log(`[CAREERS] ${company.name}: ${jobs.length} jobs`)
      return jobs
      
    } catch (error) {
      console.error(`[CAREERS] Error scraping ${company.name}:`, error instanceof Error ? error.message : error)
      return []
    }
  }
  
  /**
   * Parse career page HTML to extract jobs
   */
  private parseCareerPage(html: string, company: CompanyCareerPage): Partial<Job>[] {
    const $ = cheerio.load(html)
    const jobs: Partial<Job>[] = []
    
    // Try multiple common patterns for job listings
    
    // Pattern 1: Links with "job", "position", "opening" in href or text
    $('a').each((i, elem) => {
      try {
        const $link = $(elem)
        const href = $link.attr('href')
        const text = $link.text().trim()
        
        // Check if this looks like a job link
        const isJobLink = href && (
          href.includes('/job/') ||
          href.includes('/position/') ||
          href.includes('/opening/') ||
          href.includes('/career/') ||
          href.includes('/apply/') ||
          text.toLowerCase().includes('apply') ||
          text.toLowerCase().includes('view job')
        )
        
        if (isJobLink && text.length > 5 && text.length < 200) {
          // Extract job title from link text or nearby heading
          let title = text
          const nearbyHeading = $link.closest('div, li, article').find('h1, h2, h3, h4').first().text().trim()
          if (nearbyHeading && nearbyHeading.length > title.length) {
            title = nearbyHeading
          }
          
          // Build full URL
          let url = href || ''
          if (url.startsWith('/')) {
            const baseUrl = new URL(company.careerUrl)
            url = `${baseUrl.protocol}//${baseUrl.host}${url}`
          }
          
          // Extract location if available
          const locationText = $link.closest('div, li, article').find('[class*="location"], [class*="city"]').first().text().trim()
          
          if (title && url) {
            jobs.push({
              title,
              company: company.name,
              location: locationText || company.location,
              description: title,
              url,
              source: 'company-careers',
              external_id: `career_${Buffer.from(url).toString('base64').slice(0, 16)}`,
              scraped_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              keywords: [company.industry.toLowerCase()]
            })
          }
        }
      } catch (error) {
        // Skip malformed entries
      }
    })
    
    // Pattern 2: Job cards/listings with specific classes
    $('[class*="job"], [class*="position"], [class*="opening"], [class*="career"]').each((i, elem) => {
      try {
        const $elem = $(elem)
        
        // Skip if this is a navigation element
        if ($elem.is('nav, header, footer')) return
        
        const title = $elem.find('h1, h2, h3, h4, [class*="title"]').first().text().trim()
        const link = $elem.find('a').first().attr('href')
        const location = $elem.find('[class*="location"], [class*="city"]').first().text().trim()
        
        if (title && title.length > 5 && title.length < 200) {
          let url = link || company.careerUrl
          if (url.startsWith('/')) {
            const baseUrl = new URL(company.careerUrl)
            url = `${baseUrl.protocol}//${baseUrl.host}${url}`
          }
          
          const jobId = `career_${company.name.toLowerCase().replace(/\s+/g, '_')}_${i}`
          
          jobs.push({
            title,
            company: company.name,
            location: location || company.location,
            description: title,
            url,
            source: 'company-careers',
            external_id: jobId,
            scraped_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            keywords: [company.industry.toLowerCase()]
          })
        }
      } catch (error) {
        // Skip malformed entries
      }
    })
    
    // Deduplicate by URL
    const uniqueJobs = new Map<string, Partial<Job>>()
    for (const job of jobs) {
      if (job.url && !uniqueJobs.has(job.url)) {
        uniqueJobs.set(job.url, job)
      }
    }
    
    return Array.from(uniqueJobs.values())
  }
  
  /**
   * Scrape all top Canadian companies
   */
  async scrapeAllCompanies(): Promise<Partial<Job>[]> {
    const companies = getTopCompanies()
    const allJobs: Partial<Job>[] = []
    
    console.log(`[CAREERS] Scraping ${companies.length} company career pages`)
    
    // Scrape in batches to avoid overwhelming servers
    const batchSize = 5
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize)
      
      const batchPromises = batch.map(company => this.scrapeCompany(company))
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          allJobs.push(...result.value)
        }
      })
      
      // Rate limiting between batches
      if (i + batchSize < companies.length) {
        await this.sleep(2000)
      }
    }
    
    console.log(`[CAREERS] Total fetched: ${allJobs.length} jobs from ${companies.length} companies`)
    return allJobs
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton
let instance: CompanyCareerPagesAPI | null = null

export function getCompanyCareerPagesAPI(): CompanyCareerPagesAPI {
  if (!instance) {
    instance = new CompanyCareerPagesAPI()
  }
  return instance
}
