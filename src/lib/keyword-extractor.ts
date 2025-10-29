/**
 * Keyword Extraction for Job Search
 * 
 * Extracts searchable keywords from job postings for fast cache searching
 */

import { Job } from './rapidapi-client'

// Common stop words to exclude
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
])

// Common tech skills and keywords
const TECH_KEYWORDS = new Set([
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust',
  'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'laravel',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd',
  'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
  'api', 'rest', 'graphql', 'microservices', 'agile', 'scrum', 'devops',
  'machine learning', 'ai', 'data science', 'analytics', 'big data'
])

/**
 * Extract keywords from a job posting
 */
export function extractKeywords(job: Job): string[] {
  const keywords = new Set<string>()
  
  // 1. Extract from title
  const titleKeywords = extractFromTitle(job.title)
  titleKeywords.forEach(k => keywords.add(k))
  
  // 2. Extract from description
  const descKeywords = extractFromDescription(job.description)
  descKeywords.forEach(k => keywords.add(k))
  
  // 3. Extract from company name
  const companyKeywords = extractFromCompany(job.company)
  companyKeywords.forEach(k => keywords.add(k))
  
  // 4. Add existing skills if available
  if (job.skills && Array.isArray(job.skills)) {
    job.skills.forEach(skill => {
      const normalized = normalizeKeyword(skill)
      if (normalized) keywords.add(normalized)
    })
  }
  
  // 5. Extract location keywords
  if (job.location) {
    const locationKeywords = extractFromLocation(job.location)
    locationKeywords.forEach(k => keywords.add(k))
  }
  
  return Array.from(keywords)
}

/**
 * Extract keywords from job title
 */
function extractFromTitle(title: string): string[] {
  const keywords: string[] = []
  
  // Normalize and split
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1)
  
  for (const word of words) {
    // Skip stop words
    if (STOP_WORDS.has(word)) continue
    
    // Add the word
    keywords.push(word)
    
    // Check for common abbreviations
    if (word === 'sr' || word === 'senior') {
      keywords.push('senior')
    }
    if (word === 'jr' || word === 'junior') {
      keywords.push('junior')
    }
    if (word === 'dev') {
      keywords.push('developer')
    }
  }
  
  // Extract multi-word phrases
  const phrases = extractPhrases(title)
  keywords.push(...phrases)
  
  return keywords
}

/**
 * Extract keywords from description
 */
function extractFromDescription(description: string): string[] {
  if (!description) return []
  
  const keywords: string[] = []
  const text = description.toLowerCase()
  
  // Extract tech keywords
  for (const tech of TECH_KEYWORDS) {
    if (text.includes(tech)) {
      keywords.push(tech)
    }
  }
  
  // Extract years of experience
  const expMatch = text.match(/(\d+)\+?\s*years?/i)
  if (expMatch) {
    keywords.push(`${expMatch[1]}years`)
    keywords.push('experience')
  }
  
  // Extract degree requirements
  if (text.includes('bachelor') || text.includes('bs') || text.includes('ba')) {
    keywords.push('bachelor')
  }
  if (text.includes('master') || text.includes('ms') || text.includes('ma')) {
    keywords.push('master')
  }
  if (text.includes('phd') || text.includes('doctorate')) {
    keywords.push('phd')
  }
  
  // Extract common job types
  if (text.includes('remote')) keywords.push('remote')
  if (text.includes('hybrid')) keywords.push('hybrid')
  if (text.includes('onsite') || text.includes('on-site')) keywords.push('onsite')
  if (text.includes('full-time') || text.includes('fulltime')) keywords.push('fulltime')
  if (text.includes('part-time') || text.includes('parttime')) keywords.push('parttime')
  if (text.includes('contract')) keywords.push('contract')
  if (text.includes('freelance')) keywords.push('freelance')
  
  // Extract salary keywords
  if (text.includes('salary') || text.includes('compensation')) keywords.push('salary')
  if (text.includes('benefits')) keywords.push('benefits')
  if (text.includes('equity') || text.includes('stock options')) keywords.push('equity')
  
  return keywords
}

