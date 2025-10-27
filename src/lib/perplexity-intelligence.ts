// FIXED: Universal crypto support (browser + Node.js)
let crypto: any
try {
  crypto = require('crypto')
} catch {
  // Browser environment - will use fallback
  crypto = null
}
import { PerplexityService } from './perplexity-service'
import { 
  CANADIAN_JOB_BOARDS, 
  MAJOR_JOB_BOARDS, 
  OPEN_API_BOARDS,
  ATS_PLATFORMS,
  DISCOVERY_PRIORITY_ORDER
} from './public-job-boards-config'
import { parseAIResponse } from './utils/ai-response-parser'
import { getCoverLetterTemplateById } from './cover-letter-templates'

// Environment
const CACHE_TTL_MS = Number(process.env.PPX_CACHE_TTL_MS || 24 * 60 * 60 * 1000)
const MAX_RETRY_ATTEMPTS = Number(process.env.PPX_MAX_RETRIES || 3)
const RETRY_DELAY_MS = Number(process.env.PPX_RETRY_DELAY || 1000)

type CacheRecord = {
  value: unknown
  metadata: { createdAt: number; hitCount: number; lastAccessed: number }
  expiresAt: number
}

// Simple Map-based cache with TTL
const cache = new Map<string, CacheRecord>()

// Cache cleanup interval (every hour)
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of cache.entries()) {
    if (now > record.expiresAt) {
      cache.delete(key)
    }
  }
}, 60 * 60 * 1000)

function makeKey(prefix: string, payload: unknown): string {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)
  
  // Use crypto if available (Node.js), otherwise simple hash (browser)
  if (crypto && crypto.createHash) {
    return `${prefix}:${crypto.createHash('sha256').update(raw).digest('hex')}`
  }
  
  // Browser fallback: simple hash
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `${prefix}:${Math.abs(hash).toString(36)}`
}

function getCache(key: string): unknown | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return undefined
  }
  
  entry.metadata.hitCount += 1
  entry.metadata.lastAccessed = Date.now()
  return entry.value
}

function setCache(key: string, value: unknown) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
    metadata: {
      createdAt: Date.now(),
      hitCount: 0,
      lastAccessed: Date.now()
    }
  })
}

function createClient(): PerplexityService { return new PerplexityService() }

// ---------- Enhanced helpers (ids, retry, enrichment) ----------
function generateRequestId(): string {
  if (crypto && crypto.randomBytes) {
    return crypto.randomBytes(8).toString('hex')
  }
  // Browser fallback
  return Math.random().toString(36).substr(2, 16) + Date.now().toString(36)
}

// FIXED: Add timeout protection
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
    )
  ])
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
  logger?: { warn?: (message: string, context?: Record<string, unknown>) => void },
  timeoutMs: number = 30000 // 30 second default timeout
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await withTimeout(operation(), timeoutMs)
    } catch (err) {
      lastError = err
      if (attempt === maxAttempts) break
      const baseDelay = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
      const jitter = Math.random() * RETRY_DELAY_MS
      const delay = baseDelay + jitter
      logger?.warn?.('Retrying Perplexity operation', {
        attempt,
        delay,
        error: err instanceof Error ? err.message : String(err)
      })
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw (lastError instanceof Error ? lastError : new Error('Operation failed'))
}

// Removed unused PerplexityError class - using standard Error instead

// CRITICAL: This generates PATTERN-BASED emails (NOT VERIFIED)
// These are stored as "alternativeEmails" with emailType: 'pattern' and low confidence
// NEVER present these as verified contacts - they are guesses based on common patterns
function inferEmails(name: string, companyDomain: string): string[] {
  if (!name || !companyDomain) return []
  const parts = name.toLowerCase().split(' ').filter(Boolean)
  if (parts.length < 2) return []
  const first = parts[0]
  const last = parts[parts.length - 1]
  const patterns = [
    `${first}.${last}@${companyDomain}`,
    `${first}${last}@${companyDomain}`,
    `${first[0]}${last}@${companyDomain}`,
    `${first}@${companyDomain}`,
    `${last}@${companyDomain}`,
    `${first}.${last[0]}@${companyDomain}`
  ]
  return patterns
}

function normalizeSkills(skills: string[]): string[] {
  const mapping: Record<string, string> = {
    javascript: 'JavaScript', js: 'JavaScript',
    typescript: 'TypeScript', ts: 'TypeScript',
    react: 'React', reactjs: 'React',
    node: 'Node.js', nodejs: 'Node.js',
    python: 'Python', py: 'Python',
    sales: 'Sales', selling: 'Sales',
    crm: 'CRM', 'customer relationship management': 'CRM',
    ai: 'Artificial Intelligence', 'artificial intelligence': 'Artificial Intelligence',
    'machine learning': 'Machine Learning', ml: 'Machine Learning'
  }
  return (skills || []).map(s => {
    const k = s.toLowerCase().trim()
    return mapping[k] || s
  })
}

// CRITICAL FIX: Calculate years of experience from resume text
// Prevents double-counting overlapping periods and filters out education dates
function calculateYearsFromResume(resumeText: string): number {
  // Extract only the work experience section to avoid counting education dates
  const experienceSection = extractExperienceSection(resumeText)
  
  // Match date ranges in various formats
  const dateRegex = /(\w+\s+\d{4}|(\d{1,2}\/\d{4}))\s*[-–—]\s*(\w+\s+\d{4}|Present|Current|(\d{1,2}\/\d{4}))/gi
  const matches = Array.from(experienceSection.matchAll(dateRegex))
  
  // Parse all date ranges into start/end pairs
  const periods: Array<{ start: Date; end: Date }> = []
  for (const match of matches) {
    try {
      const startStr = match[1]
      const endStr = match[3]
      
      const startDate = new Date(startStr)
      const endDate = endStr.match(/Present|Current/i) ? new Date() : new Date(endStr)
      
      // Validate dates are reasonable (not in future, not before 1970)
      if (startDate.getFullYear() < 1970 || startDate.getFullYear() > new Date().getFullYear()) continue
      if (endDate.getFullYear() < 1970 || endDate.getFullYear() > new Date().getFullYear() + 1) continue
      if (startDate > endDate) continue // Skip invalid ranges
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth())
      
      // Sanity check: skip periods longer than 50 years or negative
      if (months > 0 && months < 600) {
        periods.push({ start: startDate, end: endDate })
      }
    } catch (e) {
      // Skip invalid dates
      continue
    }
  }
  
  // If no valid periods found, return 0
  if (periods.length === 0) return 0
  
  // Sort periods by start date
  periods.sort((a, b) => a.start.getTime() - b.start.getTime())
  
  // Merge overlapping periods to avoid double-counting
  const merged: Array<{ start: Date; end: Date }> = []
  let current = periods[0]
  
  for (let i = 1; i < periods.length; i++) {
    const next = periods[i]
    
    // If periods overlap or are adjacent, merge them
    if (next.start <= current.end) {
      current.end = new Date(Math.max(current.end.getTime(), next.end.getTime()))
    } else {
      // No overlap, push current and start new period
      merged.push(current)
      current = next
    }
  }
  merged.push(current)
  
  // Calculate total months from merged periods
  let totalMonths = 0
  for (const period of merged) {
    const months = (period.end.getFullYear() - period.start.getFullYear()) * 12 + 
                  (period.end.getMonth() - period.start.getMonth())
    totalMonths += months
  }
  
  const years = Math.round(totalMonths / 12)
  
  // CRITICAL FIX: Cap at realistic maximum
  // Assume candidate started working at age 18, max age 65
  // Most candidates are 25-45, so cap at 25 years to be safe
  const maxRealisticYears = 25
  const cappedYears = Math.min(years, maxRealisticYears)
  
  // If calculated years seem unrealistic (>15), round down to nearest 5
  if (cappedYears > 15) {
    return Math.floor(cappedYears / 5) * 5
  }
  
  return cappedYears
}

// Extract work experience section from resume to avoid counting education dates
function extractExperienceSection(resumeText: string): string {
  const text = resumeText.toLowerCase()
  
  // Find work experience section markers
  const experienceMarkers = [
    'work experience',
    'professional experience',
    'employment history',
    'experience',
    'work history',
    'career history'
  ]
  
  // Find education section markers to exclude
  const educationMarkers = [
    'education',
    'academic background',
    'academic history',
    'degrees'
  ]
  
  let experienceStart = -1
  let experienceMarker = ''
  
  // Find the earliest experience marker
  for (const marker of experienceMarkers) {
    const index = text.indexOf(marker)
    if (index !== -1 && (experienceStart === -1 || index < experienceStart)) {
      experienceStart = index
      experienceMarker = marker
    }
  }
  
  // If no experience section found, use entire resume (fallback)
  if (experienceStart === -1) return resumeText
  
  // Find where experience section ends (usually at education or end of document)
  let experienceEnd = resumeText.length
  for (const marker of educationMarkers) {
    const index = text.indexOf(marker, experienceStart + experienceMarker.length)
    if (index !== -1 && index < experienceEnd) {
      experienceEnd = index
    }
  }
  
  return resumeText.substring(experienceStart, experienceEnd)
}

// Enhanced response wrappers (non-breaking: used by new V2 methods only)
export type RequestMetadata = { 
  requestId: string
  timestamp: number
  duration?: number
  error?: string
  boardsSearched?: number
  resultsCount?: number
  attemptedCleanups?: string[]
  contactsFound?: number
  withEmails?: number
  agent_iterations?: number
  tools_used?: string[]
  reasoning?: string
  confidence?: number
  method?: string
  sources?: number
}
export type EnhancedResponse<T> = { success: boolean; data: T; metadata: RequestMetadata; cached: boolean }

export interface IntelligenceRequest {
  company: string
  role?: string
  geo?: string
}

export interface IntelligenceResponse {
  company: string
  freshness: string
  sources: Array<{ title: string; url: string }>
  confidence: number
  financials: Array<{ metric: string; value: string; confidence: number; source?: string }>
  culture: Array<{ point: string; confidence: number; source?: string }>
  salaries: Array<{ title: string; range: string; currency?: string; geo?: string; source?: string; confidence: number }>
  contacts: Array<{ name: string; title: string; url?: string; source?: string; confidence: number }>
  growth: Array<{ signal: string; source?: string; confidence: number }>
  summary: string
  description: string
  size: string
  revenue: string
  industry: string
  founded: string
  headquarters: string
  psychology: string
  marketIntelligence: string
  // CRITICAL: New comprehensive intelligence fields
  recentNews?: Array<{ title: string; date: string; url: string; summary: string }>
  socialMedia?: {
    linkedin?: string
    twitter?: string
    facebook?: string
    instagram?: string
    youtube?: string
  }
  glassdoorRating?: {
    overallRating?: number
    ceoApproval?: number
    recommendToFriend?: number
    reviewCount?: number
    url?: string
  }
  stockProfile?: {
    ticker?: string
    exchange?: string
    currentPrice?: string
    marketCap?: string
    isPublic?: boolean
  }
}

// V2 Data structures (for job listings and contacts)
export interface JobListing {
  title: string
  company: string
  location: string
  address?: string | null
  url: string
  source?: string
  summary: string
  postedDate: string
  salary?: string | null
  skillMatchPercent: number
  skills: string[]
  workType?: 'remote' | 'hybrid' | 'onsite'
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
  contacts: {
    hrEmail?: string | null
    hiringManagerEmail?: string | null
    generalEmail?: string | null
    phone?: string | null
    linkedinProfiles: string[]
  }
  benefits?: string[]
  requirements?: string[]
}

