/**
 * ELUTA RSS SCRAPER
 * Free Canadian job board - RSS feeds available
 * No API key required
 */

import Parser from 'rss-parser'
import type { Job } from '@/types/supabase'

interface ElutaRSSItem {
  title?: string
  link?: string
  employer?: string
  rating?: string
  location?: string
  description?: string
  guid?: string
  pubDate?: string
}

export class ElutaRSS {
  private parser = new Parser<Record<string, never>, ElutaRSSItem>({
    customFields: {
      item: [
        ['employer', 'employer'],
        ['rating', 'rating'],
        ['location', 'location']
      ]
    }
  })

  /**
   * Search Eluta jobs via RSS
   */
  async searchJobs(params: {
    keywords?: string
    location?: string
    maxResults?: number
  }): Promise<Partial<Job>[]> {
    const { keywords = '', location = '', maxResults = 100 } = params

    try {
      // Build Eluta RSS URL
      const url = new URL('https://www.eluta.ca/rss')
      
      if (keywords) {
        url.searchParams.set('q', keywords)
      }
      
      if (location) {
        url.searchParams.set('l', location)
      }
      
      // Sort by date (newest first)
      url.searchParams.set('sort', 'post')
      
      console.log(`[ELUTA] Fetching: ${keywords || 'all jobs'} @ ${location || 'Canada'}`)

      const feed = await this.parser.parseURL(url.toString())

      if (!feed.items || feed.items.length === 0) {
        console.log(`[ELUTA] No jobs found`)
        return []
      }

      const jobs: Partial<Job>[] = feed.items.slice(0, maxResults).map(item => ({
        title: item.title || 'Unknown Position',
        company: item.employer || 'Unknown Company',
        location: item.location || location || 'Canada',
        description: this.cleanDescription(item.description || ''),
        url: item.link || '',
        source: 'indeed' as const, // Using 'indeed' as source type since 'eluta' not in enum
        external_id: `eluta_${item.guid || item.link || ''}`,
        posted_date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        scraped_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        keywords: keywords ? keywords.split(/[\s,]+/).filter(Boolean) : []
      }))

      console.log(`[ELUTA] Found ${jobs.length} jobs`)
      return jobs

    } catch (error) {
      console.error(`[ELUTA] Error fetching jobs:`, error instanceof Error ? error.message : 'Unknown error')
      return []
    }
  }

  /**
   * Search all Alberta jobs
   */
  async searchAlbertaJobs(): Promise<Partial<Job>[]> {
    const albertaCities = [
      'Edmonton AB',
      'Calgary AB',
      'Red Deer AB',
      'Lethbridge AB',
      'Medicine Hat AB',
      'Grande Prairie AB',
      'Fort McMurray AB'
    ]

    const keywords = [
      'software', 'engineer', 'developer',
      'nurse', 'healthcare', 'medical',
      'accountant', 'finance', 'sales',
      'manager', 'administrative', 'technician'
    ]

    const allJobs: Partial<Job>[] = []

    for (const city of albertaCities) {
      for (const keyword of keywords) {
        const jobs = await this.searchJobs({
          keywords: keyword,
          location: city,
          maxResults: 50
        })
        allJobs.push(...jobs)
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return allJobs
  }

  /**
   * Clean HTML from description
   */
  private cleanDescription(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }
}

// Singleton
let instance: ElutaRSS | null = null

export function getElutaRSS(): ElutaRSS {
  if (!instance) {
    instance = new ElutaRSS()
  }
  return instance
}
