/**
 * Job Deduplication
 * 
 * Removes duplicate jobs from multiple sources using:
 * 1. Exact URL matching
 * 2. Fuzzy matching on company + title + location
 * 3. Description similarity (cosine similarity)
 */

import type { Job } from './rapidapi-client'

/**
 * Deduplicate jobs from multiple sources
 */
export function deduplicateJobs(jobs: Job[]): Job[] {
  if (jobs.length === 0) return []
  
  console.log(`[DEDUPLICATOR] Starting with ${jobs.length} jobs`)
  
  const uniqueJobs = new Map<string, Job>()
  const urlMap = new Map<string, Job>()
  const fuzzyMap = new Map<string, Job>()
  
  for (const job of jobs) {
    // Skip jobs with missing critical data
    if (!job.title || !job.company) {
      console.log(`[DEDUPLICATOR] Skipping job with missing data:`, job.id)
      continue
    }
    
    // Method 1: Exact URL match (most reliable)
    if (job.url) {
      const normalizedUrl = normalizeUrl(job.url)
      
      if (urlMap.has(normalizedUrl)) {
        // Keep the job with more complete data
        const existing = urlMap.get(normalizedUrl)!
        if (isMoreComplete(job, existing)) {
          urlMap.set(normalizedUrl, job)
          uniqueJobs.set(normalizedUrl, job)
        }
        continue
      }
      
      urlMap.set(normalizedUrl, job)
      uniqueJobs.set(normalizedUrl, job)
      continue
    }
    
    // Method 2: Fuzzy match on company + title + location
    const fuzzyKey = createFuzzyKey(job)
    
    if (fuzzyMap.has(fuzzyKey)) {
      // Check if descriptions are similar
      const existing = fuzzyMap.get(fuzzyKey)!
      const similarity = calculateTextSimilarity(job.description, existing.description)
      
      if (similarity > 0.85) {
        // Very similar, keep the more complete one
        if (isMoreComplete(job, existing)) {
          fuzzyMap.set(fuzzyKey, job)
          uniqueJobs.set(fuzzyKey, job)
        }
        continue
      }
    }
    
    fuzzyMap.set(fuzzyKey, job)
    uniqueJobs.set(fuzzyKey, job)
  }
  
  const result = Array.from(uniqueJobs.values())
  
  console.log(`[DEDUPLICATOR] Removed ${jobs.length - result.length} duplicates`)
  console.log(`[DEDUPLICATOR] Final count: ${result.length} unique jobs`)
  
  return result
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Remove query params and fragments that might differ
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`
      .toLowerCase()
      .replace(/\/$/, '') // Remove trailing slash
  } catch {
    return url.toLowerCase().trim()
  }
}

/**
 * Create fuzzy matching key from job data
 */
function createFuzzyKey(job: Job): string {
  const company = normalizeText(job.company)
  const title = normalizeText(job.title)
  const location = normalizeText(job.location || '')
  
  return `${company}_${title}_${location}`
}

/**
 * Normalize text for fuzzy matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .trim()
}

/**
 * Calculate text similarity using Jaccard similarity
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0
  
  const words1 = new Set(
    text1.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
  )
  
  const words2 = new Set(
    text2.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
  )
  
  if (words1.size === 0 || words2.size === 0) return 0
  
  // Jaccard similarity: intersection / union
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

/**
 * Check if job1 has more complete data than job2
 */
function isMoreComplete(job1: Job, job2: Job): boolean {
  let score1 = 0
  let score2 = 0
  
  // Weight different fields
  if (job1.description?.length > 100) score1 += 3
  if (job2.description?.length > 100) score2 += 3
  
  if (job1.salary) score1 += 2
  if (job2.salary) score2 += 2
  
  if (job1.url) score1 += 2
  if (job2.url) score2 += 2
  
  if (job1.location) score1 += 1
  if (job2.location) score2 += 1
  
  if (job1.postedDate) score1 += 1
  if (job2.postedDate) score2 += 1
  
  if (job1.skills?.length) score1 += 1
  if (job2.skills?.length) score2 += 1
  
  return score1 > score2
}

/**
 * Group jobs by company for analysis
 */
export function groupJobsByCompany(jobs: Job[]): Map<string, Job[]> {
  const grouped = new Map<string, Job[]>()
  
  for (const job of jobs) {
    const company = normalizeText(job.company)
    if (!grouped.has(company)) {
      grouped.set(company, [])
    }
    grouped.get(company)!.push(job)
  }
  
  return grouped
}

/**
 * Find similar jobs (for "related jobs" feature)
 */
export function findSimilarJobs(targetJob: Job, allJobs: Job[], limit: number = 5): Job[] {
  const similarities = allJobs
    .filter(job => job.id !== targetJob.id)
    .map(job => ({
      job,
      similarity: calculateJobSimilarity(targetJob, job)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
  
  return similarities.map(s => s.job)
}

/**
 * Calculate overall similarity between two jobs
 */
function calculateJobSimilarity(job1: Job, job2: Job): number {
  let score = 0
  
  // Title similarity (40% weight)
  const titleSim = calculateTextSimilarity(job1.title, job2.title)
  score += titleSim * 0.4
  
  // Description similarity (30% weight)
  const descSim = calculateTextSimilarity(job1.description, job2.description)
  score += descSim * 0.3
  
  // Company match (20% weight)
  if (normalizeText(job1.company) === normalizeText(job2.company)) {
    score += 0.2
  }
  
  // Location match (10% weight)
  if (job1.location && job2.location && 
      normalizeText(job1.location) === normalizeText(job2.location)) {
    score += 0.1
  }
  
  return score
}