export interface HiringContact {
  name: string
  title: string
  department: string
  linkedinUrl?: string | null
  email?: string | null
  emailType?: 'public' | 'inferred' | 'pattern'
  source: string
  confidence: number
  phone?: string | null
  alternativeEmails?: string[]
  discoveryMethod?: string
}

export interface QuickSearchItem {
  title: string
  url: string
  snippet: string
  source: string
  postedDate?: string
  location?: string
  company?: string
  date?: string
}

const SYSTEM = `You are a research analyst using real-time web tools.
CRITICAL: Your response must be ONLY valid JSON. NO explanatory text, NO markdown, NO commentary.
Rules:
- Use only public sources and respect robots.txt by following links provided by Perplexity tools.
- Always return ONLY structured JSON matching the requested schema.
- Include 5-10 source citations with titles and URLs.
- Provide confidence scores (0-1) for each data point and overall.
- Mark estimates or unverified signals clearly.
- NEVER add text before or after the JSON response.
`

interface ComprehensiveJobResearchData {
  jobAnalysis: {
    matchScore: number
    matchingSkills: string[]
    missingSkills: string[]
    skillsToHighlight: string[]
    recommendations: string[]
    estimatedFit: string
  }
  companyIntel: {
    company: string
    description: string
    size?: string
    revenue?: string
    industry?: string
    founded?: string
    headquarters?: string
    website?: string
    marketPosition?: string
  }
  companyPsychology: {
    culture: string
    values: string[]
    managementStyle?: string
    workEnvironment?: string
  }
  hiringContacts: Array<{
    name: string
    title: string
    department?: string
    email?: string
    linkedinUrl?: string
    authority: 'decision maker' | 'recruiter' | 'manager' | 'coordinator'
    confidence: number
    contactMethod?: string
  }>
  marketIntelligence: {
    competitivePosition?: string
    industryTrends?: string
    financialStability?: string
    recentPerformance?: string
  }
  news: Array<{
    title: string
    summary: string
    url: string
    date?: string
    source?: string
    impact?: string
  }>
  reviews: Array<{
    platform: string
    rating?: number
    summary: string
    url: string
    pros?: string[]
    cons?: string[]
  }>
  compensation: {
    salaryRange?: string
    benefits?: string
  }
  strategicRecommendations: {
    applicationStrategy: string
    contactStrategy: string
    interviewPrep: string[]
  }
  sources: string[]
  confidenceLevel: number
}

interface EnhancedCompanyResearchData {
  companyIntelligence: {
    name: string
    industry?: string
    founded?: string
    headquarters?: string
    employeeCount?: string
    revenue?: string
    website?: string
    description?: string
    marketPosition?: string
    financialStability?: string
    recentPerformance?: string
  }
  hiringContactIntelligence: {
    officialChannels?: {
      careersPage?: string
      jobsEmail?: string
      hrEmail?: string
      phone?: string
      address?: string
    }
    keyContacts?: Array<{
      name: string
      title: string
      department?: string
      linkedinUrl?: string
      email?: string
      authority?: string
      contactMethod?: string
    }>
    emailFormat?: string
    socialMedia?: Record<string, string>
  }
  companyPsychology?: {
    culture?: string
    values?: string[]
    managementStyle?: string
    workEnvironment?: string
  }
  reviewAnalysis?: {
    glassdoor?: {
      rating?: number
      reviewCount?: number
      ceoApproval?: string | number
      recommendToFriend?: string | number
      pros?: string[]
      cons?: string[]
    }
    employeeSentiment?: string
  }
  aiAutomationThreat?: {
    roleRisk?: string
    automationProbability?: string
    timeframe?: string
    companyAIAdoption?: string
    futureOutlook?: string
    recommendations?: string[]
  }
  recentNews?: Array<{
    headline?: string
    date?: string
    source?: string
    url?: string
    impact?: string
  }>
  compensation?: {
    salaryRange?: string
    benefits?: string
  }
  redFlags?: string[]
  strategicRecommendations?: {
    applicationStrategy?: string
    contactStrategy?: string
    interviewPrep?: string[]
  }
  sources?: string[]
  confidenceLevel?: number
}

export class PerplexityIntelligenceService {
  /**
   * CRITICAL FIX: Scrapes job URL to get full description when Perplexity returns incomplete data
   * Fallback for when descriptions are too short
   */
  private static async scrapeJobURL(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (!response.ok) return ''
      
      const html = await response.text()
      
      // Try multiple common job description selectors
      const patterns = [
        /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/is,
        /<div[^>]*id="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/is,
        /<section[^>]*class="[^"]*job-description[^"]*"[^>]*>(.*?)<\/section>/is,
        /<div[^>]*class="[^"]*job-details[^"]*"[^>]*>(.*?)<\/div>/is
      ]
      
      for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match && match[1]) {
          // Strip HTML tags and clean up
          const cleaned = match[1]
            .replace(/<script[^>]*>.*?<\/script>/gis, '')
            .replace(/<style[^>]*>.*?<\/style>/gis, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
          
          if (cleaned.length > 150) {
            return cleaned
          }
        }
      }
      
