/**
 * Adzuna API Client
 * 
 * Official job board aggregator API with FREE tier
 * Coverage: Canada, US, UK, 20+ countries
 */

export interface AdzunaJob {
  id: string
  title: string
  company: {
    display_name: string
  }
  location: {
    display_name: string
    area: string[]
  }
  description: string
  redirect_url: string
  salary_min?: number
  salary_max?: number
  salary_is_predicted?: boolean
  created: string
  contract_time?: string
  contract_type?: string
  category: {
    label: string
    tag: string
  }
}

export interface AdzunaSearchParams {
  what: string // Job title or keywords
  where: string // Location
  country?: 'ca' | 'us' | 'gb' | 'au' // Default: ca (Canada)
  resultsPerPage?: number // Default: 50, Max: 50
  page?: number // Default: 1
  sortBy?: 'relevance' | 'date' | 'salary' // Default: relevance
  maxDaysOld?: number // Only jobs posted in last N days
  fullTime?: boolean
  partTime?: boolean
  contract?: boolean
  permanent?: boolean
}

export interface AdzunaSearchResponse {
  results: AdzunaJob[]
  count: number
  mean: number
  __CLASS__: string
}

export class AdzunaAPIClient {
  private readonly appId: string
  private readonly appKey: string
  private readonly baseUrl = 'https://api.adzuna.com/v1/api/jobs'

  constructor() {
    this.appId = process.env.ADZUNA_APP_ID || 'b0300aa2'
    this.appKey = process.env.ADZUNA_API_KEY || '19f3a3c651c39d4073b1a66516d38432'

    if (!this.appId || !this.appKey) {
      console.warn('[ADZUNA] API credentials not configured')
    }
  }

  /**
   * Search jobs on Adzuna
   */
  async searchJobs(params: AdzunaSearchParams): Promise<AdzunaSearchResponse> {
    const {
      what,
      where,
      country = 'ca',
      resultsPerPage = 50,
      page = 1,
      sortBy = 'relevance',
      maxDaysOld,
      fullTime,
      partTime,
      contract,
      permanent
    } = params

    const url = `${this.baseUrl}/${country}/search/${page}`

    const queryParams: Record<string, string> = {
      app_id: this.appId,
      app_key: this.appKey,
      what,
      where,
      results_per_page: resultsPerPage.toString(),
      sort_by: sortBy,
      'content-type': 'application/json'
    }

    // Optional filters
    if (maxDaysOld) queryParams.max_days_old = maxDaysOld.toString()
    if (fullTime !== undefined) queryParams.full_time = fullTime ? '1' : '0'
    if (partTime !== undefined) queryParams.part_time = partTime ? '1' : '0'
    if (contract !== undefined) queryParams.contract = contract ? '1' : '0'
    if (permanent !== undefined) queryParams.permanent = permanent ? '1' : '0'

    const queryString = new URLSearchParams(queryParams).toString()
    const fullUrl = `${url}?${queryString}`

    console.log('[ADZUNA] Searching:', { what, where, country, resultsPerPage })

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`)
      }

      const data: AdzunaSearchResponse = await response.json()
      console.log(`[ADZUNA] Found ${data.results.length} jobs (total: ${data.count})`)

      return data

    } catch (error) {
      console.error('[ADZUNA] Search error:', error)
      throw error
    }
  }

  /**
   * Search multiple pages
   */
  async searchMultiplePages(
    params: AdzunaSearchParams,
    maxPages: number = 2
  ): Promise<AdzunaJob[]> {
    const allJobs: AdzunaJob[] = []

    for (let page = 1; page <= maxPages; page++) {
      try {
        const response = await this.searchJobs({ ...params, page })
        allJobs.push(...response.results)

        // Stop if we've got all results
        if (allJobs.length >= response.count) {
          break
        }

        // Rate limiting - wait 500ms between requests
        if (page < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`[ADZUNA] Error on page ${page}:`, error)
        break
      }
    }

    return allJobs
  }

  /**
   * Convert Adzuna job to our JobListing format
   */
  convertToJobListing(job: AdzunaJob): {
    jobId: string
    title: string
    company: string
    location: string
    description: string
    url: string
    source: string
    salary?: string
    postedDate?: Date
    workType?: 'remote' | 'hybrid' | 'onsite'
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
  } {
    // Determine work type from description
    const descLower = job.description.toLowerCase()
    let workType: 'remote' | 'hybrid' | 'onsite' = 'onsite'
    if (descLower.includes('remote') || descLower.includes('work from home')) {
      workType = 'remote'
    } else if (descLower.includes('hybrid')) {
      workType = 'hybrid'
    }

    // Format salary
    let salary: string | undefined
    if (job.salary_min && job.salary_max) {
      const currency = job.location.area[0] === 'Canada' ? 'CAD' : 'USD'
      salary = `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()} ${currency}`
      if (job.salary_is_predicted) {
        salary += ' (estimated)'
      }
    }

    // Determine experience level from title
    const titleLower = job.title.toLowerCase()
    let experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' = 'mid'
    if (titleLower.includes('junior') || titleLower.includes('entry')) {
      experienceLevel = 'entry'
    } else if (titleLower.includes('senior') || titleLower.includes('lead')) {
      experienceLevel = 'senior'
    } else if (titleLower.includes('principal') || titleLower.includes('director') || titleLower.includes('vp')) {
      experienceLevel = 'executive'
    }

    return {
      jobId: `adzuna_${job.id}`,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      url: job.redirect_url,
      source: 'adzuna',
      salary,
      postedDate: new Date(job.created),
      workType,
      experienceLevel
    }
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!(this.appId && this.appKey)
  }
}

// Singleton instance
let adzunaClient: AdzunaAPIClient | null = null

export function getAdzunaClient(): AdzunaAPIClient {
  if (!adzunaClient) {
    adzunaClient = new AdzunaAPIClient()
  }
  return adzunaClient
}

export default AdzunaAPIClient
