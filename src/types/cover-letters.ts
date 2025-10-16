/**
 * Cover Letter Types
 * Personalized cover letter variants
 */

export interface CoverLetterVariant {
  variantA: string // Formal
  variantB: string // Conversational
  personalization: string[]
  wordCount: number
  generatedAt: Date
}

export interface CoverLetterResponse {
  success: boolean
  data?: CoverLetterVariant
  error?: string
  cached?: boolean
}

export interface GenerateCoverLettersRequest {
  jobTitle: string
  company: string
  jobRequirements: string[]
  resumeText: string
  companyInsights: {
    culture: string
    values: string[]
    recentNews: string[]
  }
  hiringManager?: {
    name: string
    title: string
  }
}
