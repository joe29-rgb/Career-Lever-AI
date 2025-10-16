/**
 * Email Outreach Types
 * Personalized email templates for hiring contacts
 */

export interface EmailTemplate {
  type: 'formal' | 'conversational'
  body: string
}

export interface EmailOutreachData {
  subjects: string[]
  templates: EmailTemplate[]
  mailtoLink: string
  generatedAt: Date
}

export interface EmailOutreachResponse {
  success: boolean
  data?: EmailOutreachData
  error?: string
  cached?: boolean
}

export interface GenerateEmailOutreachRequest {
  hiringContact: {
    name: string
    title: string
    email?: string
  }
  jobTitle: string
  company: string
  resumeHighlights: string[]
}
