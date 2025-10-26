/**
 * Zod Validation Schemas
 * Type-safe validation for API requests
 */

import { z } from 'zod'

// Resume Optimizer Schema
export const generateResumeVariantsSchema = z.object({
  resumeText: z.string().min(100, 'Resume text must be at least 100 characters'),
  jobTitle: z.string().min(1, 'Job title is required'),
  jobRequirements: z.array(z.string()).default([]),
  companyInsights: z.object({
    culture: z.string().default(''),
    values: z.array(z.string()).default([]),
    industry: z.string().default('')
  }).default({})
})

export type GenerateResumeVariantsInput = z.infer<typeof generateResumeVariantsSchema>

// Cover Letter Schema
export const generateCoverLettersSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  jobRequirements: z.array(z.string()).default([]),
  resumeText: z.string().min(100, 'Resume text must be at least 100 characters'),
  companyInsights: z.object({
    culture: z.string().default(''),
    values: z.array(z.string()).default([]),
    recentNews: z.array(z.string()).default([])
  }).default({}),
  hiringManager: z.object({
    name: z.string(),
    title: z.string()
  }).optional()
})

export type GenerateCoverLettersInput = z.infer<typeof generateCoverLettersSchema>

// Email Outreach Schema
export const generateEmailOutreachSchema = z.object({
  hiringContact: z.object({
    name: z.string().min(1, 'Contact name is required'),
    title: z.string().min(1, 'Contact title is required'),
    email: z.string().email().optional()
  }),
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  resumeHighlights: z.array(z.string()).default([])
})

export type GenerateEmailOutreachInput = z.infer<typeof generateEmailOutreachSchema>

// Autopilot Trigger Schema
export const autopilotTriggerSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  jobDescription: z.string().optional()
})

export type AutopilotTriggerInput = z.infer<typeof autopilotTriggerSchema>

// Resume Upload Schema (for text validation)
export const resumeUploadSchema = z.object({
  pastedText: z.string().min(100).optional(),
  fileName: z.string().optional()
})

export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>
