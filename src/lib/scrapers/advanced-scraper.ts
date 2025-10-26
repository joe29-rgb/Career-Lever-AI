/**
 * Advanced Web Scraper with 4-Tier Fallback Strategy
 * 
 * Strategy 1: JSON-LD Structured Data (fastest, most reliable)
 * Strategy 2: Cheerio HTML Parsing (fast, reliable for static sites)
 * Strategy 3: Puppeteer Browser (for JavaScript-heavy sites)
 * Strategy 4: Regex Extraction (last resort)
 */

import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export interface ScrapeResult {
  success: boolean
  data?: {
    title?: string
    description?: string
    requirements?: string[]
    salary?: string
    company?: string
    location?: string
    postedDate?: string
  }
  method?: 'structured' | 'cheerio' | 'puppeteer' | 'regex'
  error?: string
}

export class AdvancedScraper {
  private readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
  ]

  /**
   * Main scraping method with 3-tier fallback
   */
  async scrape(url: string): Promise<ScrapeResult> {
    if (process.env.PPX_DEBUG === 'true') {
      console.log(`[SCRAPER] Processing: ${url}`)
    }

    // Strategy 1: Structured data (JSON-LD) - fastest and most reliable
    try {
      const structured = await this.tryStructuredData(url)
      if (structured.success && structured.data?.description && structured.data.description.length > 100) {
        if (process.env.PPX_DEBUG === 'true') {
          console.log('[SCRAPER] ✓ Structured data found')
        }
        return { ...structured, method: 'structured' }
      }
    } catch (e) {
      if (process.env.PPX_DEBUG === 'true') {
        console.log('[SCRAPER] Structured data failed:', (e as Error).message)
      }
    }

    // Strategy 2: Cheerio HTML parsing - fast and reliable for static sites
    try {
      const cheerioResult = await this.tryCheerioScraping(url)
      if (cheerioResult.success && cheerioResult.data?.description && cheerioResult.data.description.length > 100) {
        if (process.env.PPX_DEBUG === 'true') {
          console.log('[SCRAPER] ✓ Cheerio parsing succeeded')
        }
        return { ...cheerioResult, method: 'cheerio' }
      }
    } catch (e) {
      if (process.env.PPX_DEBUG === 'true') {
        console.log('[SCRAPER] Cheerio failed:', (e as Error).message)
      }
    }

    // Strategy 3: Puppeteer browser - for JavaScript-heavy sites (Indeed, LinkedIn, etc.)
    try {
      const puppeteerResult = await this.tryPuppeteerScraping(url)
      if (puppeteerResult.success && puppeteerResult.data?.description && puppeteerResult.data.description.length > 100) {
        if (process.env.PPX_DEBUG === 'true') {
          console.log('[SCRAPER] ✓ Puppeteer scraping succeeded')
        }
        return { ...puppeteerResult, method: 'puppeteer' }
      }
    } catch (e) {
      if (process.env.PPX_DEBUG === 'true') {
        console.log('[SCRAPER] Puppeteer failed:', (e as Error).message)
      }
    }

    // Strategy 4: Regex extraction - last resort
    try {
      const regex = await this.tryRegexExtraction(url)
      if (regex.success && regex.data?.description && regex.data.description.length > 100) {
        if (process.env.PPX_DEBUG === 'true') {
          console.log('[SCRAPER] ✓ Regex extraction succeeded')
        }
        return { ...regex, method: 'regex' }
      }
    } catch (e) {
      if (process.env.PPX_DEBUG === 'true') {
        console.log('[SCRAPER] Regex failed:', (e as Error).message)
      }
    }

    return {
      success: false,
      error: 'All 4 scraping strategies failed - page may require login or CAPTCHA'
    }
  }

  /**
   * Strategy 1: Extract JSON-LD structured data
   * Many job boards include this for SEO
   */
  private async tryStructuredData(url: string): Promise<ScrapeResult> {
    const html = await this.fetchHTML(url)
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs)

    if (!jsonLdMatches) {
      return { success: false, error: 'No structured data found' }
    }

    for (const match of jsonLdMatches) {
      try {
        const json = JSON.parse(match.replace(/<\/?script[^>]*>/g, ''))

        // Check for JobPosting schema
        if (json['@type'] === 'JobPosting') {
          return {
            success: true,
            data: {
              title: json.title,
              description: json.description,
              company: json.hiringOrganization?.name,
              location: json.jobLocation?.address?.addressLocality || json.jobLocation?.address?.addressRegion,
              salary: this.extractSalaryFromStructured(json.baseSalary),
              postedDate: json.datePosted
            }
          }
        }
      } catch {
        continue
      }
    }

    return { success: false, error: 'No JobPosting structured data found' }
  }

  /**
   * Strategy 2: Cheerio HTML parsing
   * Works for most standard HTML pages
   */
  private async tryCheerioScraping(url: string): Promise<ScrapeResult> {
    const html = await this.fetchHTML(url)
    const $ = cheerio.load(html)

    // Remove noise elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads').remove()

    // Try multiple selectors for description (ordered by specificity)
    const descriptionSelectors = [
      '.job-description',
      '[class*="job-description"]',
      '[class*="description"]',
      '[id*="description"]',
      '[class*="job-details"]',
      '[class*="jobDetails"]',
      '[data-job-description]',
      'article',
      'main',
      '.content'
    ]

    let description = ''
    for (const selector of descriptionSelectors) {
      const text = $(selector).text().trim()
      if (text.length > description.length && text.length > 100) {
        description = text
      }
    }

    // Extract title
    const title = 
      $('h1.job-title').text() ||
      $('[class*="job-title"]').first().text() ||
      $('[class*="jobTitle"]').first().text() ||
      $('h1').first().text() ||
      ''

    // Extract requirements
    const requirements: string[] = []
    $('.requirements li, .qualifications li, [class*="requirement"] li, [class*="qualification"] li').each((i, el) => {
      const req = $(el).text().trim()
      if (req && req.length > 10 && req.length < 500) {
        requirements.push(req)
      }
    })

    // Extract salary
    const salary = this.extractSalaryFromText(html)

    // Extract company
    const company = 
      $('[class*="company-name"]').first().text() ||
      $('[class*="companyName"]').first().text() ||
      $('[data-company]').text() ||
      ''

    // Extract location
    const location = 
      $('[class*="location"]').first().text() ||
      $('[class*="job-location"]').first().text() ||
      ''

    return {
      success: description.length > 100,
      data: {
        title: this.cleanText(title),
        description: this.cleanText(description),
        requirements,
        salary: this.cleanText(salary),
        company: this.cleanText(company),
        location: this.cleanText(location)
      }
    }
  }

  /**
   * Strategy 3: Puppeteer browser scraping (for JavaScript-heavy sites)
   * Handles Indeed, LinkedIn, Glassdoor, and other dynamic job boards
   */
  private async tryPuppeteerScraping(url: string): Promise<ScrapeResult> {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null
    try {
      // Launch headless browser with optimized settings
      const args = [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-blink-features=AutomationControlled'
      ]

      const executablePath = process.env.CHROMIUM_PATH || await chromium.executablePath()

      browser = await puppeteer.launch({
        args,
        executablePath,
        headless: true,
        timeout: 30000
      })

      const page = await browser.newPage()

      // Set realistic user agent and viewport
      const userAgent = this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)]
      await page.setUserAgent(userAgent)
      await page.setViewport({ width: 1920, height: 1080 })

      // Navigate to page and wait for content
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      // Wait for job description to load (common selectors)
      await page.waitForSelector('body', { timeout: 5000 }).catch(() => {})

      // Extract job data using page.evaluate
      const data = await page.evaluate(() => {
        // Helper to clean text
        const cleanText = (text: string) => text.replace(/\s+/g, ' ').trim()

        // Extract title
        const titleSelectors = [
          'h1[class*="title"]',
          'h1[class*="jobTitle"]',
          'h1[class*="job-title"]',
          '[data-testid="jobTitle"]',
          '.job-title',
          'h1'
        ]
        let title = ''
        for (const sel of titleSelectors) {
          const el = document.querySelector(sel)
          if (el?.textContent) {
            title = cleanText(el.textContent)
            break
          }
        }

        // Extract description
        const descSelectors = [
          '[class*="jobDescriptionText"]',
          '[class*="job-description"]',
          '[id*="jobDescriptionText"]',
          '[data-testid="jobDescription"]',
          '.description',
          'article',
          'main'
        ]
        let description = ''
        for (const sel of descSelectors) {
          const el = document.querySelector(sel)
          if (el?.textContent && el.textContent.length > description.length) {
            description = cleanText(el.textContent)
          }
        }

        // Extract company
        const companySelectors = [
          '[class*="companyName"]',
          '[data-testid="companyName"]',
          '[class*="company-name"]',
          '.company'
        ]
        let company = ''
        for (const sel of companySelectors) {
          const el = document.querySelector(sel)
          if (el?.textContent) {
            company = cleanText(el.textContent)
            break
          }
        }

        // Extract location
        const locationSelectors = [
          '[class*="location"]',
          '[data-testid="location"]',
          '[class*="job-location"]'
        ]
        let location = ''
        for (const sel of locationSelectors) {
          const el = document.querySelector(sel)
          if (el?.textContent) {
            location = cleanText(el.textContent)
            break
          }
        }

        // Extract salary
        const salarySelectors = [
          '[class*="salary"]',
          '[data-testid="salary"]',
          '[class*="compensation"]'
        ]
        let salary = ''
        for (const sel of salarySelectors) {
          const el = document.querySelector(sel)
          if (el?.textContent) {
            salary = cleanText(el.textContent)
            break
          }
        }

        return { title, description, company, location, salary }
      })

      await browser.close()

      return {
        success: data.description.length > 100,
        data: {
          title: data.title,
          description: data.description,
          company: data.company,
          location: data.location,
          salary: data.salary || undefined
        }
      }
    } catch (error) {
      if (browser) {
        try { await browser.close() } catch {}
      }
      throw error
    }
  }

  /**
   * Strategy 4: Regex extraction (last resort)
   * Works when HTML structure is non-standard
   */
  private async tryRegexExtraction(url: string): Promise<ScrapeResult> {
    const html = await this.fetchHTML(url)

    // Extract description between common patterns
    const descPatterns = [
      /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/is,
      /<section[^>]*class="[^"]*job[^"]*"[^>]*>(.*?)<\/section>/is,
      /<article[^>]*>(.*?)<\/article>/is,
      /<main[^>]*>(.*?)<\/main>/is
    ]

    let description = ''
    for (const pattern of descPatterns) {
      const match = html.match(pattern)
      if (match && match[1].length > description.length) {
        description = match[1]
      }
    }

    // Extract title
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
    const title = titleMatch ? titleMatch[1] : ''

    return {
      success: description.length > 100,
      data: {
        title: this.cleanHTML(title),
        description: this.cleanHTML(description)
      }
    }
  }

  /**
   * Fetch HTML with realistic headers to avoid bot detection
   */
  private async fetchHTML(url: string): Promise<string> {
    const userAgent = this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)]

    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.google.com/'
      },
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Add small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    return await response.text()
  }

  /**
   * Helper: Extract salary from structured data
   */
  private extractSalaryFromStructured(baseSalary: any): string {
    if (!baseSalary) return ''
    if (typeof baseSalary === 'string') return baseSalary
    
    if (baseSalary.value) {
      const value = baseSalary.value.value || baseSalary.value
      const currency = baseSalary.currency || '$'
      return `${currency}${value}`
    }
    
    if (baseSalary.minValue && baseSalary.maxValue) {
      const currency = baseSalary.currency || '$'
      return `${currency}${baseSalary.minValue} - ${currency}${baseSalary.maxValue}`
    }
    
    return ''
  }

  /**
   * Helper: Extract salary from text using patterns
   */
  private extractSalaryFromText(text: string): string {
    const patterns = [
      /\$\s*[\d,]+\s*-\s*\$\s*[\d,]+/,
      /\$\s*[\d,]+k?\s*-\s*\$?\s*[\d,]+k?/i,
      /salary:\s*\$?[\d,]+\s*-\s*\$?[\d,]+/i,
      /[\d,]+\s*-\s*[\d,]+\s*per\s+(?:year|hour|month)/i,
      /compensation:\s*\$?[\d,]+\s*-\s*\$?[\d,]+/i
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) return match[0]
    }

    return ''
  }

  /**
   * Helper: Clean HTML tags and entities
   */
  private cleanHTML(html: string): string {
    return html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Helper: Clean text (whitespace only)
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()
  }
}
