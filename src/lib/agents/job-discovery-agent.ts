/**
 * JOB DISCOVERY AGENT
 * Autonomous job search across 15+ boards with Perplexity web_search + Cheerio fallback
 */

import { BaseAgent, AgentTask, AgentResult } from './base-agent'
import { COMPREHENSIVE_JOB_BOARDS, getTopJobBoards } from '../comprehensive-data-sources'
import { AdvancedScraper } from '../scrapers/advanced-scraper'

export interface JobListing {
  id?: string
  title: string
  company: string
  location: string
  url: string
  summary: string
  salary?: string | null
  postedDate?: string
  source: string
  skills?: string[]
  workType?: 'remote' | 'hybrid' | 'onsite'
  skillMatchPercent?: number
  description?: string
}

export class JobDiscoveryAgent extends BaseAgent {
  private scraper: AdvancedScraper

  constructor() {
    super('Job Discovery Agent')
    this.scraper = new AdvancedScraper()
  }

  async execute(task: AgentTask): Promise<AgentResult<JobListing[]>> {
    const { jobTitle, location, maxResults = 30 } = task.input
    const started = Date.now()

    this.log(`🔍 Searching for "${jobTitle}" in "${location}" across 15 job boards...`)

    // Get top 10 job boards by priority
    const boards = getTopJobBoards(10)
    const searchUrls = boards.map(b => ({
      name: b.name,
      url: b.searchUrl(jobTitle, location),
      priority: b.priority
    }))

    this.log(`📊 Targeting ${searchUrls.length} job boards`)

    // Try Perplexity agent first
    try {
      const perplexityJobs = await this.searchWithPerplexity(jobTitle, location, maxResults, searchUrls)
      
      if (perplexityJobs.length >= maxResults * 0.7) {
        this.log(`✅ Perplexity found ${perplexityJobs.length} jobs`)
        return {
          success: true,
          data: perplexityJobs,
          reasoning: 'Perplexity agent successfully searched multiple job boards using web_search',
          confidence: perplexityJobs.length / maxResults,
          sources: perplexityJobs.map(j => ({ title: j.title, url: j.url })),
          duration: Date.now() - started,
          method: 'perplexity'
        }
      }
      
      this.log(`⚠️ Perplexity only found ${perplexityJobs.length} jobs, trying fallback...`)
    } catch (error) {
      this.log(`❌ Perplexity failed: ${(error as Error).message}`, 'error')
    }

    // Fallback: Parallel Cheerio scraping
    this.log(`🔄 Falling back to parallel Cheerio scraping...`)
    const cheerioJobs = await this.searchWithCheerio(searchUrls, maxResults)

    return {
      success: cheerioJobs.length > 0,
      data: cheerioJobs,
      reasoning: 'Perplexity failed, used parallel Cheerio scraping across multiple boards',
      confidence: cheerioJobs.length / maxResults,
      sources: cheerioJobs.map(j => ({ title: j.title, url: j.url })),
      duration: Date.now() - started,
      method: 'cheerio'
    }
  }

