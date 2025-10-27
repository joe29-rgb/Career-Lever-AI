/**
 * JSearch API Client (RapidAPI)
 * 
 * Aggregates jobs from Indeed, LinkedIn, Glassdoor, ZipRecruiter, etc.
 * FREE tier: 100 requests/month
 */

export interface JSearchJob {
  job_id: string
  employer_name: string
  employer_logo?: string
  employer_website?: string
  job_employment_type?: string
  job_title: string
  job_apply_link: string
  job_description: string
  job_is_remote: boolean
  job_posted_at_timestamp?: number
  job_posted_at_datetime_utc?: string
  job_city?: string
  job_state?: string
  job_country?: string
  job_latitude?: number
  job_longitude?: number
  job_benefits?: string[]
  job_google_link?: string
  job_offer_expiration_datetime_utc?: string
  job_offer_expiration_timestamp?: number
  job_required_experience?: {
    no_experience_required?: boolean
    required_experience_in_months?: number
    experience_mentioned?: boolean
    experience_preferred?: boolean
  }
  job_required_skills?: string[]
  job_required_education?: {
    postgraduate_degree?: boolean
    professional_school?: boolean
    high_school?: boolean
    associates_degree?: boolean
    bachelors_degree?: boolean
    degree_mentioned?: boolean
    degree_preferred?: boolean
    professional_school_mentioned?: boolean
  }
  job_experience_in_place_of_education?: boolean
  job_min_salary?: number
  job_max_salary?: number
  job_salary_currency?: string
  job_salary_period?: string
  job_highlights?: {
    Qualifications?: string[]
    Responsibilities?: string[]
    Benefits?: string[]
  }
  job_job_title?: string
  job_posting_language?: string
  job_onet_soc?: string
  job_onet_job_zone?: string
}

export interface JSearchResponse {
  status: string
  request_id: string
  parameters: {
    query: string
    page: number
    num_pages: number
  }
  data: JSearchJob[]
}

export class JSearchAPIClient {
  private readonly apiKey: string
  private readonly baseUrl = 'https://jsearch.p.rapidapi.com'

  constructor() {
    this.apiKey = process.env.JSEARCH_API_KEY || '38f4f6bd28msha1910b4388cf005p1925fejsnfbffd0d343a1'

    if (!this.apiKey) {
      console.warn('[JSEARCH] API key not configured')
    }
  }

  /**
   * Search jobs
   */
  async searchJobs(params: {
    query: string
    location?: string
    page?: number
    numPages?: number
    datePosted?: 'all' | 'today' | '3days' | 'week' | 'month'
    remoteJobsOnly?: boolean
    employmentTypes?: string
    jobRequirements?: string
    country?: string
  }): Promise<JSearchResponse> {
    const {
      query,
      location,
      page = 1,
      numPages = 1,
      datePosted = 'month',
      remoteJobsOnly = false,
      employmentTypes,
      jobRequirements,
      country = 'us'
    } = params

    // Build query string
    let fullQuery = query
    if (location) {
      fullQuery += ` in ${location}`
    }

    const queryParams = new URLSearchParams({
      query: fullQuery,
      page: page.toString(),
      num_pages: numPages.toString(),
      date_posted: datePosted,
      country
    })

    if (remoteJobsOnly) {
      queryParams.append('remote_jobs_only', 'true')
    }
    if (employmentTypes) {
      queryParams.append('employment_types', employmentTypes)
    }
    if (jobRequirements) {
      queryParams.append('job_requirements', jobRequirements)
    }

    const url = `${this.baseUrl}/search?${queryParams.toString()}`

    console.log('[JSEARCH] Searching:', { query: fullQuery, page, datePosted })

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'jsearch.p.rapidapi.com',
          'x-rapidapi-key': this.apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`JSearch API error: ${response.status} ${response.statusText}`)
      }

      const data: JSearchResponse = await response.json()
      console.log(`[JSEARCH] Found ${data.data?.length || 0} jobs`)

      return data

    } catch (error) {
      console.error('[JSEARCH] Search error:', error)
      throw error
    }
  }

  /**
   * Convert JSearch job to our JobListing format
   */
  convertToJobListing(job: JSearchJob): {
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
    skills?: string[]
  } {
    // Determine work type
    let workType: 'remote' | 'hybrid' | 'onsite' = 'onsite'
    if (job.job_is_remote) {
      workType = 'remote'
    } else if (job.job_employment_type?.toLowerCase().includes('hybrid')) {
      workType = 'hybrid'
    }

    // Format location
    const locationParts = [job.job_city, job.job_state, job.job_country].filter(Boolean)
    const location = locationParts.join(', ') || 'Remote'

    // Format salary
    let salary: string | undefined
    if (job.job_min_salary && job.job_max_salary) {
      const currency = job.job_salary_currency || 'USD'
      const period = job.job_salary_period || 'YEAR'
      salary = `${currency} $${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}/${period.toLowerCase()}`
    }

    // Determine experience level
    let experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' = 'mid'
    if (job.job_required_experience?.no_experience_required) {
      experienceLevel = 'entry'
    } else if (job.job_title.toLowerCase().includes('senior') || job.job_title.toLowerCase().includes('lead')) {
      experienceLevel = 'senior'
    } else if (job.job_title.toLowerCase().includes('principal') || job.job_title.toLowerCase().includes('director')) {
      experienceLevel = 'executive'
    }

    // Posted date
    const postedDate = job.job_posted_at_timestamp 
      ? new Date(job.job_posted_at_timestamp * 1000)
      : undefined

    return {
      jobId: `jsearch_${job.job_id}`,
      title: job.job_title,
      company: job.employer_name,
      location,
      description: job.job_description,
      url: job.job_apply_link,
      source: 'jsearch',
      salary,
      postedDate,
      workType,
      experienceLevel,
      skills: job.job_required_skills || []
    }
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }
}

// Singleton instance
let jsearchClient: JSearchAPIClient | null = null

export function getJSearchClient(): JSearchAPIClient {
  if (!jsearchClient) {
    jsearchClient = new JSearchAPIClient()
  }
  return jsearchClient
}

export default JSearchAPIClient
