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
    const prompt = `🔴 AUTONOMOUS JOB SEARCH MISSION 🔴

TASK: Find EXACTLY ${maxResults} real job listings for "${jobTitle}" in "${location}"

MANDATORY STEPS:
1. **USE web_search tool** to visit these job board URLs (search in parallel):
${searchUrls.map((s, i) => `   ${i+1}. ${s.name}: ${s.url}`).join('\n')}

2. For EACH job found:
   - EXTRACT the job title, company, location from search results
   - CLICK the job URL and visit the actual posting page
   - SCRAPE the COMPLETE job description (minimum 300 characters)
   - VERIFY company name is NOT "Confidential" (skip those immediately)
   - EXTRACT salary if visible on the page
   - GET the posted date

3. PRIORITIZE:
   - Posted within last 14 days (prefer last 7 days)
   - Remote or hybrid work options
   - Companies with clear names (not "Confidential")
   - Jobs with detailed descriptions

CRITICAL RULES:
✅ Return EXACTLY ${maxResults} jobs (or as many as you can find up to ${maxResults})
✅ Each description MUST be >200 characters (from actual job page content)
✅ REJECT any job with "Confidential" in company name
✅ Include actual clickable URLs to job postings
✅ Extract real salary data if available
✅ Get actual posted dates

OUTPUT FORMAT (strict JSON array):
[{
  "title": "Exact title from posting",
  "company": "Real company name (NOT Confidential)",
  "location": "${location}",
  "url": "https://actual-job-posting-url.com",
  "summary": "Full job description from the actual page (300+ chars)",
  "salary": "$XX,XXX - $YY,XXX" or null,
  "postedDate": "YYYY-MM-DD",
  "source": "indeed|linkedin|glassdoor|jobbank|etc",
  "skills": ["skill1", "skill2", "skill3"],
  "workType": "remote|hybrid|onsite",
  "skillMatchPercent": 75
}]

REASONING: After the JSON, explain:
- Which job boards you searched
- How many jobs you found on each board
- Why you selected these specific jobs
- Any challenges you encountered

🚨 I WILL REJECT YOUR RESPONSE IF:
- Less than ${Math.floor(maxResults * 0.7)} jobs returned
- Any description under 200 chars
- Any "Confidential" companies included
- Any dead/broken URLs
- Made up or fake job listings

START YOUR SEARCH NOW using web_search tool!`

    try {
      const response = await this.think(prompt, { maxTokens: 8000, temperature: 0.1 })
      
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*?\]/)?.[0]
      if (!jsonMatch) {
        this.log('⚠️ No JSON found in Perplexity response', 'warn')
        throw new Error('No JSON found in agent response')
      }
      
      const jobs = JSON.parse(jsonMatch) as JobListing[]
      
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
        // Filter out confidential jobs
        if (j.company?.toLowerCase().includes('confidential')) {
          this.log(`🚫 Rejected confidential job: "${j.title}" at "${j.company}"`)
          return false
        }
        
        // Filter out jobs with too short descriptions
        if (j.summary && j.summary.length < 200) {
          this.log(`🚫 Rejected job with short description: "${j.title}" (${j.summary.length} chars)`)
          return false
        }
        
        // Filter out jobs without valid URLs
        if (!j.url || !j.url.startsWith('http')) {
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
