/**
 * Job Description Scraper
 * 
 * Fetches full job descriptions from job posting URLs
 */

import { PerplexityService } from './perplexity-service'

export interface ScrapedJobDescription {
  fullDescription: string
  requirements: string[]
  responsibilities: string[]
  qualifications: string[]
  benefits: string[]
  salary: string | null
  companyInfo: string
  applicationInstructions: string
  confidence: number
}

export class JobDescriptionScraper {
  /**
   * Scrape full job description from URL using Perplexity
   */
  static async scrapeJobDescription(jobUrl: string, jobTitle: string, company: string): Promise<ScrapedJobDescription> {
    try {
      const client = new PerplexityService()
      
      const prompt = `Visit this job posting URL and extract the COMPLETE job description: ${jobUrl}

Job Title: ${jobTitle}
Company: ${company}

Extract and return ONLY valid JSON with these fields:

{
  "fullDescription": "Complete job description text (minimum 500 words)",
  "requirements": ["Required skill 1", "Required skill 2", ...],
  "responsibilities": ["Responsibility 1", "Responsibility 2", ...],
  "qualifications": ["Qualification 1", "Qualification 2", ...],
  "benefits": ["Benefit 1", "Benefit 2", ...],
  "salary": "Salary range if mentioned, otherwise null",
  "companyInfo": "Company description from posting",
  "applicationInstructions": "How to apply instructions",
  "confidence": 0.95
}

CRITICAL REQUIREMENTS:
1. Visit the actual URL and extract ALL text from the job posting
2. Include the COMPLETE job description (not a summary)
3. Extract all requirements, responsibilities, qualifications
4. Find salary information if present
5. Get application instructions
6. Return ONLY the JSON object, no explanatory text`

      const response = await client.makeRequest(
        'You are a job posting scraper. Extract complete job descriptions from URLs and return structured JSON.',
        prompt,
        {
          temperature: 0.1,
          maxTokens: 4000,
          model: 'sonar-pro'
        }
      )

      // Parse response
      let cleanedContent = response.content.trim()
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
      
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      }

      const parsed = JSON.parse(cleanedContent) as ScrapedJobDescription

      // Validate
      if (!parsed.fullDescription || parsed.fullDescription.length < 100) {
        throw new Error('Job description too short or missing')
      }

      return parsed
    } catch (error) {
      console.error('[JOB_SCRAPER] Failed to scrape job description:', error)
      
      // Return fallback
      return {
        fullDescription: 'Failed to scrape full description. Please visit the job posting URL directly.',
        requirements: [],
        responsibilities: [],
        qualifications: [],
        benefits: [],
        salary: null,
        companyInfo: '',
        applicationInstructions: 'Visit the job posting URL to apply',
        confidence: 0
      }
    }
  }

  /**
   * Scrape job description and cache it
   */
  static async scrapeAndCache(jobUrl: string, jobTitle: string, company: string): Promise<ScrapedJobDescription> {
    const cacheKey = `job_desc:${jobUrl}`
    
    // Check cache
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    // Scrape
    const scraped = await this.scrapeJobDescription(jobUrl, jobTitle, company)
    
    // Cache for 7 days
    this.saveToCache(cacheKey, scraped, 7 * 24 * 60 * 60 * 1000)
    
    return scraped
  }

  /**
   * Simple cache implementation
   */
  private static cache = new Map<string, { data: ScrapedJobDescription; expiresAt: number }>()

  private static getFromCache(key: string): ScrapedJobDescription | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  private static saveToCache(key: string, data: ScrapedJobDescription, ttl: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    })
  }
}
