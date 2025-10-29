/**
 * RapidAPI Multi-Source Job Aggregator
 * 
 * Queries multiple job APIs through RapidAPI with a single key
 * Supports: Active Jobs DB, JSearch, Indeed, Remote Jobs, LinkedIn, Upwork, Freelancer, etc.
 */

export interface Job {
  id: string
  title: string
  company: string
  location?: string
  description: string
  url: string
  source: string
  postedDate?: string
  salary?: string
  remote?: boolean
  jobType?: string[]
  skills?: string[]
  matchScore?: number
  matchedSkills?: string[]
  matchPercentage?: number
}

export interface JobSource {
  id: string
  name: string
  endpoint: string
  tier: 1 | 2 | 3
  cost: number // per request
  maxResults: number
  enabled: boolean
}

export interface SearchParams {
  keywords: string[]
  location?: string
  remote?: boolean
  jobType?: string[]
  limit?: number
  experienceLevel?: string
  salaryMin?: number
}

export interface QueryMetadata {
  sources: Record<string, {
    success: boolean
    count?: number
    cost?: number
    duration?: number
    error?: string
  }>
  totalJobs: number
  uniqueJobs?: number
  duration: number
  totalCost: number
}

// Job source configurations
export const JOB_SOURCES: Record<string, JobSource> = {
  // TIER 1: Primary Discovery (Always Use)
  'google-jobs': {
    id: 'google-jobs',
    name: 'Google Jobs API',
    endpoint: 'https://google-jobs-api.p.rapidapi.com/google-jobs/distance',
    tier: 1,
    cost: 0.001,
    maxResults: 50,
    enabled: true // 520ms - FASTEST! Show results first
  },
  'active-jobs-db': {
    id: 'active-jobs-db',
    name: 'Active Jobs DB',
    endpoint: 'https://active-jobs-db.p.rapidapi.com/active-ats-24h',
    tier: 1,
    cost: 0.001,
    maxResults: 100,
    enabled: true // 851ms - 130K+ sources, AI-enriched
  },
  'jsearch': {
    id: 'jsearch',
    name: 'JSearch',
    endpoint: 'https://jsearch.p.rapidapi.com/search',
    tier: 1,
    cost: 0.001,
    maxResults: 50,
    enabled: true // 3425ms - LinkedIn/Indeed/Glassdoor aggregator
  },
  'adzuna': {
    id: 'adzuna',
    name: 'Adzuna Jobs',
    endpoint: 'https://adzuna.p.rapidapi.com/search',
    tier: 1,
    cost: 0.001,
    maxResults: 50,
    enabled: true // NEW! Adzuna job board aggregator
  },
  
  // TIER 2: Specialized (Use Based on Search Type)
  'linkedin-jobs': {
    id: 'linkedin-jobs',
    name: 'LinkedIn Jobs',
    endpoint: 'https://linkedin-jobs-api.p.rapidapi.com/jobs',
    tier: 2,
    cost: 0.001,
    maxResults: 50,
    enabled: true // 1796ms - Professional roles, $60K+
  },
  'jobs-api': {
    id: 'jobs-api',
    name: 'Jobs API',
    endpoint: 'https://jobs-api14.p.rapidapi.com/v2/list',
    tier: 2,
    cost: 0.001,
    maxResults: 50,
    enabled: true // 1892ms - LinkedIn/Bing/Xing aggregator
  },
  'remote-jobs': {
    id: 'remote-jobs',
    name: 'Remote Jobs API',
    endpoint: 'https://remote-jobs-api.p.rapidapi.com/jobs',
    tier: 2,
    cost: 0.001,
    maxResults: 50,
    enabled: false // 4549ms - Only for remote: true
  },
  'indeed': {
    id: 'indeed',
    name: 'Indeed API',
    endpoint: 'https://indeed12.p.rapidapi.com/jobs/search',
    tier: 2,
    cost: 0.001,
    maxResults: 50,
    enabled: false // 8084ms - SLOW! Only as fallback
  },
  
  // TIER 3: Freelance/Specialized (Only When Needed)
  'freelancer': {
    id: 'freelancer',
    name: 'Freelancer API',
    endpoint: 'https://freelancer-api.p.rapidapi.com/jobs',
    tier: 3,
    cost: 0.001,
    maxResults: 50,
    enabled: false // 16148ms - VERY SLOW! Only for freelance
  }
}

