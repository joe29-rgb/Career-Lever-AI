/**
 * Indeed RSS Feeds Integration
 * Public RSS feeds - 100% legal, no scraping, no auth
 * Zero maintenance, fast, reliable
 */

import Parser from 'rss-parser'
import type { Job } from '@/types/supabase'

export class IndeedRSSFeed {
  private parser = new Parser()
  
  /**
   * Get jobs from Indeed RSS feed
   */
  async getJobs(params: {
    keywords: string
    location: string
    fromage?: number // days (default: 7)
    radius?: number // km (default: 25)
  }): Promise<Partial<Job>[]> {
    // Try multiple Indeed RSS endpoints
    const endpoints = [
      'https://ca.indeed.com/rss',
      'https://www.indeed.ca/rss',
      'https://rss.indeed.ca/rss',
      'https://ca.rss.indeed.com/rss'
    ]
    
    for (const baseUrl of endpoints) {
      try {
        // Build RSS URL
        const url = new URL(baseUrl)
        url.searchParams.set('q', params.keywords)
        url.searchParams.set('l', params.location)
        url.searchParams.set('fromage', (params.fromage || 7).toString())
        url.searchParams.set('radius', (params.radius || 25).toString())
        url.searchParams.set('sort', 'date')
        
        console.log(`[INDEED RSS] Trying: ${baseUrl}`)
        
        // Parse RSS feed
        const feed = await this.parser.parseURL(url.toString())
        
        // Transform to Job
        const jobs: Partial<Job>[] = feed.items.map((item) => ({
          title: item.title || 'Unknown',
          company: this.extractCompany(item.contentSnippet || ''),
          location: this.extractLocation(item.contentSnippet || '') || params.location,
          description: item.contentSnippet || '',
          url: item.link || '',
          source: 'indeed',
          salary_min: undefined,
          salary_max: undefined,
          posted_date: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
          external_id: `indeed_rss_${Buffer.from(item.link || '').toString('base64').slice(0, 16)}`,
          scraped_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          keywords: []
        } as Partial<Job>))
        
        console.log(`[INDEED RSS] Success with ${baseUrl}: ${jobs.length} jobs`)
        return jobs
        
      } catch (error) {
        console.log(`[INDEED RSS] Failed with ${baseUrl}, trying next...`)
        // Continue to next endpoint
      }
    }
    
    // If all endpoints fail
    console.error('[INDEED RSS] All endpoints failed')
    return []
  }
  
  /**
   * Bulk search with multiple keywords
   */
  async bulkSearch(keywords: string[], location: string): Promise<Partial<Job>[]> {
    const allJobs: Partial<Job>[] = []
    
    for (const keyword of keywords) {
      const jobs = await this.getJobs({
        keywords: keyword,
        location,
        fromage: 7,
        radius: 150 // 150km for Edmonton area
      })
      
      allJobs.push(...jobs)
      console.log(`[INDEED RSS] ${keyword}: ${jobs.length} jobs (Total: ${allJobs.length})`)
      
      // Rate limiting
      await sleep(2000)
    }
    
    return allJobs
  }
  
  /**
   * Extract company from description
   */
  private extractCompany(description: string): string {
    // Indeed RSS format: "Company Name - City, Province"
    const match = description.match(/^([^-]+)\s*-/)
    return match ? match[1].trim() : 'Unknown'
  }
  
  /**
   * Extract location from description
   */
  private extractLocation(description: string): string | undefined {
    // Indeed RSS format: "Company Name - City, Province"
    const match = description.match(/-\s*([^-]+)$/)
    return match ? match[1].trim() : undefined
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Singleton
let instance: IndeedRSSFeed | null = null

export function getIndeedRSS(): IndeedRSSFeed {
  if (!instance) {
    instance = new IndeedRSSFeed()
  }
  return instance
}
