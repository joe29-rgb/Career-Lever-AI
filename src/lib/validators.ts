import { z } from 'zod'

export const jobAnalyzeSchema = z.object({
  jobDescription: z.string().min(50),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
})

export const resumeCustomizeSchema = z.object({
  resumeId: z.string().min(1),
  jobDescription: z.string().min(50),
  jobTitle: z.string().min(2),
  companyName: z.string().min(2),
})

export const coverLetterRawSchema = z.object({
  raw: z.literal(true),
  jobTitle: z.string().min(2),
  companyName: z.string().min(2),
  jobDescription: z.string().min(50),
  resumeText: z.string().min(50),
  tone: z.enum(['professional','casual','enthusiastic']).default('professional'),
  length: z.enum(['short','medium','long']).default('medium'),
  save: z.boolean().optional(),
})

export const salaryNegotiationSchema = z.object({
  jobTitle: z.string().min(2),
  companyName: z.string().min(2),
  location: z.string().min(2),
  seniority: z.enum(['entry','mid','senior']),
  offer: z.object({
    base: z.string().min(1),
    bonus: z.string().optional(),
    equity: z.string().optional(),
    benefits: z.string().optional(),
  }),
  marketData: z.string().optional(),
  candidateHighlights: z.string().min(10),
  constraints: z.string().optional(),
  tone: z.enum(['professional','warm','concise']).default('professional'),
})


