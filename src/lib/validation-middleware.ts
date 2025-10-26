// Input Validation Middleware with Zod

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

/**
 * Higher-order function that wraps API handlers with validation
 * @param schema - Zod schema for validation
 * @returns Wrapped handler with validation
 */
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function (handler: (req: NextRequest, data: T) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      try {
        const body = await req.json()
        const validatedData = schema.parse(body)
        return handler(req, validatedData)
      } catch (error) {
        if (error instanceof z.ZodError) {
          logger.warn('Validation failed', {
            errors: error.errors,
            path: req.nextUrl.pathname
          })
          
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message
              }))
            },
            { status: 400 }
          )
        }
        throw error
      }
    }
  }
}

// Common validation schemas
export const resumeCustomizeSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters').max(10000),
  jobTitle: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  tone: z.enum(['professional', 'casual', 'enthusiastic']).optional(),
  overrideResumeText: z.string().max(50000).optional(),
  psychology: z.any().optional(),
  companyData: z.any().optional(),
  atsTarget: z.string().optional(),
  optimizationLevel: z.string().optional(),
  industryFocus: z.string().optional(),
  experienceLevel: z.string().optional(),
  keyMetrics: z.any().optional(),
  skillsPriority: z.any().optional(),
  antiAIDetection: z.boolean().optional(),
  formatStyle: z.string().optional(),
  lengthTarget: z.string().optional()
})

export const companyResearchSchema = z.object({
  companyName: z.string().min(1).max(200),
  website: z.string().url().optional(),
  includeNews: z.boolean().optional(),
  includeReviews: z.boolean().optional(),
  includeFinancials: z.boolean().optional()
})

export const coverLetterSchema = z.object({
  jobApplicationId: z.string().optional(),
  resumeId: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'enthusiastic']).default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  raw: z.boolean().optional(),
  save: z.boolean().optional(),
  psychology: z.any().optional()
})

export const coverLetterRawSchema = z.object({
  jobTitle: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  jobDescription: z.string().min(50).max(10000),
  resumeText: z.string().min(100).max(50000),
  tone: z.enum(['professional', 'casual', 'enthusiastic']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional()
})

export const jobSearchSchema = z.object({
  keywords: z.string().min(1).max(500),
  location: z.string().min(1).max(200),
  experienceLevel: z.enum(['entry', 'mid', 'senior']).optional(),
  remote: z.boolean().optional(),
  salaryMin: z.number().positive().optional(),
  limit: z.number().min(1).max(100).default(20)
})

export const resumeUploadSchema = z.object({
  pastedText: z.string().min(50, 'Resume text must be at least 50 characters').optional()
})

export const emailComposeSchema = z.object({
  jobId: z.string().min(1),
  resumeText: z.string().min(100),
  coverText: z.string().min(100),
  contacts: z.object({
    email: z.string().email()
  }),
  company: z.string().min(1),
  jobTitle: z.string().min(1)
})

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  title: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  bio: z.string().max(1000).optional()
})

export const applicationCreateSchema = z.object({
  jobTitle: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  jobDescription: z.string().min(50).max(10000),
  jobUrl: z.string().url().optional(),
  location: z.string().max(200).optional(),
  salary: z.string().max(100).optional()
})

export const applicationUpdateSchema = z.object({
  status: z.enum(['saved', 'applied', 'screening', 'interviewing', 'offer', 'rejected', 'withdrawn']).optional(),
  notes: z.string().max(5000).optional()
})

// Email validation helper
export function validateEmail(email: string): boolean {
  return z.string().email().safeParse(email).success
}

// URL validation helper  
export function validateURL(url: string): boolean {
  return z.string().url().safeParse(url).success
}

// File size validation helper
export function validateFileSize(size: number, maxMB: number = 10): boolean {
  return size <= maxMB * 1024 * 1024
}

// Sanitize HTML helper (basic)
export function sanitizeHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
}

