/**
 * CIVIC JOBS RSS FEEDS
 * 
 * Government and municipal jobs from CivicJobs.ca
 * 100% legal - public RSS feeds designed for syndication
 * 
 * Expected: 587-1,200 jobs
 * 
 * FIXED: October 31, 2025 - Correct RSS format with query parameters
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import type { Job } from '@/types/supabase'

export class CivicJobsRSS {

  private readonly RSS_FEEDS = [
    { url: 'https://www.civicjobs.ca/rss2?province=AB', location: 'Alberta' },
    { url: 'https://www.civicjobs.ca/rss2?province=BC', location: 'British Columbia' },
    { url: 'https://www.civicjobs.ca/rss2?province=ON', location: 'Ontario' },
    { url: 'https://www.civicjobs.ca/rss2?province=QC', location: 'Quebec' },
    { url: 'https://www.civicjobs.ca/rss2?province=MB', location: 'Manitoba' },
    { url: 'https://www.civicjobs.ca/rss2?province=SK', location: 'Saskatchewan' },
    { url: 'https://www.civicjobs.ca/rss2?province=NS', location: 'Nova Scotia' },
    { url: 'https://www.civicjobs.ca/rss2?province=NB', location: 'New Brunswick' },
    { url: 'https://www.civicjobs.ca/rss2?province=NL', location: 'Newfoundland and Labrador' },
    { url: 'https://www.civicjobs.ca/rss2?province=PE', location: 'Prince Edward Island' },
    { url: 'https://www.civicjobs.ca/rss2?province=NT', location: 'Northwest Territories' },
    { url: 'https://www.civicjobs.ca/rss2?province=YT', location: 'Yukon' },
    { url: 'https://www.civicjobs.ca/rss2?province=NU', location: 'Nunavut' },
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
      const response = await axios.get(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        timeout: 15000
      })
      
      // Parse RSS XML with cheerio (handles malformed XML better)
      const $ = cheerio.load(response.data, { xmlMode: true })
      const jobs: Partial<Job>[] = []
      
      $('item').each((i, elem) => {
        try {
          const title = $(elem).find('title').text().trim()
          const link = $(elem).find('link').text().trim()
          const description = $(elem).find('description').text().trim()
          const pubDate = $(elem).find('pubDate').text().trim()
          
          // Parse description HTML to extract company and location
          const $desc = cheerio.load(description)
          
          // CivicJobs description format:
          // <strong>Employer:</strong> City of Toronto
          // <strong>Location:</strong> Toronto, ON
          const employer = $desc('strong:contains("Employer:")').parent().text()
            .replace('Employer:', '').trim()
          
          const jobLocation = $desc('strong:contains("Location:")').parent().text()
            .replace('Location:', '').trim()
          
          // Extract job ID from link
          // Format: https://www.civicjobs.ca/job/123456
          const jobId = link.match(/job\/(\d+)/)?.[1] || Date.now().toString()
          
          if (title && link) {
            jobs.push({
              title,
              company: employer || 'Municipal Government',
              location: jobLocation || location,
              description: $desc.text().trim(),
              url: link,
              source: 'civicjobs',
              external_id: `civicjobs_${jobId}`,
              posted_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              scraped_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              keywords: ['municipal', 'government', 'public sector']
            })
          }
        } catch (error) {
          // Skip malformed items
          console.debug('[CIVIC JOBS] Skipped malformed item')
        }
      })
      
      return jobs
    } catch (error) {
      console.error(`[CIVIC JOBS] Error fetching ${feedUrl}:`, error)
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