/**
 * Extract keywords from company name
 */
function extractFromCompany(company: string): string[] {
  if (!company) return []
  
  const keywords: string[] = []
  
  // Normalize company name
  const normalized = company
    .toLowerCase()
    .replace(/\b(inc|corp|ltd|llc|co|corporation|incorporated|limited)\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
  
  const words = normalized.split(/\s+/).filter(w => w.length > 2)
  keywords.push(...words)
  
  // Add full company name as single keyword
  keywords.push(normalized.replace(/\s+/g, ''))
  
  return keywords
}

/**
 * Extract keywords from location
 */
function extractFromLocation(location: string): string[] {
  if (!location) return []
  
  const keywords: string[] = []
  
  // Split by comma and extract parts
  const parts = location.split(',').map(p => p.trim().toLowerCase())
  
  for (const part of parts) {
    // Remove province/state abbreviations
    const cleaned = part.replace(/\b(ab|bc|on|qc|mb|sk|ns|nb|pe|nl|yt|nt|nu)\b/g, '').trim()
    if (cleaned.length > 2) {
      keywords.push(cleaned)
    }
    
    // Add abbreviation too
    const abbr = part.match(/\b([a-z]{2})\b/)
    if (abbr) {
      keywords.push(abbr[1])
    }
  }
  
  return keywords
}

/**
 * Extract common multi-word phrases
 */
function extractPhrases(text: string): string[] {
  const phrases: string[] = []
  const lower = text.toLowerCase()
  
  // Common job title phrases
  const patterns = [
    /software\s+engineer/g,
    /software\s+developer/g,
    /full\s+stack/g,
    /front\s+end/g,
    /back\s+end/g,
    /data\s+scientist/g,
    /data\s+analyst/g,
    /product\s+manager/g,
    /project\s+manager/g,
    /business\s+analyst/g,
    /sales\s+manager/g,
    /account\s+manager/g,
    /customer\s+success/g,
    /devops\s+engineer/g,
    /machine\s+learning/g,
    /artificial\s+intelligence/g
  ]
  
  for (const pattern of patterns) {
    const matches = lower.match(pattern)
    if (matches) {
      matches.forEach(match => {
        phrases.push(match.replace(/\s+/g, ''))
      })
    }
  }
  
  return phrases
}

/**
 * Normalize a keyword
 */
function normalizeKeyword(keyword: string): string | null {
  const normalized = keyword
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, '')
    .trim()
  
  if (normalized.length < 2) return null
  if (STOP_WORDS.has(normalized)) return null
  
  return normalized
}

/**
 * Search jobs by keywords
 */
export function searchJobsByKeywords(jobs: Job[], searchKeywords: string[]): Job[] {
  const normalizedSearch = searchKeywords.map(k => k.toLowerCase())
  
  return jobs.filter(job => {
    const jobKeywords = extractKeywords(job)
    const normalizedJobKeywords = jobKeywords.map(k => k.toLowerCase())
    
    // Check if any search keyword matches any job keyword
    return normalizedSearch.some(searchKey =>
      normalizedJobKeywords.some(jobKey =>
        jobKey.includes(searchKey) || searchKey.includes(jobKey)
      )
    )
  })
}

/**
 * Score job relevance based on keyword matches
 */
export function scoreJobRelevance(job: Job, searchKeywords: string[]): number {
  const jobKeywords = extractKeywords(job).map(k => k.toLowerCase())
  const normalizedSearch = searchKeywords.map(k => k.toLowerCase())
  
  let score = 0
  
  for (const searchKey of normalizedSearch) {
    // Exact match in title: +10 points
    if (job.title.toLowerCase().includes(searchKey)) {
      score += 10
    }
    
    // Exact match in keywords: +5 points
    if (jobKeywords.includes(searchKey)) {
      score += 5
    }
    
    // Partial match in keywords: +2 points
    if (jobKeywords.some(k => k.includes(searchKey) || searchKey.includes(k))) {
      score += 2
    }
    
    // Match in description: +1 point
    if (job.description.toLowerCase().includes(searchKey)) {
      score += 1
    }
  }
  
  return score
}
