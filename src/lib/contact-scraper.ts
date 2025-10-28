/**
 * Comprehensive Contact Scraper
 * 
 * Scrapes hiring manager contacts from multiple sources:
 * 1. LinkedIn (via RapidAPI LinkedIn Scraper)
 * 2. Company website (Puppeteer + Cheerio)
 * 3. Hunter.io (email finder)
 * 4. Company Contact Scraper API (RapidAPI)
 * 
 * Validates emails and enriches with additional data
 */

import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export interface Contact {
  name: string
  title?: string
  email?: string
  linkedinUrl?: string
  phone?: string
  department?: string
  source: 'linkedin' | 'company-website' | 'hunter' | 'rapidapi' | 'manual'
  confidence: number // 0-100
  verified: boolean
}

export interface ContactScraperResult {
  success: boolean
  contacts: Contact[]
  company: string
  totalFound: number
  method: string[]
  error?: string
}

export class ContactScraper {
  private readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
  ]

  /**
   * Main method: Scrape contacts from multiple sources
   */
  async scrapeContacts(params: {
    companyName: string
    companyWebsite?: string
    linkedinCompanyUrl?: string
    jobTitle?: string
  }): Promise<ContactScraperResult> {
    console.log('[CONTACT_SCRAPER] Starting scrape for:', params.companyName)
    
    const contacts: Contact[] = []
    const methods: string[] = []
    
    // METHOD 1: RapidAPI Company Contact Scraper
    try {
      const rapidApiContacts = await this.scrapeViaRapidAPI(params.companyName, params.companyWebsite)
      if (rapidApiContacts.length > 0) {
        contacts.push(...rapidApiContacts)
        methods.push('rapidapi')
        console.log(`[CONTACT_SCRAPER] RapidAPI found ${rapidApiContacts.length} contacts`)
      }
    } catch (error) {
      console.error('[CONTACT_SCRAPER] RapidAPI error:', error)
    }
    
    // METHOD 2: LinkedIn Scraper (RapidAPI)
    if (params.linkedinCompanyUrl) {
      try {
        const linkedinContacts = await this.scrapeLinkedIn(params.linkedinCompanyUrl, params.jobTitle)
        if (linkedinContacts.length > 0) {
          contacts.push(...linkedinContacts)
          methods.push('linkedin')
          console.log(`[CONTACT_SCRAPER] LinkedIn found ${linkedinContacts.length} contacts`)
        }
      } catch (error) {
        console.error('[CONTACT_SCRAPER] LinkedIn error:', error)
      }
    }
    
    // METHOD 3: Company Website Scraping
    if (params.companyWebsite) {
      try {
        const websiteContacts = await this.scrapeCompanyWebsite(params.companyWebsite)
        if (websiteContacts.length > 0) {
          contacts.push(...websiteContacts)
          methods.push('website')
          console.log(`[CONTACT_SCRAPER] Website found ${websiteContacts.length} contacts`)
        }
      } catch (error) {
        console.error('[CONTACT_SCRAPER] Website scraping error:', error)
      }
    }
    
    // Deduplicate and rank by confidence
    const uniqueContacts = this.deduplicateContacts(contacts)
    const rankedContacts = uniqueContacts.sort((a, b) => b.confidence - a.confidence)
    
    console.log(`[CONTACT_SCRAPER] ✅ Total: ${rankedContacts.length} unique contacts`)
    
    return {
      success: rankedContacts.length > 0,
      contacts: rankedContacts,
      company: params.companyName,
      totalFound: rankedContacts.length,
      method: methods
    }
  }
  
  /**
   * METHOD 1: RapidAPI Company Contact Scraper
   */
  private async scrapeViaRapidAPI(companyName: string, website?: string): Promise<Contact[]> {
    const apiKey = process.env.RAPIDAPI_KEY
    if (!apiKey) {
      console.warn('[CONTACT_SCRAPER] No RapidAPI key found')
      return []
    }
    
    try {
      // Use Company Contact Scraper API
      const searchQuery = website || companyName
      const response = await fetch(
        `https://company-contact-scraper.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'company-contact-scraper.p.rapidapi.com'
          }
        }
      )
      
      if (!response.ok) {
        console.warn('[CONTACT_SCRAPER] RapidAPI returned', response.status)
        return []
      }
      
      const data = await response.json()
      
      // Parse response and extract contacts
      const contacts: Contact[] = []
      
      if (data.contacts && Array.isArray(data.contacts)) {
        for (const contact of data.contacts) {
          contacts.push({
            name: contact.name || 'Unknown',
            title: contact.title || contact.position,
            email: contact.email,
            phone: contact.phone,
            department: contact.department,
            source: 'rapidapi',
            confidence: 85, // High confidence from API
            verified: !!contact.email
          })
        }
      }
      
      return contacts
    } catch (error) {
      console.error('[CONTACT_SCRAPER] RapidAPI error:', error)
      return []
    }
  }
  
  /**
   * METHOD 2: LinkedIn Scraper via RapidAPI
   */
  private async scrapeLinkedIn(companyUrl: string, targetTitle?: string): Promise<Contact[]> {
    const apiKey = process.env.RAPIDAPI_KEY
    if (!apiKey) {
      console.warn('[CONTACT_SCRAPER] No RapidAPI key found')
      return []
    }
    
    try {
      // Use Real-Time LinkedIn Scraper API
      const response = await fetch(
        `https://real-time-linkedin-scraper-api.p.rapidapi.com/company-employees?url=${encodeURIComponent(companyUrl)}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'real-time-linkedin-scraper-api.p.rapidapi.com'
          }
        }
      )
      
      if (!response.ok) {
        console.warn('[CONTACT_SCRAPER] LinkedIn API returned', response.status)
        return []
      }
      
      const data = await response.json()
      const contacts: Contact[] = []
      
      if (data.employees && Array.isArray(data.employees)) {
        for (const employee of data.employees) {
          // Filter by target title if provided (e.g., "recruiter", "hiring manager", "HR")
          const title = employee.title || employee.headline || ''
          const isRelevant = !targetTitle || 
            title.toLowerCase().includes(targetTitle.toLowerCase()) ||
            title.toLowerCase().includes('recruiter') ||
            title.toLowerCase().includes('talent') ||
            title.toLowerCase().includes('hr') ||
            title.toLowerCase().includes('hiring')
          
          if (isRelevant) {
            contacts.push({
              name: employee.name || 'Unknown',
              title: title,
              linkedinUrl: employee.profileUrl || employee.url,
              source: 'linkedin',
              confidence: 90, // High confidence from LinkedIn
              verified: false // LinkedIn doesn't provide emails directly
            })
          }
        }
      }
      
      return contacts.slice(0, 10) // Limit to top 10
    } catch (error) {
      console.error('[CONTACT_SCRAPER] LinkedIn error:', error)
      return []
    }
  }
  
  /**
   * METHOD 3: Company Website Scraping (Puppeteer + Cheerio)
   */
  private async scrapeCompanyWebsite(websiteUrl: string): Promise<Contact[]> {
    console.log('[CONTACT_SCRAPER] Scraping company website:', websiteUrl)
    
    // Try Cheerio first (faster)
    try {
      const cheerioContacts = await this.scrapeWithCheerio(websiteUrl)
      if (cheerioContacts.length > 0) {
        return cheerioContacts
      }
    } catch (error) {
      console.error('[CONTACT_SCRAPER] Cheerio failed:', error)
    }
    
    // Fallback to Puppeteer (slower but handles JS)
    try {
      const puppeteerContacts = await this.scrapeWithPuppeteer(websiteUrl)
      return puppeteerContacts
    } catch (error) {
      console.error('[CONTACT_SCRAPER] Puppeteer failed:', error)
      return []
    }
  }
  
  /**
   * Scrape with Cheerio (fast, static sites)
   */
  private async scrapeWithCheerio(url: string): Promise<Contact[]> {
    const contacts: Contact[] = []
    
    // Common pages to check
    const pagesToCheck = [
      url,
      `${url}/about`,
      `${url}/team`,
      `${url}/contact`,
      `${url}/about-us`,
      `${url}/leadership`
    ]
    
    for (const pageUrl of pagesToCheck) {
      try {
        const response = await fetch(pageUrl, {
          headers: {
            'User-Agent': this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)]
          }
        })
        
        if (!response.ok) continue
        
        const html = await response.text()
        const $ = cheerio.load(html)
        
        // Extract emails
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
        const emails = html.match(emailRegex) || []
        
        // Extract names near emails
        for (const email of emails) {
          // Skip generic emails
          if (email.includes('info@') || email.includes('support@') || email.includes('sales@')) {
            continue
          }
          
          // Try to find name near email
          const emailElement = $(`a[href="mailto:${email}"]`)
          let name = emailElement.text().trim()
          
          if (!name) {
            // Try to find name in parent or sibling elements
            name = emailElement.parent().text().trim() || 
                   emailElement.prev().text().trim() ||
                   'Unknown'
          }
          
          contacts.push({
            name: name,
            email: email,
            source: 'company-website',
            confidence: 70,
            verified: false
          })
        }
        
        // Extract from team/about pages
        $('.team-member, .staff-member, .employee').each((_, element) => {
          const $el = $(element)
          const name = $el.find('.name, .member-name, h3, h4').first().text().trim()
          const title = $el.find('.title, .position, .role').first().text().trim()
          const email = $el.find('a[href^="mailto:"]').attr('href')?.replace('mailto:', '')
          
          if (name) {
            contacts.push({
              name,
              title: title || undefined,
              email: email || undefined,
              source: 'company-website',
              confidence: 75,
              verified: !!email
            })
          }
        })
        
      } catch (error) {
        console.error(`[CONTACT_SCRAPER] Error scraping ${pageUrl}:`, error)
      }
    }
    
    return contacts
  }
  
  /**
   * Scrape with Puppeteer (slow, handles JS)
   */
  private async scrapeWithPuppeteer(url: string): Promise<Contact[]> {
    let browser
    const contacts: Contact[] = []
    
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(),
        headless: true
      })
      
      const page = await browser.newPage()
      await page.setUserAgent(this.USER_AGENTS[0])
      
      // Try contact/about pages
      const pagesToCheck = [
        `${url}/contact`,
        `${url}/about`,
        `${url}/team`
      ]
      
      for (const pageUrl of pagesToCheck) {
        try {
          await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 10000 })
          
          // Extract all text
          const pageText = await page.evaluate(() => document.body.innerText)
          
          // Extract emails
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
          const emails = pageText.match(emailRegex) || []
          
          for (const email of emails) {
            if (!email.includes('info@') && !email.includes('support@')) {
              contacts.push({
                name: 'Unknown',
                email,
                source: 'company-website',
                confidence: 60,
                verified: false
              })
            }
          }
        } catch (error) {
          console.error(`[CONTACT_SCRAPER] Puppeteer error on ${pageUrl}:`, error)
        }
      }
      
    } catch (error) {
      console.error('[CONTACT_SCRAPER] Puppeteer launch error:', error)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
    
    return contacts
  }
  
  /**
   * Deduplicate contacts by email/name
   */
  private deduplicateContacts(contacts: Contact[]): Contact[] {
    const seen = new Set<string>()
    const unique: Contact[] = []
    
    for (const contact of contacts) {
      const key = contact.email || contact.name.toLowerCase()
      
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(contact)
      } else {
        // If duplicate, keep the one with higher confidence
        const existingIndex = unique.findIndex(c => 
          (c.email && c.email === contact.email) || 
          c.name.toLowerCase() === contact.name.toLowerCase()
        )
        
        if (existingIndex >= 0 && contact.confidence > unique[existingIndex].confidence) {
          unique[existingIndex] = contact
        }
      }
    }
    
    return unique
  }
  
  /**
   * Validate email address
   */
  validateEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(email)
  }
  
  /**
   * Enrich contact with additional data (e.g., guess email from name)
   */
  enrichContact(contact: Contact, companyDomain: string): Contact {
    if (!contact.email && contact.name && companyDomain) {
      // Try common email patterns
      const nameParts = contact.name.toLowerCase().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts[nameParts.length - 1]
      
      const patterns = [
        `${firstName}.${lastName}@${companyDomain}`,
        `${firstName}${lastName}@${companyDomain}`,
        `${firstName[0]}${lastName}@${companyDomain}`,
        `${firstName}@${companyDomain}`
      ]
      
      // Return first valid pattern (not verified)
      for (const pattern of patterns) {
        if (this.validateEmail(pattern)) {
          return {
            ...contact,
            email: pattern,
            confidence: Math.max(30, contact.confidence - 20), // Lower confidence for guessed emails
            verified: false
          }
        }
      }
    }
    
    return contact
  }
}

export const contactScraper = new ContactScraper()
