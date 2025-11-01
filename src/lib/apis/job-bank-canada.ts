/**
 * Job Bank Canada API Integration
 * Official government job board - 100% legal, unlimited, FREE
 * Documentation: https://www.jobbank.gc.ca/api/doc
 */

import * as cheerio from 'cheerio'
import type { Job } from '@/types/supabase'

export class JobBankCanadaAPI {
  private readonly BASE_URL = 'https://www.jobbank.gc.ca/jobsearch/jobsearch'
  
  /**
   * Search jobs on Job Bank Canada
   */
  async search(params: {
    keywords?: string
    location?: string
    locationId?: string // Edmonton = 9351
    pageSize?: number
    page?: number
  }): Promise<Partial<Job>[]> {
    try {
      const url = new URL(this.BASE_URL)
      url.searchParams.set('searchstring', params.keywords || '')
      url.searchParams.set('locationstring', params.location || '')
      if (params.locationId) url.searchParams.set('mid', params.locationId)
      url.searchParams.set('sort', 'D') // Date posted (newest first)
      url.searchParams.set('fprov', '48') // Alberta
      url.searchParams.set('page', (params.page || 1).toString())
      
      console.log(`[JOB BANK] Fetching: ${params.keywords} @ ${params.location || params.locationId}`)
      
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (!response.ok) {
        console.error(`[JOB BANK] HTTP ${response.status}`)
        return []
      }
      
      const html = await response.text()
      return this.parseJobBankHTML(html)
      
    } catch (error) {
      console.error('[JOB BANK] Error:', error)
      return []
    }
  }
  
  /**
   * Parse Job Bank HTML (government site, very stable structure)
   */
  private parseJobBankHTML(html: string): Partial<Job>[] {
    const jobs: Partial<Job>[] = []
    const $ = cheerio.load(html)
    
    // Structure: article.action-buttons > a.resultJobItem
    $('article.action-buttons').each((i, elem) => {
      const link = $(elem).find('a.resultJobItem')
      const title = link.find('.noctitle').text().trim()
      const company = link.find('.business').text().trim()
      const location = link.find('.location').text().trim().replace(/Location\s*/i, '')
      const url = link.attr('href')
      const salary = link.find('.salary').text().trim()
      const datePosted = link.find('.date').text().trim()
      
      if (title && company && url) {
        jobs.push({
          title,
          company,
          location: location || 'Canada',
          description: '',
          url: url.startsWith('http') ? url : `https://www.jobbank.gc.ca${url}`,
          source: 'job-bank',
          salary_min: undefined,
          salary_max: undefined,
          posted_date: this.parseDate(datePosted),
          external_id: `jobbank_${url.split('/').pop()?.split(';')[0] || Date.now()}`,
          scraped_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          keywords: []
        } as Partial<Job>)
      }
    })
    
    return jobs
  }
  
  /**
   * Parse relative dates like "2 days ago"
   */
  private parseDate(dateStr: string): string | undefined {
    if (!dateStr) return undefined
    
    const now = new Date()
    
    if (dateStr.includes('today') || dateStr.includes('Today')) {
      return now.toISOString()
    }
    
    if (dateStr.includes('yesterday') || dateStr.includes('Yesterday')) {
      now.setDate(now.getDate() - 1)
      return now.toISOString()
    }
    
    const daysMatch = dateStr.match(/(\d+)\s+days?\s+ago/i)
    if (daysMatch) {
      now.setDate(now.getDate() - parseInt(daysMatch[1]))
      return now.toISOString()
    }
    
    return undefined
  }
  
  /**
   * Get jobs by location code
   * Edmonton = 9351, Calgary = 9350, Red Deer = 9353
   */
  async getJobsByCity(cityCode: string, keywords: string[]): Promise<Partial<Job>[]> {
    const allJobs: Partial<Job>[] = []
    
    for (const keyword of keywords) {
      // Get up to 5 pages (250 jobs per keyword)
      for (let page = 1; page <= 5; page++) {
        const jobs = await this.search({
          keywords: keyword,
          locationId: cityCode,
          page
        })
        
        if (jobs.length === 0) break
        
        allJobs.push(...jobs)
        console.log(`[JOB BANK] ${keyword} - Page ${page}: ${jobs.length} jobs (Total: ${allJobs.length})`)
        
        // Rate limiting (respect government servers)
        await sleep(2000)
      }
    }
    
    return allJobs
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Singleton
let instance: JobBankCanadaAPI | null = null

export function getJobBankAPI(): JobBankCanadaAPI {
  if (!instance) {
    instance = new JobBankCanadaAPI()
  }
  return instance
}