  private async searchWithPerplexity(
    jobTitle: string,
    location: string,
    maxResults: number,
    searchUrls: Array<{ name: string; url: string; priority: number }>
  ): Promise<JobListing[]> {
    const prompt = `🔴 REAL-TIME JOB SEARCH - SITE OPERATORS 🔴

TASK: Find EXACTLY ${maxResults} real job listings for "${jobTitle}" in "${location}"

SEARCH METHOD: Use site: operators to search these job boards:

${searchUrls.map((s, i) => {
  try {
    const domain = new URL(s.url).hostname
    return `${i+1}. site:${domain} "${jobTitle}" "${location}"`
  } catch {
    return `${i+1}. ${s.name} "${jobTitle}" "${location}"`
  }
}).join('\n')}

EXAMPLE SEARCHES:
- site:ca.indeed.com/jobs "Software Developer" "Toronto, ON"
- site:linkedin.com/jobs "Software Developer" "Toronto, ON"
- site:glassdoor.ca/Job "Software Developer" "Toronto, ON"

EXTRACTION INSTRUCTIONS:
1. For EACH job found in search results:
   - EXTRACT job title, company name, location
   - EXTRACT the direct URL to the job posting
   - EXTRACT job description (aim for 100+ characters)
   - EXTRACT salary if visible
   - EXTRACT posted date if available
   - VERIFY company name is NOT "Confidential" or "Unknown" (skip those)

2. PRIORITIZE:
   - Jobs posted within last 30 days
   - Companies with real, identifiable names
   - Jobs with detailed descriptions
   - Remote/hybrid opportunities

CRITICAL VALIDATION:
✅ Return ${maxResults} jobs (or as many valid ones found, minimum ${Math.floor(maxResults * 0.5)})
✅ Each job MUST have: title, company (not "Confidential"), location, URL
✅ Description should be 50+ characters minimum
✅ URLs must be direct links to individual job postings (not search pages)
✅ NO listing pages like "149 Jobs in Toronto"

OUTPUT FORMAT (strict JSON array):
[{
  "title": "Senior Software Developer",
  "company": "Shopify",
  "location": "${location}",
  "url": "https://ca.indeed.com/viewjob?jk=abc123",
  "summary": "We are seeking a Senior Software Developer to join our team...",
  "salary": "$100,000 - $130,000" or null,
  "postedDate": "2025-10-20",
  "source": "indeed",
  "skills": ["Python", "React", "AWS"],
  "workType": "hybrid"
}]

AFTER JSON: Briefly explain which boards you searched and how many jobs found.

🚨 REJECTION CRITERIA:
- Less than ${Math.floor(maxResults * 0.5)} jobs
- Any "Confidential" or "Unknown" companies
- Listing page URLs (must be individual job URLs)
- Made up or fake listings

BEGIN SEARCH NOW using site: operators!`

    try {
      const response = await this.think(prompt, { maxTokens: 12000, temperature: 0.3 })
      
      // Try multiple JSON extraction methods
      let jobs: JobListing[] = []
      
      // Method 1: Find JSON array with proper brackets
      const jsonMatch = response.match(/\[\s*\{[\s\S]*?\}\s*\]/)?.[0]
      if (jsonMatch) {
        try {
          jobs = JSON.parse(jsonMatch)
          this.log(`✅ Extracted JSON using method 1`)
        } catch (e) {
          this.log(`⚠️ Method 1 failed: ${(e as Error).message}`, 'warn')
        }
      }
      
      // Method 2: Try to find and fix common JSON errors
      if (jobs.length === 0) {
        try {
          // Remove markdown code blocks
          let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '')
          // Find array
          const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*?\}\s*\]/)
          if (arrayMatch) {
            // Fix common issues: trailing commas, missing commas, etc.
            let fixed = arrayMatch[0]
              .replace(/,\s*}/g, '}')  // Remove trailing commas before }
              .replace(/,\s*\]/g, ']')  // Remove trailing commas before ]
              .replace(/}\s*{/g, '},{') // Add missing commas between objects
            
            jobs = JSON.parse(fixed)
            this.log(`✅ Extracted JSON using method 2 (with fixes)`)
          }
        } catch (e) {
          this.log(`⚠️ Method 2 failed: ${(e as Error).message}`, 'warn')
        }
      }
      
      if (jobs.length === 0) {
        this.log('❌ No valid JSON found in Perplexity response', 'error')
        throw new Error('No valid JSON found in agent response')
      }
      
      // Validate and clean jobs
      const validated = this.validateJobs(jobs, maxResults)
      
      this.log(`✅ Validated ${validated.length}/${jobs.length} jobs from Perplexity`)
      
      return validated
    } catch (error) {
      this.log(`❌ Perplexity search failed: ${(error as Error).message}`, 'error')
      throw error
    }
  }

  private async searchWithCheerio(
    searchUrls: Array<{ name: string; url: string; priority: number }>,
    maxResults: number
  ): Promise<JobListing[]> {
    this.log(`🔄 Starting parallel Cheerio scraping of ${searchUrls.length} boards...`)
    
    // Scrape all boards in parallel
    const scrapePromises = searchUrls.map(async ({ name, url }): Promise<JobListing | null> => {
      try {
        this.log(`📡 Scraping ${name}...`)
        const result = await this.scraper.scrape(url)
        
        if (result.success && result.data) {
          this.log(`✅ ${name}: Found data`)
          // Convert scraper result to job listing
          const job: JobListing = {
            title: result.data.title || 'Unknown',
            company: result.data.company || 'Unknown',
            location: result.data.location || '',
            url: url,
            summary: result.data.description || '',
            salary: result.data.salary || null,
            postedDate: result.data.postedDate || new Date().toISOString().split('T')[0],
            source: name.toLowerCase().replace(/\s+/g, '-'),
            skills: result.data.requirements || [],
            workType: 'onsite' as const,
            skillMatchPercent: 0
          }
          return job
        }
        
        this.log(`⚠️ ${name}: No data found`, 'warn')
        return null
      } catch (error) {
        this.log(`❌ ${name}: ${(error as Error).message}`, 'error')
        return null
      }
    })

    const results = await Promise.all(scrapePromises)
    const jobs = results.filter((j): j is JobListing => j !== null)
    
    this.log(`✅ Cheerio scraping complete: ${jobs.length} jobs found`)
    
    return this.validateJobs(jobs, maxResults)
  }

  private validateJobs(jobs: JobListing[], target: number): JobListing[] {
    const validated = jobs
      .filter(j => {
        // FIX: Only reject if completely missing critical fields
        if (!j.title || !j.company || !j.url) {
          this.log(`🚫 Rejected job missing critical fields: "${j.title || 'NO TITLE'}" at "${j.company || 'NO COMPANY'}"`)
          return false
        }
        
        // FIX: Don't reject based on description length - enrich later
        // Short descriptions will be enriched by URL scraping
        
        // FIX: More lenient confidential filter - only reject obvious ones
        const company = String(j.company).toLowerCase().trim()
        const isConfidential = company.includes('confidential') && company.length < 20
        if (isConfidential) {
          this.log(`🚫 Rejected confidential job: "${j.title}" at "${j.company}"`)
          return false
        }
        
        // FIX: Accept any valid HTTP URL
        if (!j.url.startsWith('http')) {
          this.log(`🚫 Rejected job with invalid URL: "${j.title}"`)
          return false
        }
        
        return true
      })
      .slice(0, target)
    
    this.log(`✅ Validation complete: ${validated.length}/${jobs.length} jobs passed`)
    
    return validated
  }
}