export class RapidAPIClient {
  private apiKey: string
  
  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY || ''
    
    if (!this.apiKey) {
      console.warn('[RapidAPI] No API key found. Set RAPIDAPI_KEY environment variable.')
    }
  }
  
  /**
   * Query a single job source
   */
  async querySource(
    sourceId: string,
    params: SearchParams
  ): Promise<{ jobs: Job[], duration: number }> {
    const source = JOB_SOURCES[sourceId]
    if (!source) {
      throw new Error(`Unknown source: ${sourceId}`)
    }
    
    if (!source.enabled) {
      console.log(`[RapidAPI] Source ${sourceId} is disabled`)
      return { jobs: [], duration: 0 }
    }
    
    const startTime = Date.now()
    
    try {
      console.log(`[RapidAPI] Querying ${source.name}...`)
      
      // Build query parameters based on source
      const queryParams = this.buildQueryParams(sourceId, params)
      const url = new URL(source.endpoint)
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': url.hostname
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const jobs = this.normalizeJobs(data, sourceId)
      const duration = Date.now() - startTime
      
      console.log(`[RapidAPI] ${source.name}: ${jobs.length} jobs in ${duration}ms`)
      
      return { jobs, duration }
      
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[RapidAPI] Error querying ${source.name}:`, error)
      throw error
    }
  }
  
  /**
   * Query a single source with pagination
   */
  async querySourceWithPagination(
    sourceId: string,
    params: SearchParams,
    maxPages: number = 3
  ): Promise<{ jobs: Job[], duration: number }> {
    const startTime = Date.now()
    const allJobs: Job[] = []
    
    console.log(`[RapidAPI] Querying ${sourceId} with pagination (${maxPages} pages)...`)
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const pageParams = { ...params, page }
        const { jobs } = await this.querySource(sourceId, pageParams)
        
        if (jobs.length === 0) {
          console.log(`[RapidAPI] ${sourceId}: No more results at page ${page}`)
          break
        }
        
        allJobs.push(...jobs)
        console.log(`[RapidAPI] ${sourceId}: Page ${page} - ${jobs.length} jobs`)
        
        // Small delay between pages to avoid rate limits
        if (page < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`[RapidAPI] ${sourceId}: Error on page ${page}:`, error)
        break
      }
    }
    
    const duration = Date.now() - startTime
    return { jobs: allJobs, duration }
  }
  
  /**
   * Query multiple sources with pagination
   */
  async queryMultipleSourcesWithPagination(
    sourceIds: string[],
    params: SearchParams,
    maxPages: number = 3
  ): Promise<{ jobs: Job[], metadata: QueryMetadata }> {
    const startTime = Date.now()
    
    console.log(`[RapidAPI] Querying ${sourceIds.length} sources with pagination (${maxPages} pages each)...`)
    
    // Query all sources with pagination
    const results = await Promise.allSettled(
      sourceIds.map(id => this.querySourceWithPagination(id, params, maxPages))
    )
    
    // Collect results
    const allJobs: Job[] = []
    const metadata: QueryMetadata = {
      sources: {},
      totalJobs: 0,
      duration: 0,
      totalCost: 0
    }
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const sourceId = sourceIds[i]
      const source = JOB_SOURCES[sourceId]
      
      if (result.status === 'fulfilled') {
        const { jobs, duration } = result.value
        allJobs.push(...jobs)
        
        metadata.sources[sourceId] = {
          success: true,
          count: jobs.length,
          cost: source.cost,
          duration
        }
        metadata.totalCost += source.cost * maxPages
      } else {
        metadata.sources[sourceId] = {
          success: false,
          count: 0,
          cost: 0,
          duration: 0,
          error: result.reason?.message || 'Unknown error'
        }
      }
    }
    
    metadata.totalJobs = allJobs.length
    metadata.duration = Date.now() - startTime
    
    return { jobs: allJobs, metadata }
  }
  
  /**
   * Query multiple sources in parallel
   */
  async queryMultipleSources(
    sourceIds: string[],
    params: SearchParams
  ): Promise<{ jobs: Job[], metadata: QueryMetadata }> {
    const startTime = Date.now()
    
    console.log(`[RapidAPI] Querying ${sourceIds.length} sources in parallel...`)
    
    // Query all sources in parallel
    const results = await Promise.allSettled(
      sourceIds.map(id => this.querySource(id, params))
    )
    
    // Collect results
    const allJobs: Job[] = []
    const metadata: QueryMetadata = {
      sources: {},
      totalJobs: 0,
      duration: 0,
      totalCost: 0
    }
    
    results.forEach((result, index) => {
      const sourceId = sourceIds[index]
      const source = JOB_SOURCES[sourceId]
      
      if (result.status === 'fulfilled') {
        const { jobs, duration } = result.value
        allJobs.push(...jobs)
        
        metadata.sources[sourceId] = {
          success: true,
          count: jobs.length,
          cost: source.cost,
          duration
        }
        metadata.totalCost += source.cost
      } else {
        metadata.sources[sourceId] = {
          success: false,
          error: result.reason.message
        }
      }
    })
    
    metadata.totalJobs = allJobs.length
    metadata.duration = Date.now() - startTime
    
    console.log(`[RapidAPI] Total: ${allJobs.length} jobs from ${sourceIds.length} sources in ${metadata.duration}ms`)
    console.log(`[RapidAPI] Cost: $${metadata.totalCost.toFixed(4)}`)
    
    return { jobs: allJobs, metadata }
  }
  
  /**
   * Build query parameters for specific source
   */
  private buildQueryParams(sourceId: string, params: SearchParams): Record<string, any> {
    const query = params.keywords.join(' ')
    
    switch (sourceId) {
      case 'active-jobs-db':
        return {
          title_filter: query || '',
          location_filter: 'Canada', // Search all of Canada
          description_type: 'text',
          limit: params.limit || 500, // Max limit for free tier
          offset: ((params.page || 1) - 1) * (params.limit || 500)
        }
      
      case 'jsearch':
        return {
          query: query ? `${query} in ${params.location}` : params.location,
          country: 'ca', // Canada only
          remote_jobs_only: params.remote,
          num_pages: 1,
          page: params.page || 1,
          date_posted: 'all' // All jobs, not just recent
        }
      
      case 'indeed':
        return {
          query,
          location: params.location,
          page_id: params.page || 1,
          locality: 'ca', // Canada
          fromage: 30, // Last 30 days
          radius: 150, // 150km radius
          sort: 'date' // Newest first
        }
      
      case 'remote-jobs':
        return {
          query,
          limit: params.limit || 50
        }
      
      case 'linkedin':
        return {
          keywords: query,
          location: params.location,
          remote: params.remote,
          limit: params.limit || 100
        }
      
      case 'upwork':
      case 'freelancer':
        return {
          query,
          limit: params.limit || 50
        }
      
      case 'startup-jobs':
        return {
          query,
          location: params.location,
          limit: params.limit || 100
        }
      
      case 'adzuna':
        return {
          what: query || '', // Empty = all jobs
          where: params.location,
          results_per_page: params.limit || 100,
          page: 1,
          sort_by: 'date'
        }
      
      case 'google-jobs':
        return {
          include: query || '',
          location: params.location,
          distance: 150 // 150km radius
        }
      
      case 'active-jobs-db':
        return {
          limit: params.limit || 1000,
          offset: 0,
          // Don't filter by title - get ALL jobs in location
          location_filter: `"${params.location}"`,
          description_type: 'text'
        }
      
      case 'jsearch':
        return {
          query: query || '',
          page: 1,
          num_pages: 10, // Get 10 pages = ~100 jobs per page = 1000 jobs
          country: 'ca', // Canada for Edmonton
          date_posted: 'all'
        }
      
      case 'linkedin-jobs':
        return {
          query: query || 'jobs',
          page: 1,
          num_pages: 1,
          country: 'us',
          date_posted: 'all'
        }
      
      default:
        return { query, location: params.location }
    }
  }
  
  /**
   * Normalize different API response formats to unified Job type
   */
  private normalizeJobs(data: any, sourceId: string): Job[] {
    try {
      switch (sourceId) {
        case 'active-jobs-db':
          return (Array.isArray(data) ? data : []).map((j: any) => ({
            id: j.id || `${sourceId}-${Date.now()}-${Math.random()}`,
            title: j.title || '',
            company: j.organization || '',
            location: (j.locations_derived || [])[0] || j.location || '',
            description: j.description || '',
            url: j.url || '',
            source: sourceId,
            postedDate: j.date_posted,
            salary: j.salary_raw,
            remote: j.remote_derived || false,
            jobType: j.employment_type || []
          }))
        
        case 'jsearch':
          return (data.data || []).map((j: any) => ({
            id: j.job_id || `${sourceId}-${Date.now()}-${Math.random()}`,
            title: j.job_title || '',
            company: j.employer_name || '',
            location: `${j.job_city || ''}, ${j.job_state || ''}`.trim(),
            description: j.job_description || '',
            url: j.job_apply_link || j.job_google_link || '',
            source: sourceId,
            postedDate: j.job_posted_at_datetime_utc,
            salary: j.job_salary || j.job_min_salary,
            remote: j.job_is_remote || false,
            jobType: j.job_employment_type ? [j.job_employment_type] : []
          }))
        
        case 'adzuna':
          return (data.results || []).map((j: any) => ({
            id: j.id || `${sourceId}-${Date.now()}-${Math.random()}`,
            title: j.title || '',
            company: j.company?.display_name || j.company || '',
            location: j.location?.display_name || j.location || '',
            description: j.description || '',
            url: j.redirect_url || j.url || '',
            source: sourceId,
            postedDate: j.created || j.date,
            salary: j.salary_min && j.salary_max 
              ? `$${j.salary_min}-$${j.salary_max}` 
              : j.salary_min 
                ? `$${j.salary_min}+`
                : undefined,
            remote: j.location?.display_name?.toLowerCase().includes('remote') || false,
            jobType: j.contract_time ? [j.contract_time] : []
          }))
        
        case 'google-jobs':
          return (data.jobs || []).map((j: any) => ({
            id: `${sourceId}-${Date.now()}-${Math.random()}`,
            title: j.title || '',
            company: j.company || '',
            location: j.location || data.filters?.appliedFilters?.location || '',
            description: j.snippet || j.description || '',
            url: j.link || j.url || '',
            source: sourceId,
            postedDate: j.postedDate,
            salary: j.salary,
            remote: j.remote || data.filters?.appliedFilters?.remote || false,
            jobType: j.jobType ? [j.jobType] : []
          }))
        
        case 'indeed':
          return (data.jobs || data.data || []).map((j: any) => ({
            id: j.id || j.job_id || `${sourceId}-${Date.now()}-${Math.random()}`,
            title: j.title || j.job_title || '',
            company: j.company || j.company_name || '',
            location: j.location || '',
            description: j.description || j.job_description || '',
            url: j.url || j.link || '',
            source: sourceId,
            postedDate: j.date || j.posted_date,
            salary: j.salary,
            remote: j.remote || false
          }))
        
        case 'remote-jobs':
        case 'linkedin':
        case 'upwork':
        case 'freelancer':
        case 'startup-jobs':
          // Generic normalization for other sources
          return (data.jobs || data.data || data.results || []).map((j: any) => ({
            id: j.id || j.job_id || `${sourceId}-${Date.now()}-${Math.random()}`,
            title: j.title || j.job_title || j.name || '',
            company: j.company || j.company_name || j.employer || '',
            location: j.location || j.job_location || '',
            description: j.description || j.job_description || j.details || '',
            url: j.url || j.link || j.apply_url || '',
            source: sourceId,
            postedDate: j.posted_date || j.date || j.created_at,
            salary: j.salary || j.budget,
            remote: j.remote || j.is_remote || false,
            jobType: j.job_type ? [j.job_type] : []
          }))
        
        default:
          console.warn(`[RapidAPI] Unknown source format: ${sourceId}`)
          return []
      }
    } catch (error) {
      console.error(`[RapidAPI] Error normalizing jobs from ${sourceId}:`, error)
      return []
    }
  }
}

// Export singleton instance
export const rapidAPIClient = new RapidAPIClient()
