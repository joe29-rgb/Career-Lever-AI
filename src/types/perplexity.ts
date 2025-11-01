/**
 * TYPE DEFINITIONS FOR PERPLEXITY API
 * 
 * Properly typed Perplexity responses and requests
 */

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface PerplexityRequest {
  model: string
  messages: PerplexityMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  return_citations?: boolean
  return_images?: boolean
  search_domain_filter?: string[]
  search_recency_filter?: string
}

export interface PerplexityCitation {
  url: string
  title?: string
  snippet?: string
}

export interface PerplexityChoice {
  index: number
  finish_reason: string
  message: {
    role: string
    content: string
  }
  delta?: {
    role?: string
    content?: string
  }
}

export interface PerplexityUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface PerplexityResponse {
  id: string
  model: string
  created: number
  usage: PerplexityUsage
  object: string
  choices: PerplexityChoice[]
  citations?: PerplexityCitation[]
}

export interface PerplexityStreamChunk {
  id: string
  model: string
  created: number
  object: string
  choices: PerplexityChoice[]
}

export interface PerplexityError {
  error: {
    message: string
    type: string
    code?: string
  }
}

// Resume signal extraction
export interface ResumeSignals {
  keywords: string[]
  location?: string
  locations?: string[]
  skills?: string[]
  experience?: string[]
  education?: string[]
}

// Job market analysis
export interface JobMarketAnalysis {
  jobs: Array<{
    title: string
    company: string
    location: string
    url: string
    description: string
    salary?: string
    postedDate?: string
  }>
  insights?: {
    totalJobs: number
    averageSalary?: string
    topCompanies: string[]
    requiredSkills: string[]
    marketTrends: string[]
  }
}

// Cover letter generation
export interface CoverLetterRequest {
  resumeText: string
  company: string
  jobTitle: string
  jobDescription: string
  tone?: 'professional' | 'casual' | 'enthusiastic'
}

export interface CoverLetterResponse {
  coverLetter: string
  highlights: string[]
  matchScore?: number
}

// Company research
export interface CompanyResearch {
  name: string
  description: string
  industry: string
  size?: string
  founded?: string
  headquarters?: string
  culture?: string[]
  recentNews?: string[]
  interviewTips?: string[]
}

// Interview prep
export interface InterviewPrepRequest {
  company: string
  jobTitle: string
  jobDescription: string
  resumeText: string
}

export interface InterviewPrepResponse {
  questions: string[]
  companyInsights: string
  talkingPoints: string[]
  tips: string[]
}
