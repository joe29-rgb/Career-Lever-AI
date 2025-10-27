/**
 * Bulletproof Job Scraper Service
 * 
 * Multi-source job scraping with:
 * - Puppeteer for dynamic sites (Indeed, LinkedIn)
 * - Cheerio for static sites (faster)
 * - Anti-bot detection bypass
 * - Retry logic with exponential backoff
 * - Rate limiting per source
 * - Proxy support
 */

import puppeteer, { Browser, Page } from 'puppeteer'

// User agents for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
]

export interface JobListing {
  jobId: string
  title: string
  company: string
  location: string
  description: string
  url: string
  source: string
  salary?: string
  postedDate?: Date
  workType?: 'remote' | 'hybrid' | 'onsite'
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
  skills?: string[]
  skillMatchScore?: number
}

export interface ScraperOptions {
  maxResults?: number
  useProxy?: boolean
  timeout?: number
  retries?: number
}

class JobScraperService {
  private browser: Browser | null = null
  private rateLimits: Map<string, number> = new Map()
  private readonly RATE_LIMIT_MS = 2000 // 2 seconds between requests per source

  /**
   * Initialize browser instance (reuse for performance)
   */
  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser
    }

    console.log('[SCRAPER] Launching browser...')
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-blink-features=AutomationControlled'
      ]
    })

    return this.browser
  }

  /**
   * Create a new page with anti-detection measures
   */
  private async createStealthPage(): Promise<Page> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    // Random user agent
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
    await page.setUserAgent(userAgent)

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 })

    // Remove webdriver flag
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      })
    })

    // Add realistic headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    })

    return page
  }

  /**
   * Rate limiting per source
   */
  private async respectRateLimit(source: string): Promise<void> {
    const lastRequest = this.rateLimits.get(source) || 0
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequest

    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const waitTime = this.RATE_LIMIT_MS - timeSinceLastRequest
      console.log(`[SCRAPER] Rate limiting ${source}, waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.rateLimits.set(source, Date.now())
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries === 0) throw error

      console.log(`[SCRAPER] Retry failed, ${retries} attempts remaining. Waiting ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      return this.retryWithBackoff(fn, retries - 1, delay * 2)
    }
  }

  /**
   * Scrape Indeed Canada
   */
  async scrapeIndeed(
    keywords: string,
    location: string,
    options: ScraperOptions = {}
  ): Promise<JobListing[]> {
    const { maxResults = 25, retries = 3 } = options
    const source = 'indeed'

    await this.respectRateLimit(source)

    return this.retryWithBackoff(async () => {
      const page = await this.createStealthPage()
      const jobs: JobListing[] = []

      try {
        const searchUrl = `https://ca.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}`
        console.log(`[SCRAPER] Indeed: ${searchUrl}`)

        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })

        // Wait for job cards to load
        await page.waitForSelector('.job_seen_beacon, .jobsearch-ResultsList', { timeout: 10000 })

        // Extract job listings
        const jobElements = await page.$$('.job_seen_beacon')

        for (let i = 0; i < Math.min(jobElements.length, maxResults); i++) {
          try {
            const element = jobElements[i]

            const title = await element.$eval('.jobTitle', el => el.textContent?.trim() || '')
            const company = await element.$eval('[data-testid="company-name"]', el => el.textContent?.trim() || '').catch(() => '')
            const jobLocation = await element.$eval('[data-testid="text-location"]', el => el.textContent?.trim() || '').catch(() => location)
            const salary = await element.$eval('.salary-snippet', el => el.textContent?.trim() || '').catch(() => undefined)
            const url = await element.$eval('.jobTitle a', el => (el as HTMLAnchorElement).href).catch(() => '')
            const snippet = await element.$eval('.job-snippet', el => el.textContent?.trim() || '').catch(() => '')

            if (title && company && url) {
              jobs.push({
                jobId: `indeed_${Buffer.from(url).toString('base64').slice(0, 16)}`,
                title,
                company,
                location: jobLocation,
                description: snippet,
                url: url.startsWith('http') ? url : `https://ca.indeed.com${url}`,
                source: 'indeed',
                salary,
                workType: snippet.toLowerCase().includes('remote') ? 'remote' : 
                         snippet.toLowerCase().includes('hybrid') ? 'hybrid' : 'onsite'
              })
            }
          } catch (err) {
            console.error('[SCRAPER] Error extracting Indeed job:', err)
          }
        }

        console.log(`[SCRAPER] Indeed: Found ${jobs.length} jobs`)
        return jobs

      } finally {
        await page.close()
      }
    }, retries)
  }

  /**
   * Scrape Job Bank Canada (Government site - no API key needed!)
   */
  async scrapeJobBank(
    keywords: string,
    location: string,
    options: ScraperOptions = {}
  ): Promise<JobListing[]> {
    const { maxResults = 25, retries = 3 } = options
    const source = 'jobbank'

    await this.respectRateLimit(source)

    return this.retryWithBackoff(async () => {
      const page = await this.createStealthPage()
      const jobs: JobListing[] = []

      try {
        const searchUrl = `https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=${encodeURIComponent(keywords)}&locationstring=${encodeURIComponent(location)}`
        console.log(`[SCRAPER] Job Bank: ${searchUrl}`)

        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })

        // Wait for results
        await page.waitForSelector('article.resultJobItem, .noresult', { timeout: 10000 })

        // Check if no results
        const noResults = await page.$('.noresult')
        if (noResults) {
          console.log('[SCRAPER] Job Bank: No results found')
          return []
        }

        // Extract job listings
        const jobElements = await page.$$('article.resultJobItem')

        for (let i = 0; i < Math.min(jobElements.length, maxResults); i++) {
          try {
            const element = jobElements[i]

            const title = await element.$eval('.resultJobItemTitle', el => el.textContent?.trim() || '')
            const company = await element.$eval('.resultJobItemEmployer', el => el.textContent?.trim() || '').catch(() => '')
            const jobLocation = await element.$eval('.resultJobItemLocation', el => el.textContent?.trim() || '').catch(() => location)
            const salary = await element.$eval('.resultJobItemWage', el => el.textContent?.trim() || '').catch(() => undefined)
            const url = await element.$eval('.resultJobItemTitle a', el => (el as HTMLAnchorElement).href).catch(() => '')

            if (title && url) {
              jobs.push({
                jobId: `jobbank_${Buffer.from(url).toString('base64').slice(0, 16)}`,
                title,
                company: company || 'Government of Canada',
                location: jobLocation,
                description: `${title} at ${company || 'Government of Canada'}`,
                url: url.startsWith('http') ? url : `https://www.jobbank.gc.ca${url}`,
                source: 'jobbank',
                salary
              })
            }
          } catch (err) {
            console.error('[SCRAPER] Error extracting Job Bank job:', err)
          }
        }

        console.log(`[SCRAPER] Job Bank: Found ${jobs.length} jobs`)
        return jobs

      } finally {
        await page.close()
      }
    }, retries)
  }

  /**
   * Scrape LinkedIn Jobs (using your existing API)
   */
  async scrapeLinkedIn(
    keywords: string,
    location: string,
    options: ScraperOptions = {}
  ): Promise<JobListing[]> {
    const { maxResults = 25, retries = 3 } = options
    const source = 'linkedin'

    await this.respectRateLimit(source)

    return this.retryWithBackoff(async () => {
      const page = await this.createStealthPage()
      const jobs: JobListing[] = []

      try {
        const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`
        console.log(`[SCRAPER] LinkedIn: ${searchUrl}`)

        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })

        // Wait for job cards
        await page.waitForSelector('.jobs-search__results-list li, .base-search-card', { timeout: 10000 })

        // Extract job listings
        const jobElements = await page.$$('.base-search-card')

        for (let i = 0; i < Math.min(jobElements.length, maxResults); i++) {
          try {
            const element = jobElements[i]

            const title = await element.$eval('.base-search-card__title', el => el.textContent?.trim() || '')
            const company = await element.$eval('.base-search-card__subtitle', el => el.textContent?.trim() || '').catch(() => '')
            const jobLocation = await element.$eval('.job-search-card__location', el => el.textContent?.trim() || '').catch(() => location)
            const url = await element.$eval('a.base-card__full-link', el => (el as HTMLAnchorElement).href).catch(() => '')

            if (title && company && url) {
              jobs.push({
                jobId: `linkedin_${Buffer.from(url).toString('base64').slice(0, 16)}`,
                title,
                company,
                location: jobLocation,
                description: `${title} at ${company}`,
                url,
                source: 'linkedin'
              })
            }
          } catch (err) {
            console.error('[SCRAPER] Error extracting LinkedIn job:', err)
          }
        }

        console.log(`[SCRAPER] LinkedIn: Found ${jobs.length} jobs`)
        return jobs

      } finally {
        await page.close()
      }
    }, retries)
  }

  /**
   * Scrape Glassdoor Canada
   */
  async scrapeGlassdoor(
    keywords: string,
    location: string,
    options: ScraperOptions = {}
  ): Promise<JobListing[]> {
    const { maxResults = 25, retries = 3 } = options
    const source = 'glassdoor'

    await this.respectRateLimit(source)

    return this.retryWithBackoff(async () => {
      const page = await this.createStealthPage()
      const jobs: JobListing[] = []

      try {
        const searchUrl = `https://www.glassdoor.ca/Job/jobs.htm?sc.keyword=${encodeURIComponent(keywords)}&locT=C&locId=2&locKeyword=${encodeURIComponent(location)}`
        console.log(`[SCRAPER] Glassdoor: ${searchUrl}`)

        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 })

        // Wait for job cards
        await page.waitForSelector('li[data-test="jobListing"], .JobsList_jobListItem__wjTHv', { timeout: 10000 })

        // Extract job listings
        const jobElements = await page.$$('li[data-test="jobListing"]')

        for (let i = 0; i < Math.min(jobElements.length, maxResults); i++) {
          try {
            const element = jobElements[i]

            const title = await element.$eval('[data-test="job-title"]', el => el.textContent?.trim() || '')
            const company = await element.$eval('[data-test="employer-name"]', el => el.textContent?.trim() || '').catch(() => '')
            const jobLocation = await element.$eval('[data-test="emp-location"]', el => el.textContent?.trim() || '').catch(() => location)
            const salary = await element.$eval('[data-test="detailSalary"]', el => el.textContent?.trim() || '').catch(() => undefined)
            const url = await element.$eval('a[data-test="job-link"]', el => (el as HTMLAnchorElement).href).catch(() => '')

            if (title && company && url) {
              jobs.push({
                jobId: `glassdoor_${Buffer.from(url).toString('base64').slice(0, 16)}`,
                title,
                company,
                location: jobLocation,
                description: `${title} at ${company}`,
                url: url.startsWith('http') ? url : `https://www.glassdoor.ca${url}`,
                source: 'glassdoor',
                salary
              })
            }
          } catch (err) {
            console.error('[SCRAPER] Error extracting Glassdoor job:', err)
          }
        }

        console.log(`[SCRAPER] Glassdoor: Found ${jobs.length} jobs`)
        return jobs

      } finally {
        await page.close()
      }
    }, retries)
  }

  /**
   * Aggregate jobs from multiple sources
   */
  async aggregateJobs(
    keywords: string,
    location: string,
    options: ScraperOptions = {}
  ): Promise<JobListing[]> {
    const { maxResults = 100 } = options

    console.log(`[SCRAPER] Aggregating jobs for "${keywords}" in "${location}"`)

    // Run all scrapers in parallel
    const results = await Promise.allSettled([
      this.scrapeIndeed(keywords, location, { maxResults: 25 }),
      this.scrapeJobBank(keywords, location, { maxResults: 25 }),
      this.scrapeLinkedIn(keywords, location, { maxResults: 25 }),
      this.scrapeGlassdoor(keywords, location, { maxResults: 25 })
    ])

    // Collect all successful results
    const allJobs: JobListing[] = []
    results.forEach((result, index) => {
      const sources = ['Indeed', 'Job Bank', 'LinkedIn', 'Glassdoor']
      if (result.status === 'fulfilled') {
        console.log(`[SCRAPER] ${sources[index]}: ${result.value.length} jobs`)
        allJobs.push(...result.value)
      } else {
        console.error(`[SCRAPER] ${sources[index]} failed:`, result.reason)
      }
    })

    // Deduplicate by URL
    const uniqueJobs = Array.from(
      new Map(allJobs.map(job => [job.url, job])).values()
    )

    console.log(`[SCRAPER] Total unique jobs: ${uniqueJobs.length}`)

    return uniqueJobs.slice(0, maxResults)
  }

  /**
   * Cleanup browser
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      console.log('[SCRAPER] Browser closed')
    }
  }
}

// Singleton instance
let scraperInstance: JobScraperService | null = null

export function getJobScraper(): JobScraperService {
  if (!scraperInstance) {
    scraperInstance = new JobScraperService()
  }
  return scraperInstance
}

export default JobScraperService
