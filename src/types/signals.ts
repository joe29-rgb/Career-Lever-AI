/**
 * Resume Signal Types
 * Extracted keywords and location from resume
 */

export interface ResumeSignals {
  keywords: string[]
  location?: string
  locations?: string[]
  extractedAt?: Date
}

export interface ResumeSignalsResponse {
  success: boolean
  data?: ResumeSignals
  error?: string
  cached?: boolean
}
