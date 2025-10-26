/**
 * Comprehensive Job Research Types
 * One-shot research data for entire Career Finder flow
 */

import type { HiringContact, CompanyReview } from './unified'

export interface JobAnalysis {
  matchScore: number
  matchingSkills: string[]
  missingSkills: string[]
  skillsToHighlight: string[]
  recommendations: string[]
  estimatedFit: string
}

export interface CompanyIntel {
  culture: string
  values: string[]
  industry: string
  size?: string
  founded?: string
  headquarters?: string
}

export interface CompanyNews {
  title: string
  date: string
  summary: string
  url?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
}

// Re-export from unified to avoid conflicts
export type { HiringContact, CompanyReview }

export interface ComprehensiveJobResearchData {
  jobAnalysis: JobAnalysis
  companyIntel: CompanyIntel
  hiringContacts: HiringContact[]
  news: CompanyNews[]
  reviews: CompanyReview[]
  marketIntelligence?: {
    salaryRange?: string
    demandLevel?: string
    growthTrend?: string
  }
  researchedAt: Date
}

export interface ComprehensiveJobResearchResponse {
  success: boolean
  data?: ComprehensiveJobResearchData
  error?: string
  cached?: boolean
}