      return ''
    } catch (error) {
      if (process.env.PPX_DEBUG === 'true') {
        console.warn(`[SCRAPE] Failed to scrape ${url}:`, error)
      }
      return ''
    }
  }

  /**
   * CRITICAL FIX: Validates job listings response from Perplexity
   * Filters out incomplete, fake, or low-quality jobs
   */
  private static validateJobListings(jobs: JobListing[], minRequired: number): JobListing[] {
    const validated = jobs.filter((job: JobListing) => {
      // ❌ REJECT: Empty or short descriptions
      if (!job.summary || job.summary.trim().length < 150) {
        if (process.env.PPX_DEBUG === 'true') {
          console.warn(`[VALIDATE] Rejecting ${job.title} - description too short (${job.summary?.length || 0} chars)`)
        }
        return false
      }
      
      // ❌ REJECT: Confidential companies
      const confidentialKeywords = ['confidential', 'various', 'tbd', 'multiple', 'undisclosed', 'anonymous', 'private', 'stealth', 'hidden']
      const company = String(job.company || '').toLowerCase().trim()
      if (confidentialKeywords.some(kw => company.includes(kw)) || company.length < 3) {
        if (process.env.PPX_DEBUG === 'true') {
          console.warn(`[VALIDATE] Rejecting ${job.title} - confidential company: ${job.company}`)
        }
        return false
      }
      
      // ❌ REJECT: No valid URL
      if (!job.url || !job.url.includes('http')) {
        if (process.env.PPX_DEBUG === 'true') {
          console.warn(`[VALIDATE] Rejecting ${job.title} - invalid URL: ${job.url}`)
        }
        return false
      }
      
      // ✅ ACCEPT
      return true
    })
    
    // Warn if too many filtered out
    if (validated.length < minRequired * 0.5 && process.env.PPX_DEBUG === 'true') {
      console.warn(`[VALIDATE] Only ${validated.length}/${minRequired} jobs passed validation (${Math.round(validated.length/minRequired*100)}%)`)
    }
    
    return validated
  }

  /**
   * CRITICAL FIX: Validates hiring contacts response from Perplexity
   * Filters out fake emails, personal domains, pattern-based guesses
   */
  private static validateHiringContacts(contacts: HiringContact[]): HiringContact[] {
    const validated = contacts.filter((contact: HiringContact) => {
      // ❌ REJECT: No email and no LinkedIn
      if (!contact.email && !contact.linkedinUrl) {
        if (process.env.PPX_DEBUG === 'true') {
          console.warn(`[VALIDATE] Rejecting ${contact.name} - no contact method`)
        }
        return false
      }
      
      // ❌ REJECT: Personal email domains (if email exists)
      if (contact.email) {
        const personalDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'aol', 'icloud', 'protonmail']
        if (personalDomains.some(d => contact.email!.toLowerCase().includes(d))) {
          if (process.env.PPX_DEBUG === 'true') {
            console.warn(`[VALIDATE] Rejecting ${contact.email} - personal domain`)
          }
          return false
        }
        
        // ❌ REJECT: Template/placeholder emails
        if (contact.email.includes('[') || contact.email.includes('VISIT') || contact.email.includes('example') || contact.email.includes('domain.')) {
          if (process.env.PPX_DEBUG === 'true') {
            console.warn(`[VALIDATE] Rejecting ${contact.email} - template email`)
          }
          return false
        }
      }
      
      // ✅ ACCEPT
      return true
    })
    
    return validated
  }

  // V2: Enhanced company research with retries and metadata
  static async researchCompanyV2(input: IntelligenceRequest): Promise<EnhancedResponse<IntelligenceResponse>> {
    const requestId = generateRequestId()
    const started = Date.now()
    const key = makeKey('ppx:research:v2', input)
    const cached = getCache(key) as IntelligenceResponse | undefined
    if (cached) {
      return { success: true, data: cached, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: true }
    }
    try {
      const userPrompt = `COMPREHENSIVE RESEARCH TASK: Search for contacts, emails, website, and complete intelligence for ${input.company}${input.role ? ` (role: ${input.role})` : ''}${input.geo ? ` in ${input.geo}` : ''}.

**MANDATORY SEARCH SOURCES:**
- Use Google search extensively
- Search LinkedIn company page AND individual employee profiles
- Search all social media platforms (Twitter, Facebook, Instagram, YouTube)
- Search company website thoroughly
- Search business directories (BBB, Yellow Pages, ZoomInfo, etc.)
- Search news sources and press releases
- Search Glassdoor for reviews and salaries
- Search stock exchanges if publicly traded

**RETURN DETAILED JSON with ALL fields below:**
{
  "company": string (full legal name),
  "description": string (detailed company overview - NOT "No description available"),
  "size": string (employee count with source),
  "revenue": string (annual revenue estimate with source),
  "industry": string (specific industry classification),
  "founded": string (year or date with source),
  "headquarters": string (full address with city, province/state, postal code),
  "psychology": string (company culture, values, workplace environment - from Glassdoor/employee reviews),
  "marketIntelligence": string (market position, competitive landscape, growth trends - detailed analysis),
  "freshness": string (ISO datetime of research),
  "sources": [{"title": string, "url": string}] (minimum 8 sources, up to 20),
  "confidence": number (0 to 1),
  "financials": [{"metric": string, "value": string, "confidence": number, "source": string}],
  "culture": [{"point": string, "confidence": number, "source": string}] (from Glassdoor/reviews),
  "salaries": [{"title": string, "range": string, "currency": string, "geo": string, "source": string, "confidence": number}],
  "contacts": [{"name": string, "title": string, "email": string, "url": string, "source": string, "confidence": number}] (executives, managers, recruiters from LinkedIn with emails),
  "generalEmail": string (company general inbox: careers@, hr@, jobs@, info@, hello@, contact@ - MANDATORY),
  "careersPage": string (company careers/jobs page URL),
  "growth": [{"signal": string, "source": string, "confidence": number}],
  "summary": string (comprehensive 2-3 paragraph summary),
  "recentNews": [{"title": string, "date": string, "url": string, "summary": string}] (last 6 months),
  "socialMedia": {"linkedin": string, "twitter": string, "facebook": string, "instagram": string, "youtube": string},
  "glassdoorRating": {"overallRating": number, "ceoApproval": number, "recommendToFriend": number, "reviewCount": number, "url": string},
  "stockProfile": {"ticker": string, "exchange": string, "currentPrice": string, "marketCap": string, "isPublic": boolean}
}

**CRITICAL REQUIREMENTS:**
1. Search company website for About page, Contact page, Leadership/Team page
2. **MANDATORY**: Extract company general email from website footer/contact page (careers@, hr@, jobs@, info@, hello@, contact@)
3. **MANDATORY**: Find company careers/jobs page URL
4. Search "site:linkedin.com/company/${input.company}" for official company page
5. Search "site:linkedin.com ${input.company} CEO OR president OR manager" for executive contacts WITH emails
6. Search "${input.company} headquarters address phone email"
7. Search "${input.company} site:glassdoor.com" for reviews and culture insights
8. Search "${input.company} revenue employees industry" for business intelligence
9. DO NOT return "Unknown", "No description available", or "No data" - search multiple sources until you find information
10. Include REAL contact information (names, titles, emails, LinkedIn URLs) - minimum 3 contacts if company has >10 employees
11. **APP IS USELESS WITHOUT CONTACT INFO** - Always return at least generalEmail even if no specific contacts found`
      const out = await withRetry(async () => {
        const client = createClient()
        const user = userPrompt
        const res = await client.makeRequest(SYSTEM, user, { temperature: 0.2, maxTokens: 3000, model: 'sonar-pro' })
        if (!res.content?.trim()) throw new Error('Empty response')
        return res
      })
      const context = {
        requestId,
        prompts: { system: SYSTEM, user: userPrompt },
        timestamp: started,
        duration: Date.now() - started
      }
      const parsed = parseAIResponse<IntelligenceResponse>(out.content ?? '', { stripMarkdown: true, extractFirst: true }, context)
      parsed.company = parsed.company || input.company
      parsed.freshness = parsed.freshness || new Date().toISOString()
      parsed.sources = Array.isArray(parsed.sources) ? parsed.sources.slice(0, 12) : []
      parsed.confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.6
      if (Array.isArray(parsed.contacts)) {
        parsed.contacts = parsed.contacts.map(c => ({ ...c, url: c.url }))
      }
      setCache(key, parsed)
      return { success: true, data: parsed, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: false }
    } catch (e) {
      const fb: IntelligenceResponse = {
        company: input.company,
        freshness: new Date().toISOString(),
        sources: [],
        confidence: 0.3,
        financials: [],
        culture: [],
        salaries: [],
        contacts: [],
        growth: [],
        summary: 'Research failed - please retry',
        description: 'No description available',
        size: 'Unknown',
        revenue: 'Unknown',
        industry: 'Unknown',
        founded: 'Unknown',
        headquarters: 'Unknown',
        psychology: 'No insights available',
        marketIntelligence: 'No market data available',
        recentNews: [],
        socialMedia: {},
        glassdoorRating: undefined,
        stockProfile: undefined
      }
      return { success: false, data: fb, metadata: { requestId, timestamp: started, duration: Date.now() - started, error: (e as Error).message }, cached: false }
    }
  }
  // REMOVED: Old researchCompany - Use researchCompanyV2 instead

  static async salaryForRole(role: string, company?: string, geo?: string) {
    const key = makeKey('ppx:salary', { role, company, geo })
    const cached = getCache(key)
    if (cached) return cached
    const client = createClient()
    const user = `Find current salary ranges for ${role}${company ? ` at ${company}` : ''}${geo ? ` in ${geo}` : ''}. Return JSON: items[{title,range,currency,geo,source,confidence}], summary, freshness`;
    try {
      const out = await client.makeRequest(SYSTEM, user, { temperature: 0.2, maxTokens: 900, model: 'sonar-pro' })
      const text = (out.content || '').trim()
      const context = {
        requestId: generateRequestId(),
        prompts: { system: SYSTEM, user },
        timestamp: Date.now(),
        duration: 0
      }
      const parsed = parseAIResponse<Record<string, unknown>>(text, { stripMarkdown: true, extractFirst: true }, context)
      setCache(key, parsed)
      return parsed
    } catch {
      return { items: [], summary: 'Unavailable', freshness: new Date().toISOString() }
    }
  }

  /**
   * Enhanced job listings search across 25+ Canadian and global job boards
   * Integrates with public-job-boards-config.ts for comprehensive coverage
   */
  static async jobListings(
    jobTitle: string, 
    location: string,
    options: {
      boards?: string[] // Specific boards to search (uses DISCOVERY_PRIORITY_ORDER if not specified)
      limit?: number
      includeCanadianOnly?: boolean
    } = {}
  ) {
    const { boards, limit = 50, includeCanadianOnly = false } = options
    const key = makeKey('ppx:jobs', { jobTitle, location, boards, limit })
    const cached = getCache(key)
    if (cached) return cached

    // Determine which boards to search
    const targetBoards = boards || (includeCanadianOnly 
      ? Object.keys(CANADIAN_JOB_BOARDS)
      : DISCOVERY_PRIORITY_ORDER.slice(0, 15) // Top 15 boards
    )

    // Note: targetBoards is used in the Perplexity prompt below to guide source selection

    const client = createClient()
    const SYSTEM_JOBS = `You are an advanced Job Listings Aggregator with real-time web access across 25+ Canadian and global job boards.

PRIORITY CANADIAN SOURCES:
- Job Bank Canada (jobbank.gc.ca) - Government jobs
- AutoJobs (autojobs.com) - Canadian automotive & skilled trades
- SimplyHired Canada (simplyhired.ca) - Canadian aggregator
- Jobboom (jobboom.com) - Bilingual Canadian
- Workopolis (workopolis.com) - Canadian
- Indeed Canada (ca.indeed.com)
- Jooble Canada (ca.jooble.org)
- ZipRecruiter Canada (ziprecruiter.ca)
- Monster Canada (monster.ca)
- Glassdoor Canada (glassdoor.ca)
- Dice Canada (dice.com)
- Careerjet Canada (careerjet.ca)

GLOBAL SOURCES:
- LinkedIn (linkedin.com/jobs)
- Indeed (indeed.com)
- Glassdoor (glassdoor.com)
- Adzuna (adzuna.com)

ATS PLATFORMS (Canadian Tech Companies):
- Greenhouse: Shopify, Hootsuite, Wealthsimple, Faire, Thinkific, Lightspeed
- Lever: Slack, Shopify, Bench, Clio, Clearco, League
- Workable: FreshBooks, Visier, Unbounce, Axonify
- Recruitee: Paytm, Ecobee, Geotab, Auvik, Wave, KOHO
- Ashby: Faire, Clearco, Maple, Borrowell, Shakepay
- Breezy HR: Lumerate, Zymewire, and other Canadian startups
- Communitech Job Board: communitech.ca/companies (Waterloo tech ecosystem)
- RemoteRocketship: remoterocketship.com (Remote Canadian jobs)

🔥 CRITICAL - FOLLOW LINKS AND EXTRACT FULL CONTENT:
For EACH job found, you MUST:
1. Find the job in search results (title, company, location, URL)
2. **FOLLOW THE JOB URL** and visit the actual job posting page
3. **SCRAPE THE COMPLETE JOB DESCRIPTION** from the posting page (all paragraphs, all bullet points)
4. Extract salary, benefits, requirements, responsibilities from the posting page
5. If company name is "Confidential" in search results - **VISIT THE URL** and extract the REAL company name from the posting page
6. If description is missing - **TRY COMPANY CAREERS PAGE** (company.com/careers) or **COMPANY ATS** (company.breezy.hr, company.greenhouse.io)

CRITICAL REQUIREMENTS:
1. **ONLY REAL COMPANY NAMES** - ABSOLUTELY NO CONFIDENTIAL LISTINGS:
   ❌ REJECT AND SKIP: "Confidential", "Various Employers", "Multiple Companies", "Undisclosed", "Private", "TBD", "N/A", "Various [Industry]", "Anonymous", "Stealth", "Hidden"
   ❌ DO NOT INCLUDE jobs where company name is hidden or confidential
   ✅ ONLY INCLUDE: Jobs with real, specific company names (e.g., "Ricoh Canada", "Shopify", "TD Bank", "Lumerate", "Zymewire")
2. **VERIFY COMPANY EXISTS** - Must be a real, identifiable company
3. **SKIP INVALID LISTINGS** - If company name is missing or confidential, DO NOT include it in results
4. **EXTRACT FULL DESCRIPTIONS** - Visit each job URL and scrape complete description (minimum 200 words)
5. Search ONLY publicly accessible listings (no login required)
6. Prioritize Canadian sources for Canadian locations
7. **Extract salary** from job posting page if available
8. Deduplicate across all sources by company + title
9. Rank by: recency → Canadian source priority → relevance
10. Return EXACTLY ${limit} unique listings with REAL company names and FULL descriptions

OUTPUT JSON (MUST BE VALID, COMPLETE JSON):
[{
  "title": string (specific job title, not "Various Positions"),
  "company": string (EXACT company name, not generic),
  "location": string (specific city/province),
  "url": string (direct job posting link),
  "summary": string (200-400 words, COMPLETE job description from posting page),
  "salary": string | null (extracted from posting page),
  "postedDate": "YYYY-MM-DD",
  "source": string (board name),
  "requirements": string[] (key requirements from posting),
  "benefits": string[] (benefits mentioned in posting)
}]`

    const USER_JOBS = `Search for "${jobTitle}" jobs in ${location} across these prioritized sources:
${targetBoards.slice(0, 10).join(', ')}

Return ${limit} unique, recent listings in JSON format. For Canadian locations, prioritize Job Bank, Jobboom, Workopolis first.`

    const requestId = generateRequestId()
    const started = Date.now()
    try {
      const out = await client.makeRequest(SYSTEM_JOBS, USER_JOBS, { 
        temperature: 0.2, 
        maxTokens: Math.min(limit * 500, 30000), // CRITICAL FIX: Increased from 300 to 500 tokens per job for full descriptions
        model: 'sonar-pro' // Use research model for job search
      })
      
      // FIXED: Check for truncation warning
      if (out.content.length > 18000) {
        console.warn('[JOB_LISTINGS] Response may be truncated, consider reducing limit or splitting into batches')
      }
      let text = (out.content || '').trim()
      
      // Extract JSON from response if wrapped in markdown or explanation
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        text = jsonMatch[0]
      }
      
      // FIX: Clean up truncated JSON
      // If JSON ends abruptly without closing ], try to fix it
      if (!text.endsWith(']')) {
        console.warn('[PERPLEXITY] JSON appears truncated, attempting to fix')
        // Find last complete object
        const lastCompleteObj = text.lastIndexOf('}')
        if (lastCompleteObj > 0) {
          text = text.substring(0, lastCompleteObj + 1) + ']'
        }
      }
      
      // FIX: Remove trailing commas before ]
      text = text.replace(/,(\s*)\]/g, '$1]')
      
      const context = {
        requestId,
        prompts: { system: SYSTEM_JOBS, user: USER_JOBS },
        timestamp: started,
        duration: Date.now() - started
      }
      let parsed: unknown
      try {
        parsed = parseAIResponse<unknown>(text, { stripMarkdown: true, extractFirst: true }, context)
      } catch (parseError: unknown) {
        console.error('[PERPLEXITY] JSON parse failed, raw text:', text.substring(0, 500))
        console.error('[PERPLEXITY] Parse error:', parseError)
        return []
      }
      
      const arr = Array.isArray(parsed) ? parsed.slice(0, limit) : []
      
      // CRITICAL FIX: Filter out confidential companies (NO FAKE/INFERRED DATA)
      const filtered = arr.filter((job: unknown) => {
        const jobObj = job as Record<string, unknown>
        const companyRaw = String(jobObj.company || '')
        const company = companyRaw.toLowerCase().trim()
        
        const isConfidential = 
          company.includes('confidential') ||
          company.includes('anonymous') ||
          company.includes('undisclosed') ||
          company.includes('various') ||
          company.includes('multiple') ||
          company.includes('private') ||
          company.includes('stealth') ||
          company.includes('hidden') ||
          company.includes('tbd') ||
          company.includes('n/a') ||
          company === '' ||
          company.length < 3
        
        if (isConfidential) {
          return false
        }
        return true
      })
      
      // Filtered confidential postings
      
      // Enhance with board metadata
      const enhanced = filtered.map((job: unknown) => {
        const jobObj = job as Record<string, unknown>
        return {
          ...jobObj,
          metadata: {
            searchedBoards: targetBoards.length,
            canadianPriority: includeCanadianOnly,
            extractedAt: new Date().toISOString(),
            confidentialFiltered: arr.length - filtered.length
          }
        }
      })
      
      // FIXED: Only cache if we have good success rate (at least 80%)
      const successRate = enhanced.length / limit
      if (enhanced.length > 0 && successRate >= 0.8) {
        setCache(key, enhanced)
        // Cached jobs
      } else if (enhanced.length > 0) {
        // Skipping cache - low success rate
      }
      return enhanced
    } catch (error) {
      console.error('[PERPLEXITY] Job listings failed:', error)
      return []
    }
  }

  // Fast SEARCH API for raw listings from specific domains (outside of template strings)
  static async jobQuickSearch(query: string, domains: string[] = [], maxResults: number = 20, recency: 'day'|'week'|'month'|'year' = 'month'): Promise<QuickSearchItem[]> {
    const key = makeKey('ppx:search', { query, domains, maxResults, recency })
    const cached = getCache(key) as QuickSearchItem[] | undefined
    if (cached) return cached
    try {
      const resp = await fetch('https://api.perplexity.ai/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          max_results: Math.max(5, Math.min(25, maxResults)),
          ...(domains.length ? { search_domain_filter: domains } : {}),
          search_recency_filter: recency
        })
      })
      if (!resp.ok) throw new Error('ppx search failed')
      const data = await resp.json() as unknown
      const asRecord = data as Record<string, unknown>
      const arr = (Array.isArray(asRecord?.results) ? (asRecord.results as unknown[]) : (Array.isArray(data as unknown[]) ? (data as unknown[]) : []))
      const mapped: QuickSearchItem[] = arr.map((raw: unknown) => {
        const it = (raw || {}) as Record<string, unknown>
        const title = typeof it.title === 'string' ? it.title : (typeof it.snippet === 'string' ? String(it.snippet) : '')
        const url = typeof it.url === 'string' ? it.url : (typeof it.link === 'string' ? String(it.link) : '')
        const snippet = typeof it.snippet === 'string' ? String(it.snippet) : (typeof it.summary === 'string' ? String(it.summary) : '')
        const source = typeof it.domain === 'string' ? String(it.domain) : (typeof it.source === 'string' ? String(it.source) : '')
        const publishedTime = it.published_time
        const dateField = it.date
        const published = (typeof publishedTime === 'string' ? publishedTime : (typeof dateField === 'string' ? dateField : undefined))
        return { title, url, snippet, source, postedDate: published }
      })
      setCache(key, mapped)
      return mapped
    } catch {
      return []
    }
  }

  // REMOVED: jobMarketAnalysis wrapper - Use jobMarketAnalysisV2 directly
  /**
   * V2: Enhanced job market analysis with options and ranking
   * Now integrated with 25+ Canadian and global job boards
   */
  static async jobMarketAnalysisV2(
    location: string, 
    resumeText: string, 
    options: { 
      roleHint?: string
      workType?: 'remote'|'hybrid'|'onsite'|'any'
      salaryMin?: number
      experienceLevel?: 'entry'|'mid'|'senior'|'executive'
      maxResults?: number
      boards?: string[] // Specify which boards to prioritize
    } = {}
  ): Promise<EnhancedResponse<JobListing[]>> {
    const requestId = generateRequestId()
    const started = Date.now()
    const key = makeKey('ppx:jobmarket:v2', { location, resume: resumeText.slice(0,1000), options })
    const cached = getCache(key) as JobListing[] | undefined
    if (cached) return { success: true, data: cached, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: true }

    // Determine if location is Canadian for prioritization
    const isCanadian = /canada|canadian|toronto|vancouver|montreal|calgary|ottawa|edmonton|quebec|winnipeg|halifax/i.test(location)
    const targetBoards = options.boards || (isCanadian 
      ? DISCOVERY_PRIORITY_ORDER.filter(b => CANADIAN_JOB_BOARDS[b]).concat(['linkedin', 'indeed', 'glassdoor'])
      : DISCOVERY_PRIORITY_ORDER.slice(0, 15)
    )

    try {
      const out = await withRetry(async () => {
        const client = createClient()
        const prompt = `REAL-TIME JOB SEARCH

SEARCH: "${options.roleHint || 'jobs'}" in "${location}"

CRITICAL RULES:
1. Return ONLY valid JSON array (no markdown code blocks, no explanations, no text before or after)
2. Each job MUST have: title, company, location, url
3. NO "Confidential" or "Unknown" companies - skip these entirely
4. URL must be direct link to job posting (NOT listing page)
5. Summary must be at least 100 characters

SEARCH THESE SOURCES:
${targetBoards.slice(0, 10).map((board, i) => {
  const config = CANADIAN_JOB_BOARDS[board] || MAJOR_JOB_BOARDS[board] || OPEN_API_BOARDS[board] || ATS_PLATFORMS[board]
  const baseUrl = config?.scrapingConfig?.baseUrl || ''
  const domain = baseUrl ? baseUrl.replace(/https?:\/\//, '').replace(/\/$/, '') : board
  return `- site:${domain} "${options.roleHint || 'jobs'}" "${location}"`
}).join('\n')}

EXTRACT FOR EACH JOB:
- title (exact job title)
- company (real company name, NOT "Confidential")
- location (city, province/state)
- url (direct link to job posting)
- summary (150+ characters describing the role)
- salary (if available, else null)
- postedDate (YYYY-MM-DD format)
- source (website name)
- skillMatchPercent (0-100 based on resume match)
- skills (array of required skills)
- workType ("remote" | "hybrid" | "onsite")
- experienceLevel ("entry" | "mid" | "senior" | "executive")

RESUME SKILLS TO MATCH:
${resumeText.slice(0, 500)}

RETURN STRICT JSON ARRAY (no markdown, no wrapper):
[
  {
    "title": "Senior Software Developer",
    "company": "Shopify",
    "location": "${location}",
    "url": "https://ca.indeed.com/viewjob?jk=abc123",
    "summary": "We are seeking a Senior Software Developer to join our team...",
    "salary": "$100,000 - $130,000",
    "postedDate": "2025-10-27",
    "source": "indeed",
    "skillMatchPercent": 85,
    "skills": ["JavaScript", "React", "Node.js"],
    "workType": "hybrid",
    "experienceLevel": "senior"
  }
]

MINIMUM: Return ${options.maxResults || 25} jobs
FORMAT: Valid JSON array only, no markdown, no text before or after`

        const res = await client.makeRequest(SYSTEM, prompt, { 
          temperature: 0.2, // Slightly higher for more variety
          maxTokens: 20000, // Increased to allow more jobs
          model: 'sonar' // Use faster model for job search
        })
        if (!res.content?.trim()) throw new Error('Empty job analysis')
        
        console.log('[JOB_SEARCH_V2] Perplexity response received:', {
          contentLength: res.content.length,
          preview: res.content.slice(0, 500)
        })
        
        return res
      })

      console.log('[JOB_SEARCH_V2] Parsing response...')
      console.log('[JOB_SEARCH_V2] Raw content length:', out.content.length)
      console.log('[JOB_SEARCH_V2] Raw content preview:', out.content.slice(0, 500))
      
      let parsed: JobListing[] = []
      
      try {
        // Try parseAIResponse which has 8 strategies including line-by-line
        parsed = parseAIResponse<JobListing[]>(out.content, { 
          stripMarkdown: true, 
          extractFirst: true,
          allowPartial: true,
          throwOnError: false
        })
        
        console.log('[JOB_SEARCH_V2] ✅ Parsing succeeded:', {
          isArray: Array.isArray(parsed),
          count: Array.isArray(parsed) ? parsed.length : 0,
          firstJob: parsed[0] ? { title: parsed[0].title, company: parsed[0].company } : null
        })
      } catch (parseError) {
        console.error('[JOB_SEARCH_V2] ❌ All parsing strategies failed:', {
          error: (parseError as Error).message,
          contentPreview: out.content.slice(0, 1000)
        })
        
        // Last resort: return empty array
        parsed = []
      }
      
      parsed = Array.isArray(parsed) ? parsed.slice(0, options.maxResults || 25) : []
      
      if (parsed.length === 0) {
        console.warn('[JOB_SEARCH_V2] ⚠️ WARNING: Perplexity returned 0 jobs. This might indicate:')
        console.warn('  1. No jobs found for this search')
        console.warn('  2. Perplexity did not perform web search')
        console.warn('  3. Response format is incorrect')
        console.warn('  Content received:', out.content.slice(0, 1000))
      }
      
      // CRITICAL FIX: Enrich jobs with short descriptions by scraping URLs
      const enriched = await Promise.all(
        parsed.map(async (job) => {
          if (job.summary && job.summary.length < 150 && job.url) {
            if (process.env.PPX_DEBUG === 'true') {
              console.log(`[ENRICH] Scraping ${job.url} for full description...`)
            }
            const fullDescription = await this.scrapeJobURL(job.url)
            if (fullDescription) {
              return { ...job, summary: fullDescription }
            }
          }
          return job
        })
      )
      
      // CRITICAL FIX: Validate job listings after enrichment
      parsed = this.validateJobListings(enriched, options.maxResults || 25)
      
      // Enhance and normalize
      parsed = parsed.map(j => ({
        ...j,
        skills: normalizeSkills(j.skills || []),
        skillMatchPercent: Math.max(0, Math.min(100, j.skillMatchPercent || 0)),
        workType: j.workType || 'onsite',
        experienceLevel: j.experienceLevel || 'mid',
        source: j.source || (typeof j.url === 'string' ? (new URL(j.url)).hostname.replace(/^www\./,'') : undefined),
        benefits: j.benefits || [],
        requirements: j.requirements || [],
        metadata: {
          searchedBoards: targetBoards.length,
          isCanadianSearch: isCanadian,
          extractedAt: new Date().toISOString()
        }
      }))

      // Sort by match quality, then recency
      parsed.sort((a,b)=>{
        if (Math.abs(a.skillMatchPercent - b.skillMatchPercent) > 5) {
          return b.skillMatchPercent - a.skillMatchPercent
        }
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
      })

      setCache(key, parsed)
      return { 
        success: true, 
        data: parsed,
        metadata: { 
          requestId, 
          timestamp: started, 
          duration: Date.now() - started,
          boardsSearched: targetBoards.length,
          resultsCount: parsed.length
        }, 
        cached: false 
      }
    } catch (e) {
      console.error('[JOB_SEARCH_ERROR] Job search failed:', {
        error: (e as Error).message,
        stack: (e as Error).stack,
        location,
        roleHint: options.roleHint,
        boards: targetBoards.slice(0, 5)
      })
      
      return { 
        success: false, 
        data: [], 
        metadata: { 
          requestId, 
          timestamp: started, 
          duration: Date.now() - started, 
          error: (e as Error).message 
        }, 
        cached: false 
      }
    }
  }

  // V2: Enhanced hiring contacts with email enrichment and discovery
  static async hiringContactsV2(companyName: string): Promise<EnhancedResponse<HiringContact[]>> {
    const requestId = generateRequestId()
    const started = Date.now()
    const key = makeKey('ppx:contacts:v2', { companyName })
    const cached = getCache(key) as HiringContact[] | undefined
    if (cached) return { success: true, data: cached, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: true }
    try {
      const out = await withRetry(async () => {
        const client = createClient()
        
        // PERPLEXITY AUDIT FIX: Use optimal configuration
        const { getPerplexityConfig } = await import('./config/perplexity-configs')
        const config = getPerplexityConfig('hiringContacts')
        
        // ULTRA-AGGRESSIVE: Multi-platform exhaustive contact scraping
        const prompt = `HIRING CONTACTS FOR ${companyName}

YOUR TASK: Find 3-5 real hiring contacts (recruiters, HR, talent acquisition) at ${companyName}.

SEARCH THESE PLACES (in order of priority):
1. ${companyName} careers page (/careers, /jobs) - look for "recruiting team" or "contact us"
2. LinkedIn - search "${companyName} recruiter" or "${companyName} talent acquisition"
3. Company website "Team" or "About Us" page
4. ${companyName} company directory or contact page

WHAT TO EXTRACT:
- Full name (REAL names only, not "HR Department")
- Job title (must include recruiter/HR/talent)
- Email address (ONLY if publicly listed)
- LinkedIn profile URL (if available)

CRITICAL RULES:
1. ONLY include contacts you can SEE on public pages
2. DO NOT make up or guess email addresses
3. DO NOT use generic emails like info@, hello@, support@
4. If you find 0 verified contacts, return empty array []
5. Each contact MUST have either a real email OR LinkedIn URL

RETURN THIS JSON (no markdown):
[
  {
    "name": "Sarah Johnson",
    "title": "Senior Technical Recruiter",
    "email": "sarah.johnson@company.com",
    "linkedinUrl": "https://linkedin.com/in/sarahjohnson",
    "source": "Company careers page",
    "confidence": 0.95
  }
]

If NO contacts found, return: []`

        // PERPLEXITY AUDIT FIX: Use optimal token limits + sonar-pro for research
        return client.makeRequest(SYSTEM, prompt, { 
          temperature: config.temperature, 
          maxTokens: config.maxTokens,
          model: 'sonar-pro' // Use research model for multi-source search
        })
      })
      
      // CRITICAL DEBUG: Log raw Perplexity output (Perplexity recommendation)
      if (process.env.PPX_DEBUG === 'true') {
        console.log('[PERPLEXITY RAW]', {
          method: 'hiringContactsV2',
          company: companyName,
          contentLength: out.content.length,
          contentPreview: out.content.slice(0, 500)
        })
      }
      
      // Parse and clean Perplexity response - ENTERPRISE-GRADE JSON EXTRACTION
      let cleanedContent = out.content.trim()
      
      // Step 1: Remove markdown code blocks
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
      
      // Step 2: Extract JSON array from any surrounding text
      const jsonMatch = cleanedContent.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      } else {
        // Step 3: If no array found, check for explanatory text with JSON after it
        const afterTextMatch = cleanedContent.match(/(?:Here|I found|Below|Results?)[\s\S]*?(\[[\s\S]*?\])/i);
        if (afterTextMatch) {
          cleanedContent = afterTextMatch[1]
        } else {
          console.warn('[HIRING_CONTACTS] No JSON array found in response, returning empty array')
          return { success: false, data: [], metadata: { requestId, timestamp: started, duration: Date.now() - started, error: 'No JSON array in response' }, cached: false }
        }
      }
      
      // PERPLEXITY AUDIT FIX: Use enterprise-grade JSON extraction
      const { extractEnterpriseJSON } = await import('./utils/enterprise-json-extractor')
      const extractionResult = extractEnterpriseJSON(cleanedContent)
      
      if (!extractionResult.success) {
        console.error('[HIRING_CONTACTS] Enterprise JSON extraction failed:', extractionResult.error)
        console.error('[HIRING_CONTACTS] Attempted cleanups:', extractionResult.attemptedCleanups)
        console.error('[HIRING_CONTACTS] Raw content preview:', out.content.slice(0, 500))
        return { 
          success: false, 
          data: [], 
          metadata: { 
            requestId, 
            timestamp: started, 
            duration: Date.now() - started, 
            error: `Enterprise JSON extraction failed: ${extractionResult.error}`,
            attemptedCleanups: extractionResult.attemptedCleanups
          }, 
          cached: false 
        }
      }
      
      // CRITICAL FIX: ALWAYS ensure we have an array (never undefined/null)
      let parsed: HiringContact[] = []
      
      if (Array.isArray(extractionResult.data)) {
        parsed = extractionResult.data.slice(0, 8)
      } else if (extractionResult.data && typeof extractionResult.data === 'object') {
        // Handle case where AI returns single object instead of array
        parsed = [extractionResult.data]
      }
      
      // Enterprise extraction succeeded
      
      // CRITICAL: Validate and filter contacts - reject fake/personal emails
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com']
      parsed = parsed.filter(contact => {
        // Must have at least one contact method
        if (!contact.email && !contact.phone && !contact.linkedinUrl) {
          console.warn(`[HIRING_CONTACTS] Rejected contact with no contact method: ${contact.name}`)
          return false
        }
        
        // Reject inferred/template emails
        if (contact.email?.includes('[') || 
            contact.email?.includes('example.') || 
            contact.email?.includes('domain.') ||
            contact.email?.includes('VISIT_WEBSITE')) {
          console.warn(`[HIRING_CONTACTS] Rejected template email: ${contact.email}`)
          return false
        }
        
        // Reject personal emails
        if (contact.email && personalDomains.some(d => contact.email!.toLowerCase().endsWith(d))) {
          console.warn(`[HIRING_CONTACTS] Rejected personal email: ${contact.email}`)
          return false
        }
        
        // Reject LinkedIn profiles without proper URL
        if (contact.linkedinUrl && !contact.linkedinUrl.includes('linkedin.com/')) {
          console.warn(`[HIRING_CONTACTS] Rejected invalid LinkedIn URL: ${contact.linkedinUrl}`)
          return false
        }
        
        return true
      })
      
      // Validation complete
      
      // Enhance each contact with metadata
      parsed = parsed.map(c => {
        const domain = `${companyName.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'')}.com`
        const inferred = c.name ? inferEmails(c.name, domain) : []
        
        return { 
          ...c, 
          confidence: Math.max(0, Math.min(1, c.confidence || 0.5)), 
          alternativeEmails: c.alternativeEmails || inferred, 
          emailType: (c.email ? c.emailType : 'pattern') as 'public'|'inferred'|'pattern',
          discoveryMethod: c.discoveryMethod || (c.email ? 'Direct lookup' : 'Pattern inference')
        }
      })
      
      // Final result prepared
      
      // CRITICAL FIX: Validate contacts before returning
      const validated = this.validateHiringContacts(parsed)
      
      // CRITICAL FIX: NO INFERRED EMAILS - return empty if none verified
      // User should visit company website or use LinkedIn instead of contacting fake emails
      const finalContacts = validated
      
      // Cache the result (even if empty)
      setCache(key, finalContacts)
      
      return { 
        success: validated.length > 0, 
        data: finalContacts, 
        metadata: { 
          requestId, 
          timestamp: started, 
          duration: Date.now() - started,
          contactsFound: finalContacts.length,
          withEmails: finalContacts.filter(c => c.email).length,
          error: validated.length === 0 
            ? `No verified hiring contacts found for ${companyName}. Visit company website or use LinkedIn InMail.` 
            : undefined
        }, 
        cached: false 
      }
    } catch (e) {
      console.error('[HIRING_CONTACTS] Error:', e)
      return { success: false, data: [], metadata: { requestId, timestamp: started, duration: Date.now() - started, error: (e as Error).message }, cached: false }
    }
  }

  // ... (rest of the code remains the same)

  // Extract normalized keywords and location from resume (STRICT JSON)
  static async extractResumeSignals(
    resumeText: string,
    maxKeywords: number = 50
  ): Promise<{ keywords: string[]; location?: string; locations?: string[]; personalInfo?: { name?: string; email?: string; phone?: string } }> {
    const key = makeKey('ppx:resume:signals:v3', { t: resumeText.slice(0, 3000), maxKeywords })
    const cached = getCache(key) as { keywords: string[]; location?: string; locations?: string[] } | undefined
    if (cached) return cached

    try {
      const client = createClient()
      
      const prompt = `ANALYZE THIS RESUME TEXT AND EXTRACT KEYWORDS + LOCATION

CRITICAL: DO NOT search the web. ONLY read the resume text below.

RESUME TEXT:
${resumeText}

TASK 1 - EXTRACT KEYWORDS:
1. Extract EXACTLY 50 keywords (skills, technologies, competencies) FROM THE RESUME TEXT ABOVE
2. Weight keywords by recency and frequency
3. Return keywords in PRIORITY ORDER (most important first)

TASK 2 - EXTRACT LOCATION FROM RESUME:
CRITICAL RULES:
- Read the resume text above carefully
- Look for location in: contact info section, address, current location
- Extract the SPECIFIC CITY and PROVINCE/STATE (e.g., "Edmonton, AB" or "Toronto, ON")
- DO NOT return just "Canada" - that's too broad
- DO NOT search the web for location - ONLY use what's in the resume text
- If you find "Edmonton, Alberta" write it as "Edmonton, AB"
- If you find "Toronto, Ontario" write it as "Toronto, ON"
- If no specific city found, return null

EXAMPLES:
- Resume says "Edmonton, Alberta" → return "Edmonton, AB"
- Resume says "123 Main St, Calgary, AB" → return "Calgary, AB"
- Resume says "Toronto, ON" → return "Toronto, ON"
- Resume only says "Canada" → return null (too broad)

RETURN STRICT JSON (no markdown, no explanations):
{
  "keywords": ["Most Important Skill", "Second Most Important", ..., "50th skill"],
  "location": "City, PROVINCE" or null,
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "555-1234"
  }
}

CRITICAL: 
- Return EXACTLY 50 keywords
- Extract location FROM THE RESUME TEXT ONLY (not from web search)
- Location must be "City, Province" format or null`

      console.log('[SIGNALS] Extracting resume signals...')

      const response = await client.makeRequest(
        'You are a resume parser. Extract data from the resume text provided. DO NOT search the web. Return only JSON.',
        prompt,
        { temperature: 0.1, maxTokens: 2500, model: 'sonar' }
      )

      if (process.env.PPX_DEBUG === 'true') {
        console.log('[SIGNALS] Raw response:', response.content?.slice(0, 400))
      }

      // ENTERPRISE FIX: Strip markdown code blocks that Perplexity sometimes adds
      let cleanedContent = response.content.trim()
      
      // Remove markdown code fences (```json ... ``` or ``` ... ```)
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
      
      // Extract JSON array/object if wrapped in explanatory text
      const jsonMatch = cleanedContent.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      }

      const parsed = JSON.parse(cleanedContent) as { keywords: string[]; location?: string; locations?: string[]; personalInfo?: { name?: string; email?: string; phone?: string } }
      
      if (process.env.PPX_DEBUG === 'true') {
        console.log('[SIGNALS] Parsed:', {
          keywordCount: parsed.keywords?.length,
          location: parsed.location,
          hasLocations: !!parsed.locations,
          personalInfo: parsed.personalInfo
        })
      }

      setCache(key, parsed)
      return parsed
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════')
      console.error('[EXTRACT SIGNALS] ❌ PERPLEXITY EXTRACTION FAILED')
      console.error('═══════════════════════════════════════════════════════')
      console.error('[EXTRACT SIGNALS] Error:', (error as Error).message)
      console.error('[EXTRACT SIGNALS] Resume text length:', resumeText.length, 'chars')
      console.error('[EXTRACT SIGNALS] First 300 chars of resume:')
      console.error(resumeText.substring(0, 300))
      console.error('═══════════════════════════════════════════════════════')
      
      // CRITICAL: Don't return fake data - throw error so upload route can handle it
      throw new Error(`Failed to extract resume signals: ${(error as Error).message}. Resume may be missing contact information or is corrupted.`)
    }
  }

  // ... (rest of the code remains the same)

  /**
   * ONE-SHOT COMPREHENSIVE RESEARCH
   * Replaces multiple API calls with a single comprehensive prompt
   * Returns: Job Analysis + Company Research + Hiring Contacts + News + Reviews
   * 
   * @param params - Job and resume details
   * @returns Complete research data for all Career Finder pages
   */
  static async comprehensiveJobResearch(params: {
    jobTitle: string
    company: string
    jobDescription: string
    location?: string
    resumeText: string
    resumeSkills?: string[]
  }): Promise<EnhancedResponse<ComprehensiveJobResearchData | null>> {
    const requestId = generateRequestId()
    const started = Date.now()

    try {
      const client = createClient()

      const prompt = `COMPREHENSIVE JOB APPLICATION RESEARCH

- Position: ${params.jobTitle}
- Company: ${params.company}
- Location: ${params.location || 'Not specified'}
- Description: ${params.jobDescription.slice(0, 1000)}

CANDIDATE SKILLS: ${params.resumeSkills ? params.resumeSkills.slice(0, 20).join(', ') : 'Extract from resume below'}

RESUME TEXT (First 2000 chars):
${params.resumeText.slice(0, 2000)}

---

YOUR MISSION: Conduct a comprehensive research report covering ALL of the following sections. This is a ONE-TIME research call, so be thorough and detailed. Include clickable URLs wherever possible.

OUTPUT FORMAT (Valid JSON ONLY):
\`\`\`json
{
  "jobAnalysis": {
    "matchScore": 85,
    "matchingSkills": ["skill1", "skill2"],
    "missingSkills": ["skill3", "skill4"],
    "skillsToHighlight": ["top skill to emphasize"],
    "recommendations": ["specific action 1", "specific action 2"],
    "estimatedFit": "Excellent|Good|Moderate|Poor"
  },
  "companyIntel": {
    "company": "${params.company}",
    "description": "detailed company overview (minimum 200 chars)",
    "size": "employee count or range",
    "revenue": "annual revenue if public",
    "industry": "primary industry",
    "founded": "year",
    "headquarters": "city, state/country",
    "website": "https://company.com",
    "marketPosition": "market leader|challenger|niche player",
    "generalEmail": "ONLY include if found on company website or LinkedIn - DO NOT GUESS. Leave empty if not found.",
    "careersPage": "https://company.com/careers"
  },
  "companyPsychology": {
    "culture": "detailed culture description based on reviews and public info",
    "values": ["value1", "value2", "value3"],
    "managementStyle": "hierarchical|flat|hybrid",
    "workEnvironment": "remote-friendly|hybrid|office-centric"
  },
  "hiringContacts": [
    {
      "name": "Real Person Name - ONLY if found on LinkedIn or company website",
      "title": "Talent Acquisition Manager",
      "department": "Human Resources",
      "email": "ONLY include if verified from LinkedIn or company website - DO NOT GUESS. Leave empty if not found.",
      "linkedinUrl": "https://linkedin.com/in/person - ONLY if found",
      "authority": "decision maker",
      "confidence": 0.9
    }
  ],
  "CRITICAL_INSTRUCTION": "DO NOT GUESS EMAILS. Only include emails that are explicitly found on the company website, LinkedIn profiles, or other verified sources. If no email is found, leave the field empty or set to null. NEVER construct emails like info@company.com or careers@company.com unless they are explicitly listed on official sources.",
  "marketIntelligence": {
    "competitivePosition": "how company compares to competitors",
    "industryTrends": "relevant industry trends affecting this role",
    "financialStability": "financial health assessment",
    "recentPerformance": "last 12 months highlights"
  },
  "news": [
    {
      "title": "Recent news headline",
      "summary": "Brief summary of the article",
      "url": "https://newsource.com/article",
      "date": "2024-01-15",
      "source": "TechCrunch",
      "impact": "positive|neutral|negative for employment"
    }
  ],
  "reviews": [
    {
      "platform": "Glassdoor",
      "rating": 4.2,
      "summary": "Overall employee sentiment summary",
      "url": "https://glassdoor.com/company-reviews",
      "pros": ["pro1", "pro2"],
      "cons": ["con1", "con2"]
    }
  ],
  "compensation": {
    "salaryRange": "$XX,000 - $YY,000 for ${params.jobTitle}",
    "benefits": "typical benefits package"
  },
  "strategicRecommendations": {
    "applicationStrategy": "specific advice on how to apply",
    "contactStrategy": "who to contact first and how",
    "interviewPrep": ["prepare for X", "research Y", "practice Z"]
  },
  "sources": ["https://source1.com", "https://source2.com", "https://source3.com"],
  "confidenceLevel": 0.85
}
\`\`\`

CRITICAL REQUIREMENTS:
1. Job Analysis: Compare resume skills to job requirements, calculate match score
2. Company Intel: Search company website, LinkedIn, Crunchbase, Wikipedia for REAL data
   - MUST find general company email (careers@, hr@, jobs@, info@, contact@)
   - Check company website contact page, footer, careers page
   - If no email found, generate likely addresses based on domain
3. Hiring Contacts: **CRITICAL - MUST FIND CONTACTS**
   - Search LinkedIn, Twitter, Facebook, Instagram, company website
   - Minimum 2-3 REAL hiring contacts if company has 10+ employees
   - Include verified LinkedIn URLs and emails where possible
   - DO NOT return fake/placeholder names
   - **MANDATORY FALLBACK**: If no hiring contacts found, extract company general inbox:
     * Check: careers@, hr@, jobs@, info@, hello@, contact@, support@
     * Return as: {"name":"General Inbox","title":"Company Contact","email":"found@company.com"}
   - NEVER return empty contacts array - app is useless without contact info
4. News: Find 2-5 recent news articles about the company with clickable URLs
5. Reviews: Search Glassdoor, Indeed, Comparably for employee reviews with clickable URLs
6. Market Intelligence: Research industry trends, competitive landscape
7. Strategic Recommendations: Provide actionable, company-specific advice

IMPORTANT:
- Return ONLY valid JSON (no markdown, no explanations)
- All URLs must be real and clickable
- If data not found after searching, use "Not available" but ALWAYS try multiple sources first
- Focus on actionable intelligence, not generic advice`

      const out = await withRetry(async () => {
        return client.makeRequest(
          'You are an elite corporate intelligence analyst providing comprehensive job application research. Return detailed JSON with all requested fields.',
          prompt,
          {
            temperature: 0.2,
            maxTokens: 8000,
            model: 'sonar-pro'
          }
        )
      })

      if (process.env.PPX_DEBUG === 'true') {
        console.log('[COMPREHENSIVE_RESEARCH] Raw response length:', out.content.length)
      }

      // Parse response
      let cleanedContent = out.content.trim()
      
      // Remove markdown code blocks
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
      
      // Extract JSON object
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      }

      const parsed = JSON.parse(cleanedContent) as Partial<ComprehensiveJobResearchData>

      // Construct with fallbacks
      const data: ComprehensiveJobResearchData = {
        jobAnalysis: {
          matchScore: parsed.jobAnalysis?.matchScore ?? 0,
          matchingSkills: parsed.jobAnalysis?.matchingSkills ?? [],
          missingSkills: parsed.jobAnalysis?.missingSkills ?? [],
          skillsToHighlight: parsed.jobAnalysis?.skillsToHighlight ?? [],
          recommendations: parsed.jobAnalysis?.recommendations ?? [],
          estimatedFit: parsed.jobAnalysis?.estimatedFit ?? 'Unknown'
        },
        companyIntel: {
          company: parsed.companyIntel?.company ?? params.company,
          description: parsed.companyIntel?.description ?? 'No description available',
          size: parsed.companyIntel?.size ?? 'Unknown',
          revenue: parsed.companyIntel?.revenue,
          industry: parsed.companyIntel?.industry ?? 'Unknown',
          founded: parsed.companyIntel?.founded,
          headquarters: parsed.companyIntel?.headquarters,
          website: parsed.companyIntel?.website,
          marketPosition: parsed.companyIntel?.marketPosition
        },
        companyPsychology: {
          culture: parsed.companyPsychology?.culture ?? 'No information available',
          values: parsed.companyPsychology?.values ?? [],
          managementStyle: parsed.companyPsychology?.managementStyle,
          workEnvironment: parsed.companyPsychology?.workEnvironment
        },
        hiringContacts: Array.isArray(parsed.hiringContacts)
          ? parsed.hiringContacts
              .map(contact => ({
                name: contact.name,
                title: contact.title,
                department: contact.department,
                email: contact.email,
                linkedinUrl: contact.linkedinUrl,
                authority: contact.authority ?? 'manager',
                confidence: contact.confidence ?? 0,
                contactMethod: contact.contactMethod
              }))
              .filter(contact => !!contact?.name && contact?.title)
          : [],
        marketIntelligence: {
          competitivePosition: parsed.marketIntelligence?.competitivePosition,
          industryTrends: parsed.marketIntelligence?.industryTrends,
          financialStability: parsed.marketIntelligence?.financialStability,
          recentPerformance: parsed.marketIntelligence?.recentPerformance
        },
        news: Array.isArray(parsed.news)
          ? parsed.news
              .map(item => (item?.title && item?.summary && item?.url
                ? {
                    title: item.title,
                    summary: item.summary,
                    url: item.url,
                    date: item.date,
                    source: item.source,
                    impact: item.impact
                  }
                : undefined))
              .filter((item): item is NonNullable<typeof item> => !!item)
          : [],
        reviews: Array.isArray(parsed.reviews)
          ? parsed.reviews
              .map(item => (item?.platform && item?.summary && item?.url
                ? {
                    platform: item.platform,
                    rating: item.rating,
                    summary: item.summary,
                    url: item.url,
                    pros: item.pros,
                    cons: item.cons
                  }
                : undefined))
              .filter((item): item is NonNullable<typeof item> => !!item)
          : [],
        compensation: parsed.compensation ?? {},
        strategicRecommendations: {
          applicationStrategy: parsed.strategicRecommendations?.applicationStrategy ?? 'Apply through company website',
          contactStrategy: parsed.strategicRecommendations?.contactStrategy ?? 'Reach out to HR via LinkedIn',
          interviewPrep: parsed.strategicRecommendations?.interviewPrep ?? []
        },
        sources: Array.isArray(parsed.sources)
          ? parsed.sources.filter((source): source is string => typeof source === 'string')
          : [],
        confidenceLevel: parsed.confidenceLevel ?? 0.5
      }

      if (process.env.PPX_DEBUG === 'true') {
        console.log('[COMPREHENSIVE_RESEARCH] Complete -', 
          'matchScore:', data.jobAnalysis.matchScore, 
          'contacts:', data.hiringContacts.length, 
          'news:', data.news.length, 
          'reviews:', data.reviews.length, 
          'confidence:', data.confidenceLevel
        )
      }

      return {
        success: true,
        data,
        metadata: { requestId, timestamp: started, duration: Date.now() - started },
        cached: false
      }
    } catch (error) {
      console.error('[COMPREHENSIVE_RESEARCH] Error:', error)
      return {
        success: false,
        data: null,
        metadata: { 
          requestId, 
          timestamp: started, 
          duration: Date.now() - started,
          error: (error as Error).message 
        },
        cached: false
      }
    }
  }

  // Resume Optimizer: Generate tailored resume variants
  static async generateResumeVariants(params: {
    resumeText: string
    jobTitle: string
    jobRequirements: string[]
    companyInsights: { culture: string; values: string[]; industry: string }
    template?: string
  }): Promise<EnhancedResponse<{
    variantA: string
    variantB: string
    recommendations: string[]
  }>> {
    const requestId = generateRequestId()
    const started = Date.now()
    const cacheKey = makeKey('resume-variants', params)
    
    const cached = getCache(cacheKey)
    if (cached) {
      return {
        success: true,
        data: cached as { variantA: string; variantB: string; recommendations: string[] },
        metadata: { requestId, timestamp: started, duration: 0 },
        cached: true
      }
    }

    try {
      const client = createClient()
      const systemPrompt = 'You are a professional resume optimization expert. Return only valid JSON with properly formatted resume text.'
      
      // Build template-specific instructions
      const templateInstructions = {
        modern: 'Use a contemporary style with visual hierarchy. Emphasize innovation and forward-thinking achievements.',
        professional: 'Use traditional, formal language. Focus on stability, reliability, and proven track record.',
        creative: 'Use dynamic language and unique phrasing. Highlight creativity, innovation, and out-of-the-box thinking.',
        tech: 'Use technical terminology and emphasize projects, technologies, and technical achievements.',
        minimal: 'Use simple, direct language. Focus on facts and quantifiable results. Maximum ATS compatibility.',
        executive: 'Use leadership language. Emphasize strategic impact, team leadership, and business results.'
      }
      
      const templateStyle = templateInstructions[params.template as keyof typeof templateInstructions] || templateInstructions.modern
      
      const userPrompt = `Analyze this resume and create TWO tailored variants for the target role using the ${params.template} template style.

**Resume:**
${params.resumeText}

**Target Role:** ${params.jobTitle}

**Key Requirements:**
${params.jobRequirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

**Company Culture:** ${params.companyInsights.culture}
**Company Values:** ${params.companyInsights.values.join(', ')}
**Industry:** ${params.companyInsights.industry}

**Template Style (${params.template}):** ${templateStyle}

Generate TWO resume variants:
1. **Variant A (Achievement-Focused):** Emphasize quantifiable achievements and metrics. ${templateStyle}
2. **Variant B (Skills-Focused):** Highlight technical skills and competencies. ${templateStyle}

CRITICAL FORMATTING REQUIREMENTS:
- Use proper line breaks (\\n\\n for sections, \\n for lines)
- DO NOT include name, email, phone, or address in the resume body
- Personal contact info will be added separately by the template
- Start directly with PROFESSIONAL SUMMARY or first section
- Use clear section headers (PROFESSIONAL SUMMARY, EXPERIENCE, EDUCATION, SKILLS)
- Format each job entry with: Title\\nCompany | Location | Dates\\n• Achievement 1\\n• Achievement 2
- Keep bullet points aligned with • symbol
- Ensure proper spacing between sections
- NO markdown formatting (no **, no #, no _)
- Plain text only with line breaks
- INCLUDE ALL job history from original resume

CRITICAL - PERSONAL INFO:
- DO NOT include the person's name anywhere in the resume body
- DO NOT include email address in the resume body
- DO NOT include phone number in the resume body
- DO NOT include physical address in the resume body
- These will be added by the template header automatically
- Start the resume body with the PROFESSIONAL SUMMARY section

For each variant, rewrite the resume to:
- Match keywords from job requirements
- Align with company culture and values
- Use industry-specific terminology appropriate for ${params.template} template
- Optimize for ATS (Applicant Tracking Systems)
- Keep formatting clean and professional
- Apply ${params.template} template style throughout
- NEVER duplicate personal contact information

Also provide 3-5 strategic recommendations for improving the resume.

Return ONLY valid JSON:
{
  "variantA": "Full resume text WITHOUT personal info (starts with PROFESSIONAL SUMMARY)...",
  "variantB": "Full resume text WITHOUT personal info (starts with PROFESSIONAL SUMMARY)...",
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}`

      const response = await withRetry(
        () => client.makeRequest(systemPrompt, userPrompt, { temperature: 0.2, maxTokens: 4000, model: 'sonar-pro' }),
        MAX_RETRY_ATTEMPTS
      )

      const parsed = parseAIResponse<{
        variantA: string
        variantB: string
        recommendations: string[]
      }>(response.content)

      const data = {
        variantA: parsed.variantA || params.resumeText,
        variantB: parsed.variantB || params.resumeText,
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
      }

      setCache(cacheKey, data)

      return {
        success: true,
        data,
        metadata: { requestId, timestamp: started, duration: Date.now() - started },
        cached: false
      }
    } catch (error) {
      console.error('[RESUME_VARIANTS] Error:', error)
      return {
        success: false,
        data: {
          variantA: params.resumeText,
          variantB: params.resumeText,
          recommendations: []
        },
        metadata: { 
          requestId, 
          timestamp: started, 
          duration: Date.now() - started,
          error: (error as Error).message 
        },
        cached: false
      }
    }
  }

  // Cover Letter Generator: Create personalized cover letters using templates
  static async generateCoverLetters(params: {
    jobTitle: string
    company: string
    jobRequirements: string[]
    resumeText: string
    companyInsights: {
      culture: string
      values: string[]
      recentNews: Array<{ title: string; summary: string }>
    }
    hiringManager?: { name: string; title: string }
    userName?: string
    templateId?: string
  }): Promise<EnhancedResponse<{
    variantA: string
    variantB: string
    personalization: string[]
  }>> {
    const requestId = generateRequestId()
    const started = Date.now()
    const cacheKey = makeKey('cover-letters', params)
    
    const cached = getCache(cacheKey)
    if (cached) {
      return {
        success: true,
        data: cached as { variantA: string; variantB: string; personalization: string[] },
        metadata: { requestId, timestamp: started, duration: 0 },
        cached: true
      }
    }

    try {
      // CRITICAL FIX: Calculate years of experience to prevent hallucinations
      const yearsExperience = calculateYearsFromResume(params.resumeText)
      if (process.env.PPX_DEBUG === 'true') {
        console.log('[COVER_LETTERS] Calculated experience:', yearsExperience, 'years')
      }

      // Get templates - use professional and modern as defaults
      const templateA = getCoverLetterTemplateById(params.templateId || 'professional')
      const templateB = getCoverLetterTemplateById('modern')

      const client = createClient()
      const systemPrompt = `You are an expert cover letter writer. Use the provided templates as structure guides and fill them with personalized content from the candidate's resume.

CRITICAL EXPERIENCE CONSTRAINT:
- Candidate has EXACTLY ${yearsExperience} years of total work experience
- DO NOT say "decades", "38 years", or any number higher than ${yearsExperience}
- If ${yearsExperience} < 10, say "several years" or "${yearsExperience} years"
- If ${yearsExperience} >= 10 && ${yearsExperience} < 20, say "${yearsExperience} years" or "over a decade"
- If ${yearsExperience} >= 20, say "${yearsExperience} years" or "two decades"
- NEVER invent or exaggerate experience duration
- Use ONLY the experience data provided in the resume

Return only valid JSON.`

    const userPrompt = `GENERATE COVER LETTER FOR JOB APPLICATION

CRITICAL RULE: The candidate is APPLYING TO this company. They do NOT currently work there.

CANDIDATE INFO:
- Name: ${params.userName || '[Your Name]'}
- Target Job: ${params.jobTitle} at ${params.company}

IMPORTANT:
- NEVER write "As a ${params.jobTitle} at ${params.company}..."
- ALWAYS write "I am excited to apply for the ${params.jobTitle} position at ${params.company}..."
- The candidate is seeking employment, NOT currently employed there

**TEMPLATE A (${templateA.name}):**
${templateA.template}

**TEMPLATE B (${templateB.name}):**
${templateB.template}

**Job Details:**
- Job Title: ${params.jobTitle}
- Company: ${params.company}
- Hiring Manager: ${params.hiringManager?.name || 'Hiring Manager'}

**Key Requirements:**
${params.jobRequirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

**Resume Content (${yearsExperience} years experience):**
${params.resumeText.slice(0, 1500)}

**Company Research:**
- Culture: ${params.companyInsights.culture}
- Values: ${params.companyInsights.values.join(', ')}
- Recent News: ${params.companyInsights.recentNews.map(n => n.title).join(', ')}

Write a compelling 3-paragraph cover letter that:
1. States interest in the OPEN POSITION
2. Highlights relevant experience from PREVIOUS roles
3. Explains why candidate wants to JOIN the company

CRITICAL RULES:
- Experience: EXACTLY ${yearsExperience} years (no more, no less)
- NO generic phrases like "proven track record" without specifics
- NO casual language like "Here's what most people don't realize"
- ALL achievements must come from the actual resume
- Keep professional and mature tone
- Candidate is APPLYING, not currently employed at target company

Return ONLY valid JSON:
{
  "variantA": "Full cover letter text using Template A structure...",
  "variantB": "Full cover letter text using Template B structure...",
  "personalization": ["Tip 1", "Tip 2", "Tip 3"]
}`

      const response = await withRetry(
        () => client.makeRequest(systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 4000, model: 'sonar-pro' }),
        MAX_RETRY_ATTEMPTS
      )

      const parsed = parseAIResponse<{
        variantA: string
        variantB: string
        personalization: string[]
      }>(response.content)

      const data = {
        variantA: parsed.variantA || 'Cover letter generation failed',
        variantB: parsed.variantB || 'Cover letter generation failed',
        personalization: Array.isArray(parsed.personalization) ? parsed.personalization : []
      }

      setCache(cacheKey, data)

      return {
        success: true,
        data,
        metadata: { requestId, timestamp: started, duration: Date.now() - started },
        cached: false
      }
    } catch (error) {
      console.error('[COVER_LETTERS] Error:', error)
      return {
        success: false,
        data: {
          variantA: 'Cover letter generation failed',
          variantB: 'Cover letter generation failed',
          personalization: []
        },
        metadata: { 
          requestId, 
          timestamp: started, 
          duration: Date.now() - started,
          error: (error as Error).message 
        },
        cached: false
      }
    }
  }

  // Email Outreach Generator: Create personalized email templates
  static async generateEmailOutreach(params: {
    hiringContact: { name: string; title: string; email?: string }
    jobTitle: string
    company: string
    resumeHighlights: string[]
  }): Promise<EnhancedResponse<{
    subjects: string[]
    templates: Array<{ type: 'formal' | 'conversational'; body: string }>
    mailtoLink: string
  }>> {
    const requestId = generateRequestId()
    const started = Date.now()
    const cacheKey = makeKey('email-outreach', params)
    
    const cached = getCache(cacheKey)
    if (cached) {
      return {
        success: true,
        data: cached as { subjects: string[]; templates: Array<{ type: 'formal' | 'conversational'; body: string }>; mailtoLink: string },
        metadata: { requestId, timestamp: started, duration: 0 },
        cached: true
      }
    }

    try {
      const client = createClient()
      const systemPrompt = 'You are an expert at professional networking and cold email outreach. Return only valid JSON.'
      const userPrompt = `Create personalized email outreach templates for contacting a hiring manager.

**Hiring Contact:** ${params.hiringContact.name}, ${params.hiringContact.title}
**Job Title:** ${params.jobTitle}
**Company:** ${params.company}

**Resume Highlights:**
${params.resumeHighlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Generate:
1. **3 email subject lines** (varied approaches: direct, curious, value-focused)
2. **2 email templates:**
   - Formal: Professional, respectful tone
   - Conversational: Friendly, engaging tone

Each template should:
- Be concise (150-200 words)
- Reference the hiring manager by name
- Show genuine interest in the role/company
- Highlight 1-2 relevant achievements
- Include a clear call-to-action
- Be personalized, not generic

Return ONLY valid JSON:
{
  "subjects": ["Subject 1", "Subject 2", "Subject 3"],
  "templates": [
    { "type": "formal", "body": "Email body..." },
    { "type": "conversational", "body": "Email body..." }
  ]
}`

      const response = await withRetry(
        () => client.makeRequest(systemPrompt, userPrompt, { temperature: 0.4, maxTokens: 3000, model: 'sonar-pro' }),
        MAX_RETRY_ATTEMPTS
      )

      const parsed = parseAIResponse<{
        subjects: string[]
        templates: Array<{ type: 'formal' | 'conversational'; body: string }>
      }>(response.content)

      const mailtoLink = params.hiringContact.email 
        ? `mailto:${params.hiringContact.email}?subject=${encodeURIComponent(parsed.subjects?.[0] || 'Inquiry about ' + params.jobTitle)}`
        : ''

      const data = {
        subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
        templates: Array.isArray(parsed.templates) ? parsed.templates : [],
        mailtoLink
      }

      setCache(cacheKey, data)

      return {
        success: true,
        data,
        metadata: { requestId, timestamp: started, duration: Date.now() - started },
        cached: false
      }
    } catch (error) {
      console.error('[EMAIL_OUTREACH] Error:', error)
      return {
        success: false,
        data: {
          subjects: [],
          templates: [],
          mailtoLink: ''
        },
        metadata: { 
          requestId, 
          timestamp: started, 
          duration: Date.now() - started,
          error: (error as Error).message 
        },
        cached: false
      }
    }
  }

  /**
   * AGENT-POWERED: Job search with autonomous decision-making
   * DEPRECATED: Agent orchestrator removed in cleanup
   * Use jobMarketAnalysisV2 instead
   */
  static async jobSearchWithAgent(
    jobTitle: string,
    location: string,
    options?: { maxResults?: number; workType?: string }
  ): Promise<EnhancedResponse<JobListing[]>> {
    console.log('🤖 [INTELLIGENCE] Agent method deprecated, using standard method...')
    
    // Fallback to standard method since agent-orchestrator was removed
    return await this.jobMarketAnalysisV2(location, '', {
      roleHint: jobTitle,
      maxResults: options?.maxResults,
      workType: options?.workType as 'remote' | 'hybrid' | 'onsite' | 'any' | undefined
    })
  }

  /**
   * AGENT-POWERED: Hiring contacts with 95%+ reliability
   * DEPRECATED: Agent orchestrator removed in cleanup
   * Use hiringContactsV2 instead
   */
  static async hiringContactsWithAgent(
    companyName: string,
    companyDomain?: string
  ): Promise<EnhancedResponse<HiringContact[]>> {
    console.log('🤖 [INTELLIGENCE] Agent method deprecated, using standard method...')
    
    // Fallback to standard method since agent-orchestrator was removed
    return await this.hiringContactsV2(companyName)
  }

  /**
   * Clear cache entries (admin utility)
   * @param prefix - Optional prefix to clear specific cache entries
   * @returns Number of entries cleared
   */
  static clearCache(prefix?: string): number {
    if (!prefix) {
      const size = cache.size
      cache.clear()
      return size
    }
    
    let cleared = 0
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key)
        cleared++
      }
    }
    return cleared
  }

  /**
   * Get cache statistics (admin utility)
   * @returns Cache stats including size, hit counts, and breakdown by prefix
   */
  static getCacheStats(): {
    totalEntries: number
    totalHits: number
    breakdown: Record<string, { count: number; hits: number }>
  } {
    const breakdown: Record<string, { count: number; hits: number }> = {}
    let totalHits = 0

    for (const [key, record] of cache.entries()) {
      const prefix = key.split(':')[0] || 'unknown'
      if (!breakdown[prefix]) {
        breakdown[prefix] = { count: 0, hits: 0 }
      }
      breakdown[prefix].count++
      breakdown[prefix].hits += record.metadata.hitCount
      totalHits += record.metadata.hitCount
    }

    return {
      totalEntries: cache.size,
      totalHits,
      breakdown
    }
  }

  /**
   * Custom query to Perplexity API (flexible utility)
   * @param options - Query options including prompts and parameters
   * @returns API response content
   */
  static async customQuery(options: {
    systemPrompt: string
    userPrompt: string
    temperature?: number
    maxTokens?: number
    model?: 'sonar' | 'sonar-pro'
  }): Promise<{ content: string }> {
    const client = createClient()
    const response = await client.makeRequest(
      options.systemPrompt,
      options.userPrompt,
      {
        temperature: options.temperature || 0.2,
        maxTokens: options.maxTokens || 4000,
        model: options.model || 'sonar-pro'
      }
    )
    return { content: response.content }
  }

  /**
   * Get recommended job boards based on location
   * @param location - User's location (e.g., "Toronto", "Canada", "USA")
   * @returns Array of recommended job board names
   */
  static getRecommendedBoards(location: string): string[] {
    const lowerLocation = location.toLowerCase()
    const isCanadian = lowerLocation.includes('canada') || 
                       lowerLocation.includes('toronto') || 
                       lowerLocation.includes('vancouver') || 
                       lowerLocation.includes('montreal') ||
                       lowerLocation.includes('calgary') ||
                       lowerLocation.includes('ottawa')

    if (isCanadian) {
      return [
        'Indeed Canada',
        'Workopolis',
        'Job Bank (Canada)',
        'LinkedIn',
        'Glassdoor',
        'Monster Canada',
        'CareerBuilder Canada',
        'Eluta.ca',
        'CharityVillage (Non-profit)',
        'TechTO (Tech jobs)'
      ]
    }

    // Default US/International boards
    return [
      'Indeed',
      'LinkedIn',
      'Glassdoor',
      'Monster',
      'CareerBuilder',
      'ZipRecruiter',
      'SimplyHired',
      'Dice (Tech)',
      'AngelList (Startups)',
      'RemoteOK (Remote)'
    ]
  }

  /**
   * Get list of available job boards
   * @returns Array of job board objects with name and URL
   */
  static getAvailableJobBoards(): Array<{ name: string; url: string; region: string }> {
    return [
      { name: 'Indeed', url: 'https://www.indeed.com', region: 'Global' },
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs', region: 'Global' },
      { name: 'Glassdoor', url: 'https://www.glassdoor.com', region: 'Global' },
      { name: 'Monster', url: 'https://www.monster.com', region: 'Global' },
      { name: 'CareerBuilder', url: 'https://www.careerbuilder.com', region: 'US' },
      { name: 'ZipRecruiter', url: 'https://www.ziprecruiter.com', region: 'US' },
      { name: 'SimplyHired', url: 'https://www.simplyhired.com', region: 'US' },
      { name: 'Dice', url: 'https://www.dice.com', region: 'US (Tech)' },
      { name: 'Indeed Canada', url: 'https://ca.indeed.com', region: 'Canada' },
      { name: 'Workopolis', url: 'https://www.workopolis.com', region: 'Canada' },
      { name: 'Job Bank', url: 'https://www.jobbank.gc.ca', region: 'Canada' },
      { name: 'Eluta', url: 'https://www.eluta.ca', region: 'Canada' },
      { name: 'AngelList', url: 'https://angel.co/jobs', region: 'Startups' },
      { name: 'RemoteOK', url: 'https://remoteok.com', region: 'Remote' },
      { name: 'We Work Remotely', url: 'https://weworkremotely.com', region: 'Remote' }
    ]
  }

  /**
   * Extract career timeline from resume
   * @param resumeText - Resume text content
   * @returns Career timeline with industries and experience
   */
  static async extractCareerTimeline(resumeText: string): Promise<{
    industries: Array<{ name: string; percentage: number; years: number }>
    totalYears: number
    primaryIndustry: string
  }> {
    const client = createClient()
    const prompt = `Analyze this resume and extract the career timeline:

${resumeText.slice(0, 3000)}

Return ONLY valid JSON with this structure:
{
  "industries": [
    { "name": "Industry Name", "percentage": 40, "years": 5 },
    { "name": "Another Industry", "percentage": 30, "years": 3 }
  ],
  "totalYears": 8,
  "primaryIndustry": "Most relevant industry"
}

Rules:
- List all industries worked in
- Calculate percentage of time in each
- Count years of experience per industry
- Identify primary/dominant industry`

    const response = await client.makeRequest(
      'You are a career analyst. Extract career timeline data. Return ONLY valid JSON.',
      prompt,
      { temperature: 0.2, maxTokens: 1000, model: 'sonar-pro' }
    )

    try {
      const parsed = parseAIResponse<{
        industries: Array<{ name: string; percentage: number; years: number }>
        totalYears: number
        primaryIndustry: string
      }>(response.content)

      return {
        industries: parsed.industries || [],
        totalYears: parsed.totalYears || 0,
        primaryIndustry: parsed.primaryIndustry || (parsed.industries?.[0]?.name || 'Unknown')
      }
    } catch {
      // Fallback if parsing fails
      return {
        industries: [{ name: 'General', percentage: 100, years: 0 }],
        totalYears: 0,
        primaryIndustry: 'General'
      }
    }
  }

  /**
   * Enhanced company research with comprehensive data
   * @param params - Company name, job title, location
   * @returns Enhanced company research data
   */
  static async enhancedCompanyResearch(params: {
    companyName: string
    jobTitle?: string
    location?: string
  }): Promise<EnhancedResponse<IntelligenceResponse>> {
    // Use existing researchCompanyV2 as the base
    return await this.researchCompanyV2({
      company: params.companyName,
      role: params.jobTitle,
      geo: params.location
    })
  }
}
