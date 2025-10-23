import { PerplexityIntelligenceService } from './perplexity-intelligence'

// Define proper types
interface Job {
  title: string
  company: string
  location: string
  description: string
  url: string
  salary?: string | undefined
  postedDate?: string
  source: string
  workType?: 'Full-time' | 'Part-time' | 'Contract' | 'Remote'
  experienceLevel?: 'entry' | 'mid' | 'senior'
  isCanadian: boolean
  matchScore: number
  jobId: string
}

interface JobSearchOptions {
  experienceLevel?: 'entry' | 'mid' | 'senior'
  remote?: boolean
  salaryMin?: number
  limit?: number
}

interface JobMarketAnalysis {
  demand: 'high' | 'medium' | 'low'
  averageSalary: { min: number; max: number; currency: string }
  topSkills: string[]
  topCompanies: string[]
  growthTrend: 'increasing' | 'stable' | 'declining'
  totalOpenings: number
}

export class PerplexityJobSearchService {
  
  private static readonly JOB_BOARDS = [
    { name: 'Job Bank Canada', domain: 'jobbank.gc.ca', isCanadian: true },
    { name: 'Indeed Canada', domain: 'ca.indeed.com', isCanadian: true },
    { name: 'LinkedIn Jobs', domain: 'linkedin.com/jobs', isCanadian: false },
    { name: 'Workopolis', domain: 'workopolis.com', isCanadian: true },
    { name: 'Glassdoor Canada', domain: 'glassdoor.ca', isCanadian: true }
  ] as const
  
