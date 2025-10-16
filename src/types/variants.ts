/**
 * Resume Variant Types
 * ATS-optimized and human-readable resume versions
 */

export interface ResumeVariant {
  variantA: string // ATS-optimized
  variantB: string // Human-readable
  recommendations: string[]
  atsScore?: number
  generatedAt: Date
}

export interface ResumeVariantResponse {
  success: boolean
  data?: ResumeVariant
  error?: string
  cached?: boolean
}

export interface GenerateResumeVariantsRequest {
  resumeText: string
  jobTitle: string
  jobRequirements: string[]
  companyInsights: {
    culture: string
    values: string[]
    industry: string
  }
}
