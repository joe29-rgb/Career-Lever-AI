/**
 * ELUTA PUPPETEER STEALTH SCRAPER
 * 
 * Uses Puppeteer with Stealth plugin to bypass TLS fingerprinting
 * Launches REAL Chrome browser (not just HTTP client)
 * 
 * Expected: 4,000+ jobs
 */

import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import * as cheerio from 'cheerio'
import type { Job } from '@/types/supabase'
import type { Browser, Page } from 'puppeteer'

// Use stealth plugin to avoid TLS fingerprinting detection
puppeteer.use(StealthPlugin())

export class ElutaPuppeteerScraper {
  private browser: Browser | null = null

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new' as any,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Prevent memory issues
          '--ignore-certificate-errors', // Ignore SSL errors
          '--ignore-ssl-errors',
          '--allow-running-insecure-content'
        ]
      })
    }
    return this.browser
  }

  async scrapeJobs(keyword: string, location: string): Promise<Partial<Job>[]> {
    try {
      console.log(`[ELUTA PUPPETEER] Scraping: ${keyword} @ ${location}`)

      const browser = await this.initBrowser()
      const page = await browser.newPage()

      // Set realistic user agent + headers
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      })

      // Navigate to Eluta search
      const url = `https://www.eluta.ca/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`
      console.log(`[ELUTA PUPPETEER] Navigating to: ${url}`)

      await page.goto(url, {
        waitUntil: 'networkidle2', // Wait for network to be mostly idle
        timeout: 30000
      })

      // Wait for job listings to load
      try {
        await page.waitForSelector('.search-result, .job-listing, [data-job]', { timeout: 10000 })
      } catch {
        console.log(`[ELUTA PUPPETEER] No jobs found for ${keyword} @ ${location}`)
        await page.close()
        return []
      }

      // Extract job data
      const html = await page.content()
      const jobs = this.parseElutaJobs(html)

      await page.close()

      console.log(`[ELUTA PUPPETEER] Found ${jobs.length} jobs`)
      return jobs
    } catch (error) {
      console.error('[ELUTA PUPPETEER] Error:', error)
      return []
    }
  }

  private parseElutaJobs(html: string): Partial<Job>[] {
    const $ = cheerio.load(html)
    const jobs: Partial<Job>[] = []

    // Try multiple selectors
    const selectors = ['.search-result', '.job-listing', '.job-item', '[data-job]']

    for (const selector of selectors) {
      $(selector).each((i, elem) => {
        try {
          const titleElem = $(elem).find('.job-title a, h2 a, h3 a, a.title')
          const title = titleElem.text().trim()
          const url = titleElem.attr('href')

          const company = $(elem).find('.company-name, .employer, .company').text().trim()
          const location = $(elem).find('.job-location, .location').text().trim()
          const posted = $(elem).find('.posted-date, .date').text().trim()

          if (title && company && url) {
            jobs.push({
              title,
              company,
              location,
              description: '',
              url: url.startsWith('http') ? url : `https://www.eluta.ca${url}`,
              source: 'eluta',
              external_id: `eluta_${Buffer.from(url).toString('base64').slice(0, 16)}`,
              posted_date: posted ? new Date(posted).toISOString() : undefined,
              scraped_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              keywords: []
            })
          }
        } catch (error) {
          // Skip malformed entries
        }
      })

      // Stop if we found jobs
      if (jobs.length > 0) break
    }

    return jobs
  }

  async scrapeAllCanadianJobs(): Promise<Partial<Job>[]> {
    const keywords = [
      'software developer',
      'nurse',
      'electrician',
      'accountant',
      'sales',
      'marketing'
    ]

    const locations = ['Alberta', 'Ontario', 'Quebec', 'BC']

    const allJobs: Partial<Job>[] = []

    for (const keyword of keywords) {
      for (const location of locations) {
        try {
          const jobs = await this.scrapeJobs(keyword, location)
          allJobs.push(...jobs)
          await this.sleep(2000) // Rate limit
        } catch (error) {
          console.error(`Error: ${keyword} in ${location}`, error)
        }
      }
    }

    return allJobs
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton
let instance: ElutaPuppeteerScraper | null = null

export function getElutaPuppeteerScraper(): ElutaPuppeteerScraper {
  if (!instance) {
    instance = new ElutaPuppeteerScraper()
  }
  return instance
}
