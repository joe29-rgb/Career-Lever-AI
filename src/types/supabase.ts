/**
 * Supabase Database Types
 * Auto-generated from your Supabase schema
 */

export interface Job {
  id: string
  title: string
  company: string
  location: string
  description?: string
  description_html?: string
  salary_min?: number
  salary_max?: number
  salary_type?: string
  salary_currency?: string
  job_type?: string
  experience_level?: string
  remote_type?: string
  url: string
  external_id?: string
  source: 'active-jobs-db' | 'google-jobs' | 'jsearch' | 'adzuna' | 'indeed' | 'linkedin'
  apply_link?: string
  company_size?: string
  company_industry?: string
  city?: string
  state?: string
  country?: string
  keywords?: string[]
  posted_date?: string
  scraped_at?: string
  expires_at?: string
  raw_data?: any
  created_at?: string
  updated_at?: string
}

export interface Company {
  id: string
  name: string
  normalized_name?: string
  website?: string
  description?: string
  employee_count?: string
  founded_year?: number
  linkedin_url?: string
  linkedin_slug?: string
  linkedin_followers?: number
  linkedin_industry?: string
  linkedin_specialties?: string[]
  glassdoor_url?: string
  glassdoor_rating?: number
  glassdoor_review_count?: number
  headquarters_city?: string
  headquarters_state?: string
  headquarters_country?: string
  raw_data?: any
  created_at?: string
  updated_at?: string
}

export interface SalaryData {
  id: string
  job_title: string
  company?: string
  location?: string
  location_type?: string
  years_of_experience?: string
  min_salary?: number
  max_salary?: number
  median_salary?: number
  min_base_salary?: number
  max_base_salary?: number
  median_base_salary?: number
  min_additional_pay?: number
  max_additional_pay?: number
  median_additional_pay?: number
  salary_period?: string
  salary_currency?: string
  confidence?: string
  salary_count?: number
  created_at?: string
  expires_at?: string
}

export interface DownloadHistory {
  id: string
  source: string
  search_query?: string
  location?: string
  jobs_downloaded: number
  unique_jobs: number
  duplicates_found?: number
  duration_seconds?: number
  success: boolean
  error_message?: string
  started_at?: string
  completed_at?: string
}

// Search parameters
export interface JobSearchParams {
  query?: string
  location?: string
  source?: string[]
  job_type?: string
  remote_type?: string
  salary_min?: number
  limit?: number
  offset?: number
}

// Search results
export interface JobSearchResult {
  jobs: Job[]
  total: number
  page: number
  limit: number
}
