import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function (handler: (req: NextRequest, data: T) => Promise<NextResponse>) {
    return async function (req: NextRequest) {
      try {
        const body = await req.json()
        const validatedData = schema.parse(body)
        return handler(req, validatedData)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation failed', details: error.errors },
            { status: 400 }
          )
        }
        throw error
      }
    }
  }
}

// Validation schemas
export const resumeCustomizeSchema = z.object({
  resumeId: z.string().min(1),
  jobDescription: z.string().min(50).max(10000),
  jobTitle: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  tone: z.enum(['professional', 'casual', 'enthusiastic']).optional(),
  overrideResumeText: z.string().max(50000).optional(),
})

export const companyResearchSchema = z.object({
  companyName: z.string().min(1).max(200),
  website: z.string().url().optional(),
  includeNews: z.boolean().optional(),
  includeReviews: z.boolean().optional(),
})
