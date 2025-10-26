export interface Job {
  id?: string
  title: string
  company: string
  location: string
  url: string
  description: string
  salary: string | null
  source: JobSource
  posted: string
  postedDate?: string
  remoteType?: 'remote' | 'hybrid' | 'onsite'
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'temporary'
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
  matchScore?: number
  confidence?: number
  verified?: boolean
  createdAt?: string
  updatedAt?: string
}

export type JobSource = 
  | 'indeed' | 'linkedin' | 'jobbank' | 'workopolis' | 'glassdoor' | 'eluta'
  | 'jobboom' | 'monster' | 'ziprecruiter' | 'weworkremotely' | 'stackoverflow'
  | 'github' | 'angellist' | 'remote.co' | 'flexjobs' | 'other'

export interface JobSearchRequest {
  jobTitle: string
  location: string
  maxResults?: number
  workType?: 'remote' | 'hybrid' | 'onsite' | 'any'
  radius?: number
  daysPosted?: number
}

export interface JobSearchResponse {
  success: boolean
  data: Job[]
  meta: {
    total: number
    method: string
    confidence: number
    location: string
    jobTitle: string
  }
  error?: string
}
