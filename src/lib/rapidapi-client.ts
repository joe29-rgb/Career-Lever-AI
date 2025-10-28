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
  'active-jobs-db': {
    id: 'active-jobs-db',
    name: 'Active Jobs DB',
    endpoint: 'https://active-jobs-db.p.rapidapi.com/v1/jobs/search',
    tier: 1,
    cost: 0.001,
    maxResults: 100,
    enabled: true
  },
  'jsearch': {
    id: 'jsearch',
    name: 'JSearch (Google for Jobs)',
    endpoint: 'https://jsearch.p.rapidapi.com/search',
    tier: 1,
    cost: 0.001,
    maxResults: 50,
    enabled: true
  },
  'indeed': {
    id: 'indeed',
    name: 'Indeed',
    endpoint: 'https://indeed12.p.rapidapi.com/jobs/search',
    tier: 1,
    cost: 0.001,
    maxResults: 50,
    enabled: true
  },
  'remote-jobs': {
    id: 'remote-jobs',
    name: 'Remote Jobs API',
    endpoint: 'https://remote-jobs-api.p.rapidapi.com/jobs',
    tier: 2,
    cost: 0.001,
    maxResults: 50,
    enabled: true
  },
  'linkedin': {
    id: 'linkedin',
    name: 'LinkedIn Job Search',
    endpoint: 'https://linkedin-job-search-api.p.rapidapi.com/jobs',
    tier: 2,
    cost: 0.001,
    maxResults: 100,
    enabled: true
  },
  'upwork': {
    id: 'upwork',
    name: 'Upwork Jobs',
    endpoint: 'https://upwork-jobs-api.p.rapidapi.com/jobs',
    tier: 2,
    cost: 0.001,
    maxResults: 100,
    enabled: true
  },
  'freelancer': {
    id: 'freelancer',
    name: 'Freelancer API',
    endpoint: 'https://freelancer-api.p.rapidapi.com/jobs',
    tier: 2,
    cost: 0.001,
    maxResults: 50,
    enabled: true
  },
  'startup-jobs': {
    id: 'startup-jobs',
    name: 'Startup Jobs',
    endpoint: 'https://startup-jobs-api.p.rapidapi.com/jobs',
    tier: 3,
    cost: 0.001,
    maxResults: 100,
    enabled: true
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
          query,
          location: params.location,
          remote: params.remote,
          limit: params.limit || 100
        }
      
      case 'jsearch':
        return {
          query,
          location: params.location,
          remote_jobs_only: params.remote,
          num_pages: 1,
          page: 1
        }
      
      case 'indeed':
        return {
          query,
          location: params.location,
          page: 1
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
          return (data.jobs || data.data || []).map((j: any) => ({
            id: j.id || j.job_id || `${sourceId}-${Date.now()}-${Math.random()}`,
            title: j.title || j.job_title || '',
            company: j.company || j.company_name || '',
            location: j.location || j.job_location || '',
            description: j.description || j.job_description || '',
            url: j.url || j.job_url || j.apply_url || '',
            source: sourceId,
            postedDate: j.posted_date || j.date_posted || j.publication_date,
            salary: j.salary || j.salary_range,
            remote: j.remote || j.is_remote || false,
            jobType: j.job_type ? [j.job_type] : [],
            skills: j.skills || []
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
