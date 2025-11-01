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
    { url: 'https://www.civicjobs.ca/rss/careers', location: 'Canada' }
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
          // Title format: "Job Title - Employer (City, Province)"
          const fullTitle = $(elem).find('title').text().trim()
          const link = $(elem).find('link').text().trim()
          const description = $(elem).find('description').text().trim()
          const pubDate = $(elem).find('pubDate').text().trim()
          const guid = $(elem).find('guid').text().trim()
          
          // Parse title: "Police Constable Recruit - City of New Westminster (New Westminster, BC)"
          const titleMatch = fullTitle.match(/^(.+?)\s*-\s*(.+?)\s*\((.+?)\)$/)
          
          let title = fullTitle
          let company = 'Municipal Government'
          let jobLocation = location
          
          if (titleMatch) {
            title = titleMatch[1].trim()
            company = titleMatch[2].trim()
            jobLocation = titleMatch[3].trim()
          }
          
          // Extract job ID from link or guid
          // Format: https://www.civicjobs.ca/jobs?id=98277
          const jobId = link.match(/id=(\d+)/)?.[1] || guid.match(/id=(\d+)/)?.[1] || Date.now().toString()
          
          if (title && link) {
            jobs.push({
              title,
              company,
              location: jobLocation,
              description: description.replace(/<[^>]*>/g, '').trim(),
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
