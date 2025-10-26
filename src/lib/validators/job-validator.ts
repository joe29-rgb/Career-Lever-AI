/**
 * Job Validator - Enterprise Grade
 * 
 * ZERO TOLERANCE for:
 * - Listing pages ("149 Jobs in Toronto")
 * - Missing companies
 * - Invalid URLs
 * - Insufficient descriptions
 */

import { validateCompany } from './company-validator'

const LISTING_PAGE_PATTERNS = [
  /^\d+\s+.*jobs/i,
  /^\d+\s+positions/i,
  /job\s+search\s+results/i,
  /search\s+results\s+for/i,
  /jobs\s+found/i
]

const LISTING_URL_PATTERNS = [
  /\?q=/,
  /\/jobs\?/,
  /\/jobsearch\?/,
  /\/job-search\?/,
  /\/search\?/,
  /\/browse\//
]

export interface JobValidationResult {
  valid: boolean
  job: {
    title: string
    company: string
    location: string
    url: string
    description: string
    salary?: string
    source: string
    posted: string
  } | null
  issues: string[]
  confidence: number
}

export function validateJob(jobData: {
  title: string
  company: string
  location: string
  url: string
  description: string
  salary?: string
  source?: string
  posted?: string
}): JobValidationResult {
  const issues: string[] = []
  
  // CRITICAL: Validate title
  if (!jobData.title || jobData.title.length < 5) {
    return {
      valid: false,
      job: null,
      issues: ['Job title too short or missing'],
      confidence: 0
    }
  }
  
  // CRITICAL: Check for listing pages
  for (const pattern of LISTING_PAGE_PATTERNS) {
    if (pattern.test(jobData.title)) {
      return {
        valid: false,
        job: null,
        issues: [`Listing page detected: "${jobData.title}"`],
        confidence: 0
      }
    }
  }
  
  // CRITICAL: Validate company
  const companyValidation = validateCompany({ name: jobData.company })
  if (!companyValidation.valid) {
    return {
      valid: false,
      job: null,
      issues: [`Invalid company: ${companyValidation.issues.join(', ')}`],
      confidence: 0
    }
  }
  
  // CRITICAL: Validate URL
  if (!jobData.url || !jobData.url.startsWith('http')) {
    return {
      valid: false,
      job: null,
      issues: ['Invalid or missing job URL'],
      confidence: 0
    }
  }
  
  // CRITICAL: Check for listing page URLs
  for (const pattern of LISTING_URL_PATTERNS) {
    if (pattern.test(jobData.url)) {
      return {
        valid: false,
        job: null,
        issues: ['Job URL points to listing page, not individual job'],
        confidence: 0
      }
    }
  }
  
  // Validate location
  if (!jobData.location || jobData.location.length < 3) {
    return {
      valid: false,
      job: null,
      issues: ['Location missing or too short'],
      confidence: 0
    }
  }
  
  // Validate description
  if (!jobData.description || jobData.description.length < 50) {
    return {
      valid: false,
      job: null,
      issues: ['Description missing or too short (min 50 chars)'],
      confidence: 0
    }
  }
  
  // Calculate confidence
  let confidence = 80
  
  if (jobData.salary) confidence += 5
  if (jobData.source) confidence += 5
  if (jobData.posted) confidence += 5
  if (jobData.description.length > 200) confidence += 5
  
  return {
    valid: true,
    job: {
      title: jobData.title.trim(),
      company: jobData.company.trim(),
      location: jobData.location.trim(),
      url: jobData.url,
      description: jobData.description.trim(),
      salary: jobData.salary,
      source: jobData.source || 'unknown',
      posted: jobData.posted || 'unknown'
    },
    issues,
    confidence: Math.min(confidence, 100)
  }
}

export function validateJobBatch(jobs: any[]): JobValidationResult[] {
  return jobs
    .map(validateJob)
    .filter(result => result.valid && result.confidence >= 70)
}
