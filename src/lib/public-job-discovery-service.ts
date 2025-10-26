/**
 * Public Job Discovery Service
 * 
 * Discovers jobs from PUBLIC sources only:
 * 1. Canadian job boards (Job Bank, Jobboom, Workopolis)
 * 2. Major boards via Perplexity scraping (LinkedIn, Indeed, Glassdoor)
 * 3. Open API aggregators (Adzuna, Careerjet, USAJobs)
 * 4. ATS platforms (Greenhouse, Lever, Workable, Ashby)
 */

import { PerplexityService } from './perplexity-service'
import { PerplexityIntelligenceService } from './perplexity-intelligence'
import {
  ALL_PUBLIC_BOARDS,
  CANADIAN_JOB_BOARDS,
  ATS_COMPANY_DIRECTORY,
  DISCOVERY_PRIORITY_ORDER,
  type PublicJobBoardConfig
} from './public-job-boards-config'

export interface JobSearchQuery {
  keywords: string
  location?: string
  boards?: string[]  // Specific boards to search, or all if empty
  limit?: number
  remote?: boolean
  salaryMin?: number
  experienceLevel?: 'entry' | 'mid' | 'senior'
}

export interface DiscoveredJob {
  id: string
  title: string
  company: string
  location: string
  description: string
  url: string
  salary?: string
  datePosted?: string
  source: string
  sourceDisplayName: string
  sourceType: 'scraping' | 'api' | 'ats'
  applyMethod: 'external' | 'direct' | 'manual'
}

export class PublicJobDiscoveryService {
  private perplexity: PerplexityService

  constructor() {
    this.perplexity = new PerplexityService()
  }

  /**
   * Main entry point - discover jobs from all available public sources
   */
  async discoverJobs(query: JobSearchQuery): Promise<DiscoveredJob[]> {
    const { keywords, location = 'Canada', boards, limit = 100 } = query

    // Determine which boards to search
    const boardsToSearch = boards && boards.length > 0
      ? boards
      : DISCOVERY_PRIORITY_ORDER

    console.log(`[JOB_DISCOVERY] Searching ${boardsToSearch.length} job boards for "${keywords}" in ${location}`)

    // Search all boards in parallel
    const searchPromises = boardsToSearch.map(boardName => 
      this.searchSingleBoard(boardName, query).catch(error => {
        console.error(`[JOB_DISCOVERY] Failed to search ${boardName}:`, error)
        return []
      })
    )

    const results = await Promise.all(searchPromises)
    const allJobs = results.flat()

    // Deduplicate and rank
    const uniqueJobs = this.deduplicateJobs(allJobs)
    const rankedJobs = this.rankJobsByRelevance(uniqueJobs, query)

    console.log(`[JOB_DISCOVERY] Found ${rankedJobs.length} unique jobs from ${boardsToSearch.length} sources`)

    return rankedJobs.slice(0, limit)
  }

  /**
   * Search a single job board
   */
  private async searchSingleBoard(boardName: string, query: JobSearchQuery): Promise<DiscoveredJob[]> {
    const config = ALL_PUBLIC_BOARDS[boardName]
    
    if (!config) {
      console.warn(`[JOB_DISCOVERY] Unknown board: ${boardName}`)
      return []
    }

    if (!config.features.canDiscoverJobs) {
      console.warn(`[JOB_DISCOVERY] ${config.displayName} does not support job discovery`)
      return []
    }

    // Route to appropriate search method
    switch (config.accessType) {
      case 'scraping-allowed':
      case 'government-open':
        return this.searchViaPerplexity(config, query)
      
      case 'public-api':
        return this.searchViaPublicAPI(config, query)
      
      case 'ats-public':
        return this.searchViaATS(config, query)
      
      default:
        console.warn(`[JOB_DISCOVERY] Unknown access type for ${config.displayName}`)
        return []
    }
  }

  /**
   * Search via Perplexity web scraping (Canadian boards, LinkedIn, Indeed, Glassdoor)
   */
  private async searchViaPerplexity(
    config: PublicJobBoardConfig,
    query: JobSearchQuery
  ): Promise<DiscoveredJob[]> {
    if (!config.scrapingConfig?.canUsePerplexity) {
      return []
    }

    const { keywords, location = 'Canada', remote, salaryMin } = query

    // Build Perplexity search query
    let searchQuery = config.scrapingConfig.perplexityQuery
      .replace('{keywords}', keywords)
      .replace('{location}', location)

    if (remote) {
      searchQuery += ' remote'
    }

    if (salaryMin) {
      searchQuery += ` salary:>${salaryMin}`
    }

    try {
      const results = await PerplexityIntelligenceService.jobQuickSearch(
        searchQuery,
        [new URL(config.scrapingConfig.baseUrl).hostname],
        20,
        'week'
      )

      return results.map((result: any) => this.normalizeJob(result, config, 'scraping'))
    } catch (error) {
      console.error(`[JOB_DISCOVERY] Perplexity search failed for ${config.displayName}:`, error)
      return []
    }
  }