  // FIXED: Parallel API calls, dynamic dates, proper types
  static async searchCanadianJobs(
    keywords: string, 
    location: string, 
    options: JobSearchOptions = {}
  ): Promise<Job[]> {
    const { experienceLevel, remote, salaryMin, limit = 25 } = options
    
    // Dynamic date filter (last 30 days)
    const dateFilter = this.getDateFilter(30)
    
    // Build search queries
    const queries = this.JOB_BOARDS.map(board => {
      let query = `site:${board.domain} "${keywords}" "${location}" ${dateFilter}` 
      
      if (experienceLevel) query += ` "${experienceLevel} level"` 
      if (remote) query += ` "remote"` 
      if (salaryMin) query += ` salary:>${salaryMin}` 
      
      return { query, board }
    })
    
    // PARALLEL API CALLS
    const results = await Promise.allSettled(
      queries.map(({ query, board }) => 
        this.fetchJobsFromQuery(query, board.name, Math.ceil(limit / queries.length))
      )
    )
    
    // Collect all successful results
    const allJobs: Job[] = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allJobs.push(...result.value)
        console.log(`[${queries[index].board.name}] Found ${result.value.length} jobs`)
      } else {
        console.error(`[${queries[index].board.name}] Failed:`, result.reason)
      }
    })
    
    return this.deduplicateAndRank(allJobs, limit)
  }
  
  // FIXED: Proper job market analysis method
  static async analyzeJobMarket(
    keywords: string, 
    location: string
  ): Promise<JobMarketAnalysis | null> {
    const query = `
      Analyze the job market for "${keywords}" roles in "${location}", Canada:
      1. Current demand level (high/medium/low)
      2. Average salary range in CAD
      3. Top 5 in-demand skills for this role
      4. Top 5 companies actively hiring
      5. Market growth trend (increasing/stable/declining)
      6. Total estimated open positions
      
      Return as JSON:
      {
        "demand": "high",
        "averageSalary": {"min": 75000, "max": 95000, "currency": "CAD"},
        "topSkills": ["skill1", "skill2", ...],
        "topCompanies": ["company1", "company2", ...],
        "growthTrend": "increasing",
        "totalOpenings": 150
      }
    `
    
    try {
      const response = await PerplexityIntelligenceService.customQuery({
        systemPrompt: 'You are a labor market analyst. Return only valid JSON.',
        userPrompt: query,
        temperature: 0.2,
        maxTokens: 2000
      })
      
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Job market analysis failed:', error)
    }
    
    return null
  }
  
  // FIXED: Proper job details extraction
  static async getJobDetails(jobUrl: string): Promise<Partial<Job> | null> {
    const query = `
      Extract complete job details from ${jobUrl}:
      - Title
      - Company name
      - Location
      - Salary/compensation
      - Required experience
      - Key responsibilities (top 5)
      - Required skills
      - Benefits
      - Application deadline
      
      Return as JSON.
    `
    
    try {
      const hostname = new URL(jobUrl).hostname
      const results = await PerplexityIntelligenceService.jobQuickSearch(
        query,
        [hostname],
        1,
        'day'
      )
      
      if (results.length > 0) {
        return this.parseJobDetails(results[0], jobUrl)
      }
    } catch (error) {
      console.error('Job details extraction failed:', error)
    }
    
    return null
  }
  
  // HELPER: Fetch jobs from single query
  private static async fetchJobsFromQuery(
    query: string, 
    source: string, 
    limit: number
  ): Promise<Job[]> {
    try {
      const results = await PerplexityIntelligenceService.jobQuickSearch(
        query,
        [], // Auto-detect domains
        limit,
        'week'
      )
      
      return results.map(result => ({
        title: result.title || 'Unknown Title',
        company: this.extractCompany(result.snippet || ''),
        location: this.extractLocation(result.snippet || ''),
        description: result.snippet || '',
        url: result.url,
        salary: this.extractSalary(`${result.title} ${result.snippet}`) || undefined,
        postedDate: result.postedDate,
        source,
        isCanadian: this.isCanadianJobSite(result.url),
        matchScore: 0, // Will be calculated in deduplicateAndRank
        jobId: this.generateJobId(result.url)
      }))
    } catch (error) {
      console.error(`Query failed: ${query}`, error)
      return []
    }
  }
  
  // FIXED: Deterministic ranking, no random scores
  private static deduplicateAndRank(jobs: Job[], limit: number): Job[] {
    // Deduplicate by URL
    const uniqueJobs = new Map<string, Job>()
    jobs.forEach(job => {
      if (!uniqueJobs.has(job.url)) {
        uniqueJobs.set(job.url, {
          ...job,
          matchScore: this.calculateMatchScore(job)
        })
      }
    })
    
    // Sort by: Canadian first, then match score, then date
    const sortedJobs = Array.from(uniqueJobs.values()).sort((a, b) => {
      if (a.isCanadian && !b.isCanadian) return -1
      if (b.isCanadian && !a.isCanadian) return 1
      if (Math.abs(a.matchScore - b.matchScore) > 5) {
        return b.matchScore - a.matchScore
      }
      // Tie-breaker: most recent
      if (a.postedDate && b.postedDate) {
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
      }
      return 0
    })
    
    return sortedJobs.slice(0, limit)
  }
  
  // FIXED: Deterministic scoring based on actual relevance
  private static calculateMatchScore(job: Job): number {
    let score = 50 // Base score
    
    const content = `${job.title} ${job.description} ${job.location}`.toLowerCase()
    
    // Recency (up to +30 points)
    if (job.postedDate) {
      const daysAgo = this.getDaysAgo(job.postedDate)
      if (daysAgo <= 1) score += 30
      else if (daysAgo <= 3) score += 25
      else if (daysAgo <= 7) score += 20
      else if (daysAgo <= 14) score += 10
    }
    
    // Job type (+15 points for full-time)
    if (/\b(?:full.?time|permanent|career)\b/i.test(content)) score += 15
    
    // Canadian location (+10 points)
    if (/\b(?:canada|canadian|toronto|vancouver|montreal|calgary|ottawa)\b/i.test(content)) {
      score += 10
    }
    
    // Salary transparency (+10 points)
    if (job.salary) score += 10
    
    // Description quality (+5 points for detailed descriptions)
    if (job.description && job.description.length > 200) score += 5
    
    return Math.min(100, score)
  }
  
  // HELPER: Shared salary extraction (no duplication)
  private static extractSalary(text: string): string | null {
    const salaryRegex = /\$[\d,]+(?:\s*-\s*\$?[\d,]+)?(?:\s*(?:per|\/)\s*(?:hour|year|annum))?/i
    const match = text.match(salaryRegex)
    return match ? match[0] : null
  }
  
  // HELPER: Dynamic date filter
  private static getDateFilter(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return `after:${date.toISOString().split('T')[0]}` 
  }
  
  // HELPER: Calculate days ago from date string
  private static getDaysAgo(dateString: string): number {
    const posted = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - posted.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }
  
  // HELPER: Check if Canadian job site
  private static isCanadianJobSite(url: string): boolean {
    return /jobbank\.gc\.ca|indeed\.ca|workopolis\.com|glassdoor\.ca/i.test(url)
  }
  
  // HELPER: Generate unique job ID
  private static generateJobId(url: string): string {
    // Use crypto if available, otherwise fallback to base64
    try {
      const crypto = require('crypto')
      return `job-${crypto.createHash('md5').update(url).digest('hex').substring(0, 16)}`
    } catch {
      return `job-${Buffer.from(url).toString('base64').substring(0, 16)}`
    }
  }
  
  // HELPER: Parse job details from Perplexity response
  private static parseJobDetails(result: any, url: string): Partial<Job> {
    const text = `${result.title || ''} ${result.snippet || ''}` 
    
    return {
      title: result.title || 'Unknown Title',
      company: this.extractCompany(text),
      location: this.extractLocation(text),
      salary: this.extractSalary(text) || undefined,
      description: result.snippet || '',
      url: url,
      source: this.extractSourceName(url)
    }
  }
  
  // HELPER: Extract company name
  private static extractCompany(text: string): string {
    const patterns = [
      /at\s+([A-Z][a-zA-Z\s&]+?)(?:\s+is\s+|\s+seeks\s+|\.|,)/,
      /([A-Z][a-zA-Z\s&]+?)\s+is\s+(?:hiring|seeking|looking)/
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) return match[1].trim()
    }
    
    return 'Unknown Company'
  }
  
  // HELPER: Extract location
  private static extractLocation(text: string): string {
    const locationPattern = /(?:in|at|located)\s+([A-Z][a-zA-Z\s,]+?(?:,\s*[A-Z]{2})?)\b/
    const match = text.match(locationPattern)
    return match ? match[1].trim() : 'Location Not Specified'
  }
  
  // HELPER: Extract source name from URL
  private static extractSourceName(url: string): string {
    try {
      const hostname = new URL(url).hostname.replace('www.', '')
      const board = this.JOB_BOARDS.find(b => hostname.includes(b.domain))
      return board ? board.name : hostname
    } catch (error) {
      console.error(`Failed to parse URL: ${url}`, error)
      return url
    }
  }
}
