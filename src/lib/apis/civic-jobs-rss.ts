/**
 * CIVIC JOBS RSS FEEDS
 * 
 * Government and municipal jobs from CivicJobs.ca
 * 100% legal - public RSS feeds designed for syndication
 * 
 * Expected: 500+ jobs
 */

import Parser from 'rss-parser'
import type { Job } from '@/types/supabase'

export class CivicJobsRSS {
  private parser = new Parser()

  private readonly RSS_FEEDS = [
    { url: 'https://www.civicjobs.ca/rss/alberta', location: 'Alberta' },
    { url: 'https://www.civicjobs.ca/rss/ontario', location: 'Ontario' },
    { url: 'https://www.civicjobs.ca/rss/quebec', location: 'Quebec' },
    { url: 'https://www.civicjobs.ca/rss/british-columbia', location: 'British Columbia' },
    { url: 'https://www.civicjobs.ca/rss/manitoba', location: 'Manitoba' },
    { url: 'https://www.civicjobs.ca/rss/saskatchewan', location: 'Saskatchewan' },
  ]

  async fetchAllJobs(): Promise<Partial<Job>[]> {
    console.log('[CIVIC JOBS] Fetching from RSS feeds...')
    const allJobs: Partial<Job>[] = []

    for (const feed of this.RSS_FEEDS) {
      try {
        const jobs = await this.fetchFromFeed(feed.url, feed.location)
        allJobs.push(...jobs)
        console.log(`[CIVIC JOBS] ${feed.location}: ${jobs.length} jobs`)
        await this.sleep(1000)
      } catch (error) {
        console.error(`[CIVIC JOBS] ${feed.location} Error:`, error)
      }
    }

    console.log(`[CIVIC JOBS] Total: ${allJobs.length} jobs`)
    return allJobs
  }

  private async fetchFromFeed(feedUrl: string, location: string): Promise<Partial<Job>[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl)
      
      return feed.items.map(item => ({
        title: item.title || 'Unknown',
        company: 'Government / Municipality',
        location: location,
        description: item.contentSnippet || item.content || '',
        url: item.link || '',
        source: 'civicjobs',
        external_id: `civicjobs_${Buffer.from(item.link || '').toString('base64').slice(0, 16)}`,
        posted_date: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
        scraped_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        keywords: []
      }))
    } catch (error) {
      console.error('[CIVIC JOBS] Parse error:', error)
      return []
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton
let instance: CivicJobsRSS | null = null

export function getCivicJobsRSS(): CivicJobsRSS {
  if (!instance) {
    instance = new CivicJobsRSS()
  }
  return instance
}