  /**
   * Search via public APIs (Adzuna, Careerjet, USAJobs)
   */
  private async searchViaPublicAPI(
    config: PublicJobBoardConfig,
    query: JobSearchQuery
  ): Promise<DiscoveredJob[]> {
    if (!config.apiConfig) {
      return []
    }

    const { keywords, location = 'Canada' } = query

    try {
      // Route to specific API implementation
      switch (config.name) {
        case 'adzuna':
          return this.searchAdzuna(keywords, location)
        
        case 'careerjet':
          return this.searchCareerjet(keywords, location)
        
        case 'usajobs':
          return this.searchUSAJobs(keywords, location)
        
        default:
          console.warn(`[JOB_DISCOVERY] No API implementation for ${config.name}`)
          return []
      }
    } catch (error) {
      console.error(`[JOB_DISCOVERY] API search failed for ${config.displayName}:`, error)
      return []
    }
  }

  /**
   * Search via ATS platforms (Greenhouse, Lever, Workable, Ashby)
   */
  private async searchViaATS(
    config: PublicJobBoardConfig,
    query: JobSearchQuery
  ): Promise<DiscoveredJob[]> {
    if (!config.apiConfig) {
      return []
    }

    const { keywords } = query
    const companies = ATS_COMPANY_DIRECTORY[config.name] || []

    if (companies.length === 0) {
      return []
    }

    // Search all companies using this ATS
    const companySearches = companies.map(company =>
      this.searchATSCompany(config, company, keywords).catch(() => [])
    )

    const results = await Promise.all(companySearches)
    return results.flat()
  }

