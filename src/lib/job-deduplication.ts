/**
 * Job Deduplication Utilities
 * Fixes ISSUE #1: Infinite loop with 9x duplicate saves
 */

export interface Job {
  id?: string
  title: string
  company: string
  location: string
  url?: string
  salary?: string
  skills?: string[]
  skillMatchPercent?: number
  aiScore?: number
  [key: string]: unknown
}

/**
 * Create unique hash for job based on company + title
 */
function createJobHash(job: Job): string {
  const company = job.company.toLowerCase().trim()
  const title = job.title.toLowerCase().trim()
  return `${company}::${title}`
}

/**
 * Deduplicate jobs array
 * Returns only unique jobs based on company + title
 */
export function deduplicateJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>()
  const unique: Job[] = []
  let duplicateCount = 0

  for (const job of jobs) {
    const hash = createJobHash(job)
    
    if (seen.has(hash)) {
      duplicateCount++
      console.log(`[DEDUPE] ❌ Removing duplicate: ${job.title} @ ${job.company}`)
      continue
    }
    
    seen.add(hash)
    unique.push(job)
  }

  console.log(`[DEDUPE] ✅ Removed ${duplicateCount} duplicates, kept ${unique.length} unique jobs`)
  
  return unique
}

/**
 * Check if job already exists in array
 */
export function isDuplicateJob(job: Job, existingJobs: Job[]): boolean {
  const hash = createJobHash(job)
  return existingJobs.some(existing => createJobHash(existing) === hash)
}

/**
 * Merge duplicate jobs, keeping the one with more data
 */
export function mergeJobs(jobs: Job[]): Job[] {
  const jobMap = new Map<string, Job>()

  for (const job of jobs) {
    const hash = createJobHash(job)
    const existing = jobMap.get(hash)

    if (!existing) {
      jobMap.set(hash, job)
      continue
    }

    // Keep job with more fields populated
    const existingFields = Object.values(existing).filter(v => v != null).length
    const newFields = Object.values(job).filter(v => v != null).length

    if (newFields > existingFields) {
      console.log(`[DEDUPE] 🔄 Replacing with more complete version: ${job.title}`)
      jobMap.set(hash, job)
    }
  }

  return Array.from(jobMap.values())
}
