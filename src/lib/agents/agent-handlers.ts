/**
 * Agent Tool Handlers
 * 
 * Implements the actual logic for each tool the agent can call
 * These are the "hands" of the agent - they do the actual work
 */

import { PerplexityIntelligenceService, HiringContact } from '../perplexity-intelligence'
import { AdvancedScraper } from '../scrapers/advanced-scraper'

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
  metadata?: Record<string, unknown>
}

export class AgentToolHandlers {
  /**
   * Searches job boards for job listings
   */
  static async search_job_boards(
    job_title: string,
    location: string,
    max_results: number = 20
  ): Promise<ToolResult> {
    try {
      console.log(`[TOOL] search_job_boards: ${job_title} in ${location}`)

      // Use existing job search with validation
      const result = await PerplexityIntelligenceService.jobMarketAnalysisV2(
        location,
        '', // No resume text needed for basic search
        {
          roleHint: job_title,
          maxResults: max_results
        }
      )

      if (!result.success) {
        return {
          success: false,
          error: result.metadata?.error || 'Job search failed'
        }
      }

      // Return URLs + basic info for agent to decide which to scrape
      const jobs = result.data.map((job: { title: string; company: string; location: string; url: string; source?: string; postedDate?: string; summary?: string }) => ({
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        source: job.source,
        posted_date: job.postedDate,
        has_description: (job.summary?.length || 0) > 150,
        summary_preview: job.summary?.substring(0, 200)
      }))

      return {
        success: true,
        data: jobs,
        metadata: {
          total_found: jobs.length,
          sources_searched: 'Indeed, LinkedIn, Glassdoor, Job Bank, Wellfound'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Scrapes a specific job posting URL using AdvancedScraper
   * 3-tier fallback: JSON-LD → Cheerio → Regex
   */
  static async scrape_job_posting(
    url: string,
    company_name?: string
  ): Promise<ToolResult> {
    try {
      console.log(`[TOOL] scrape_job_posting: ${url}`)

      // Use advanced scraper with 3-tier fallback
      const scraper = new AdvancedScraper()
      const result = await scraper.scrape(url)

      if (!result.success || !result.data?.description) {
        return {
          success: false,
          error: result.error || 'Could not extract job description from URL'
        }
      }

      return {
        success: true,
        data: {
          url,
          company: company_name || result.data.company,
          title: result.data.title,
          description: result.data.description,
          requirements: result.data.requirements,
          salary: result.data.salary,
          location: result.data.location,
          scrape_method: result.method,
          description_length: result.data.description.length,
          extracted_at: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Searches LinkedIn for company employees with specific roles
   */
  static async search_linkedin_profiles(
    company_name: string,
    role_keywords: string[]
  ): Promise<ToolResult> {
    try {
      console.log(`[TOOL] search_linkedin_profiles: ${company_name}, roles: ${role_keywords.join(', ')}`)

      // Use existing hiring contacts search
      const result = await PerplexityIntelligenceService.hiringContactsV2(company_name)

      if (!result.success || result.data.length === 0) {
        return {
          success: false,
          error: `No LinkedIn profiles found for ${company_name} with roles: ${role_keywords.join(', ')}`,
          metadata: {
            suggestion: 'Try verify_company_website to find official contact emails'
          }
        }
      }

      // Filter to only profiles matching role keywords
      const filtered = result.data.filter((contact: HiringContact) => {
        const titleLower = contact.title?.toLowerCase() || ''
        return role_keywords.some(keyword => titleLower.includes(keyword.toLowerCase()))
      })

      if (filtered.length === 0) {
        return {
          success: false,
          error: `Found ${result.data.length} contacts but none matched roles: ${role_keywords.join(', ')}`,
          data: result.data.map((c: HiringContact) => ({ name: c.name, title: c.title }))
        }
      }

      return {
        success: true,
        data: filtered.map((contact: HiringContact) => ({
          name: contact.name,
          title: contact.title,
          linkedin_url: contact.linkedinUrl,
          email: contact.email,
          email_type: contact.emailType,
          confidence: contact.confidence
        })),
        metadata: {
          total_found: filtered.length,
          company: company_name
        }
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Verifies company website and extracts careers/contact info
   */
  static async verify_company_website(
    company_name: string,
    website_url?: string
  ): Promise<ToolResult> {
    try {
      console.log(`[TOOL] verify_company_website: ${company_name}`)

      const domain = website_url || `https://www.${company_name.toLowerCase().replace(/\s/g, '')}.com`

      // Fetch company website
      const response = await fetch(domain, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CareerLeverAI/1.0)'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Website returned ${response.status}: ${response.statusText}`
        }
      }

      const html = await response.text()

      // Extract key pages
      const careersPageMatch = html.match(/href="([^"]*(?:careers|jobs|work-with-us|join-us)[^"]*)"/)
      const careersPage = careersPageMatch ? new URL(careersPageMatch[1], domain).href : null

      // Extract emails
      const emailMatches = html.match(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/g) || []
      const companyDomain = new URL(domain).hostname.replace(/^www\./, '')
      
      const companyEmails = emailMatches.filter(email => {
        const emailDomain = email.split('@')[1]?.toLowerCase()
        return emailDomain?.includes(companyDomain) &&
               !email.includes('example') &&
               !email.includes('test') &&
               !email.includes('noreply')
      })

      return {
        success: true,
        data: {
          website_url: domain,
          careers_page: careersPage,
          company_emails: [...new Set(companyEmails)],
          website_accessible: true,
          company_domain: companyDomain
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Could not access company website: ${(error as Error).message}`
      }
    }
  }

  /**
   * Validates email address
   */
  static async validate_email(
    email: string,
    company_domain: string
  ): Promise<ToolResult> {
    try {
      console.log(`[TOOL] validate_email: ${email} vs ${company_domain}`)

      const emailDomain = email.split('@')[1]?.toLowerCase()
      const normalizedDomain = company_domain.toLowerCase().replace(/^www\./, '')

      // Check domain match
      const isDomainMatch = emailDomain?.includes(normalizedDomain) || false

      // Check if personal email
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com']
      const isPersonal = personalDomains.some(d => emailDomain?.includes(d))

      // Check if placeholder
      const isPlaceholder = email.includes('[') || email.includes('example.com') || email.includes('test@') || email.includes('domain.')

      const isValid = isDomainMatch && !isPersonal && !isPlaceholder

      return {
        success: true,
        data: {
          email,
          company_domain,
          is_valid: isValid,
          is_personal: isPersonal,
          is_placeholder: isPlaceholder,
          confidence: isValid ? 0.95 : 0.1,
          reason: isValid
            ? 'Email domain matches company'
            : isPersonal
              ? 'Personal email (not company domain)'
              : isPlaceholder
                ? 'Placeholder/template email'
                : 'Email domain does not match company'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Gets comprehensive company intelligence
   */
  static async get_company_intelligence(
    company_name: string
  ): Promise<ToolResult> {
    try {
      console.log(`[TOOL] get_company_intelligence: ${company_name}`)

      // Use existing company research
      const result = await PerplexityIntelligenceService.researchCompanyV2({
        company: company_name
      })

      if (!result.success) {
        return {
          success: false,
          error: 'Could not gather company intelligence'
        }
      }

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }
}