  /**
   * Search jobs from a specific company's ATS
   */
  private async searchATSCompany(
    config: PublicJobBoardConfig,
    company: string,
    keywords: string
  ): Promise<DiscoveredJob[]> {
    try {
      const url = `${config.apiConfig!.baseUrl}/${company}${config.name === 'lever' ? '?mode=json' : config.name === 'greenhouse' ? '/jobs?content=true' : ''}`
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CareerLeverAI/1.0'
        }
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      const jobs = this.parseATSJobs(data, config.name, company)
      
      // Filter by keywords
      return jobs.filter(job => 
        job.title.toLowerCase().includes(keywords.toLowerCase()) ||
        job.description.toLowerCase().includes(keywords.toLowerCase())
      )
    } catch (error) {
      return []
    }
  }

  /**
   * Parse ATS-specific job formats
   */
  private parseATSJobs(data: any, atsName: string, company: string): DiscoveredJob[] {
    const jobs: any[] = data.jobs || data.postings || data || []

    return jobs.map(job => ({
      id: job.id || job.externalId || `${company}-${job.title}`,
      title: job.title || job.text || '',
      company: company,
      location: job.location?.name || job.location || job.categories?.location || '',
      description: job.description || job.content?.description || '',
      url: job.hostedUrl || job.applyUrl || `https://jobs.${atsName}.com/${company}/${job.id}`,
      salary: this.extractSalary(job),
      datePosted: job.createdAt || job.publishedAt || new Date().toISOString(),
      source: atsName,
      sourceDisplayName: ALL_PUBLIC_BOARDS[atsName].displayName,
      sourceType: 'ats' as const,
      applyMethod: 'external' as const
    }))
  }

  /**
   * Adzuna API search
   */
  private async searchAdzuna(keywords: string, location: string): Promise<DiscoveredJob[]> {
    const appId = process.env.ADZUNA_APP_ID
    const appKey = process.env.ADZUNA_API_KEY

    if (!appId || !appKey) {
      console.warn('[JOB_DISCOVERY] Adzuna API credentials not configured')
      return []
    }

    try {
      const country = location.includes('Canada') ? 'ca' : 'us'
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        what: keywords,
        where: location,
        results_per_page: '50'
      })}`

      const response = await fetch(url)
      const data = await response.json()

      return (data.results || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        description: job.description,
        url: job.redirect_url,
        salary: job.salary_min ? `$${job.salary_min} - $${job.salary_max}` : undefined,
        datePosted: job.created,
        source: 'adzuna',
        sourceDisplayName: 'Adzuna',
        sourceType: 'api',
        applyMethod: 'external'
      }))
    } catch (error) {
      console.error('[JOB_DISCOVERY] Adzuna search failed:', error)
      return []
    }
  }

  /**
   * Careerjet API search
   */
  private async searchCareerjet(keywords: string, location: string): Promise<DiscoveredJob[]> {
    const apiKey = process.env.CAREERJET_API_KEY

    if (!apiKey) {
      console.warn('[JOB_DISCOVERY] Careerjet API key not configured')
      return []
    }

    // Careerjet implementation would go here
    // Omitted for brevity - similar pattern to Adzuna
    return []
  }

  /**
   * USAJobs API search
   */
  private async searchUSAJobs(keywords: string, location: string): Promise<DiscoveredJob[]> {
    const apiKey = process.env.USAJOBS_API_KEY
    const email = process.env.USAJOBS_EMAIL

    if (!apiKey || !email) {
      console.warn('[JOB_DISCOVERY] USAJobs API credentials not configured')
      return []
    }

    // USAJobs implementation would go here
    // Omitted for brevity - similar pattern to Adzuna
    return []
  }

  /**
   * Normalize job from different sources into common format
   */
  private normalizeJob(rawJob: any, config: PublicJobBoardConfig, sourceType: 'scraping' | 'api' | 'ats'): DiscoveredJob {
    return {
      id: rawJob.id || rawJob.url || `${config.name}-${Date.now()}`,
      title: rawJob.title || rawJob.jobTitle || '',
      company: rawJob.company || rawJob.companyName || '',
      location: rawJob.location || rawJob.jobLocation || '',
      description: rawJob.description || rawJob.summary || '',
      url: rawJob.url || rawJob.link || '',
      salary: rawJob.salary,
      datePosted: rawJob.postedDate || rawJob.date || new Date().toISOString(),
      source: config.name,
      sourceDisplayName: config.displayName,
      sourceType,
      applyMethod: 'external'
    }
  }

  /**
   * Deduplicate jobs by title + company
   */
  private deduplicateJobs(jobs: DiscoveredJob[]): DiscoveredJob[] {
    const unique = new Map<string, DiscoveredJob>()

    for (const job of jobs) {
      const key = `${job.title.toLowerCase().trim()}-${job.company.toLowerCase().trim()}`
      
      // Prefer API results over scraping if duplicate
      if (!unique.has(key) || (unique.get(key)!.sourceType === 'scraping' && job.sourceType === 'api')) {
        unique.set(key, job)
      }
    }

    return Array.from(unique.values())
  }

  /**
   * Rank jobs by relevance to query
   */
  private rankJobsByRelevance(jobs: DiscoveredJob[], query: JobSearchQuery): DiscoveredJob[] {
    return jobs.sort((a, b) => {
      let scoreA = 0
      let scoreB = 0

      // Prefer Canadian sources
      if (CANADIAN_JOB_BOARDS[a.source]) scoreA += 10
      if (CANADIAN_JOB_BOARDS[b.source]) scoreB += 10

      // Prefer recent posts
      if (a.datePosted && this.isRecent(a.datePosted)) scoreA += 5
      if (b.datePosted && this.isRecent(b.datePosted)) scoreB += 5

      // Prefer jobs with salary info
      if (a.salary) scoreA += 3
      if (b.salary) scoreB += 3

      // Prefer API/ATS over scraping (more reliable data)
      if (a.sourceType !== 'scraping') scoreA += 2
      if (b.sourceType !== 'scraping') scoreB += 2

      return scoreB - scoreA
    })
  }

  /**
   * Check if job was posted recently (within 7 days)
   */
  private isRecent(datePosted: string): boolean {
    const posted = new Date(datePosted)
    const now = new Date()
    const daysDiff = (now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7
  }

  /**
   * Extract salary from various formats
   */
  private extractSalary(job: any): string | undefined {
    if (job.salary) return job.salary
    if (job.salaryMin && job.salaryMax) return `$${job.salaryMin} - $${job.salaryMax}`
    if (job.compensation?.min && job.compensation?.max) return `$${job.compensation.min} - $${job.compensation.max}`
    return undefined
  }
}

