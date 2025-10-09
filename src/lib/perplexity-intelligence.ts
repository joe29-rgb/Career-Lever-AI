import crypto from 'crypto'
import { PerplexityService } from './perplexity-service'
import { 
  CANADIAN_JOB_BOARDS, 
  MAJOR_JOB_BOARDS, 
  OPEN_API_BOARDS,
  ATS_PLATFORMS,
  DISCOVERY_PRIORITY_ORDER,
  CANADIAN_ATS_COMPANIES
} from './public-job-boards-config'

// Environment
const CACHE_TTL_MS = Number(process.env.PPX_CACHE_TTL_MS || 24 * 60 * 60 * 1000)
const MAX_RETRY_ATTEMPTS = Number(process.env.PPX_MAX_RETRIES || 3)
const RETRY_DELAY_MS = Number(process.env.PPX_RETRY_DELAY || 1000)

type CacheEntry = { expiresAt: number; value: unknown; metadata?: { createdAt: number; hitCount: number; lastAccessed: number } }
const cache: Map<string, CacheEntry> = new Map()

function makeKey(prefix: string, payload: unknown): string {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return `${prefix}:${crypto.createHash('sha256').update(raw).digest('hex')}`
}

function getCache(key: string): unknown | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) { cache.delete(key); return undefined }
  return entry.value
}

function setCache(key: string, value: unknown) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value })
}

function createClient(): PerplexityService { return new PerplexityService() }

// ---------- Enhanced helpers (ids, retry, enrichment) ----------
function generateRequestId(): string {
  return crypto.randomBytes(8).toString('hex')
}

async function withRetry<T>(operation: () => Promise<T>, maxAttempts: number = MAX_RETRY_ATTEMPTS): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await operation() } catch (err) {
      lastError = err
      if (attempt === maxAttempts) break
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw (lastError instanceof Error ? lastError : new Error('Operation failed'))
}

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
  description: string  // ADDED: Company overview
  size: string  // ADDED: Employee count or scale
  revenue: string  // ADDED: Annual revenue estimate
  industry: string  // ADDED: Primary industry/sector
  founded: string  // ADDED: Founding year
  headquarters: string  // ADDED: HQ location
  psychology: string  // ADDED: Company culture/psychology insights
  marketIntelligence: string  // ADDED: Market position and trends
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
Rules:
- Use only public sources and respect robots.txt by following links provided by Perplexity tools.
- Always return structured JSON matching the requested schema.
- Include 5-10 source citations with titles and URLs.
- Provide confidence scores (0-1) for each data point and overall.
- Mark estimates or unverified signals clearly.
`

export class PerplexityIntelligenceService {
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
      const out = await withRetry(async () => {
        const client = createClient()
        const user = `Research current intelligence for ${input.company}${input.role ? ` (role: ${input.role})` : ''}${input.geo ? ` in ${input.geo}` : ''}.
Return a JSON object with: company, description (overview), size (employee count), revenue (annual estimate), industry, founded (year), headquarters (location), psychology (culture insights), marketIntelligence (position/trends), freshness (ISO datetime), sources[{title,url}], confidence (0..1), financials[{metric,value,confidence,source}], culture[{point,confidence,source}], salaries[{title,range,currency,geo,source,confidence}], contacts[{name,title,url,source,confidence}], growth[{signal,source,confidence}], summary.`
        const res = await client.makeRequest(SYSTEM, user, { temperature: 0.2, maxTokens: 1400 })
        if (!res.content?.trim()) throw new Error('Empty response')
        return res
      })
      const parsed = JSON.parse(out.content.trim()) as IntelligenceResponse
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
        marketIntelligence: 'No market data available'
      }
      return { success: false, data: fb, metadata: { requestId, timestamp: started, duration: Date.now() - started, error: (e as Error).message }, cached: false }
    }
  }
  static async researchCompany(input: IntelligenceRequest): Promise<IntelligenceResponse> {
    const key = makeKey('ppx:research', input)
    const cached = getCache(key) as IntelligenceResponse | undefined
    if (cached) return cached

    const client = createClient()
    const user = `Research current intelligence for ${input.company}${input.role ? ` (role: ${input.role})` : ''}${input.geo ? ` in ${input.geo}` : ''}.
Return a JSON object with: company, freshness (ISO datetime), sources[{title,url}], confidence (0..1), financials[{metric,value,confidence,source}], culture[{point,confidence,source}], salaries[{title,range,currency,geo,source,confidence}], contacts[{name,title,url,source,confidence}], growth[{signal,source,confidence}], summary.`
    try {
      const out = await client.makeRequest(SYSTEM, user, { temperature: 0.2, maxTokens: 1400 })
      const text = (out.content || '').trim()
      let parsed: IntelligenceResponse
      try { parsed = JSON.parse(text) as IntelligenceResponse } catch { throw new Error('Failed to parse intelligence JSON') }
      // Minimal validation
      parsed.company = parsed.company || input.company
      parsed.freshness = parsed.freshness || new Date().toISOString()
      parsed.sources = Array.isArray(parsed.sources) ? parsed.sources.slice(0, 12) : []
      parsed.confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.6
      setCache(key, parsed)
      return parsed
    } catch (e) {
      // Graceful fallback
      const fallback: IntelligenceResponse = {
        company: input.company,
        freshness: new Date().toISOString(),
        sources: [],
        confidence: 0.3,
        financials: [],
        culture: [],
        salaries: [],
        contacts: [],
        growth: [],
        summary: 'No data available',
        description: 'No description available',
        size: 'Unknown',
        revenue: 'Unknown',
        industry: 'Unknown',
        founded: 'Unknown',
        headquarters: 'Unknown',
        psychology: 'No insights available',
        marketIntelligence: 'No market data available'
      }
      return fallback
    }
  }

  static async salaryForRole(role: string, company?: string, geo?: string) {
    const key = makeKey('ppx:salary', { role, company, geo })
    const cached = getCache(key)
    if (cached) return cached
    const client = createClient()
    const user = `Find current salary ranges for ${role}${company ? ` at ${company}` : ''}${geo ? ` in ${geo}` : ''}. Return JSON: items[{title,range,currency,geo,source,confidence}], summary, freshness`;
    try {
      const out = await client.makeRequest(SYSTEM, user, { temperature: 0.2, maxTokens: 900 })
      const text = (out.content || '').trim()
      const parsed = JSON.parse(text)
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

REQUIREMENTS:
1. Search ONLY publicly accessible listings (no login)
2. Prioritize Canadian sources for Canadian locations
3. Include company name, exact location, salary if visible
4. Deduplicate across all sources
5. Rank by: recency → Canadian source priority → relevance
6. Return up to ${limit} listings

OUTPUT JSON:
[{
  "title": string,
  "company": string,
  "location": string,
  "url": string,
  "summary": string (50-100 words),
  "salary": string | null,
  "postedDate": "YYYY-MM-DD",
  "source": string (board name)
}]`

    const USER_JOBS = `Search for "${jobTitle}" jobs in ${location} across these prioritized sources:
${targetBoards.slice(0, 10).join(', ')}

Return ${limit} unique, recent listings in JSON format. For Canadian locations, prioritize Job Bank, Jobboom, Workopolis first.`

    try {
      const out = await client.makeRequest(SYSTEM_JOBS, USER_JOBS, { 
        temperature: 0.2, 
        maxTokens: Math.min(limit * 150, 8000) // INCREASED: More tokens for complete JSON
      })
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
      
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch (parseError: unknown) {
        console.error('[PERPLEXITY] JSON parse failed, raw text:', text.substring(0, 500))
        console.error('[PERPLEXITY] Parse error:', parseError)
        // Return empty array instead of crashing
        return []
      }
      
      const arr = Array.isArray(parsed) ? parsed.slice(0, limit) : []
      
      // Enhance with board metadata
      const enhanced = arr.map((job: unknown) => {
        const jobObj = job as Record<string, unknown>
        return {
          ...jobObj,
          metadata: {
            searchedBoards: targetBoards.length,
            canadianPriority: includeCanadianOnly,
            extractedAt: new Date().toISOString()
          }
        }
      })
      
      setCache(key, enhanced)
      return enhanced
    } catch (error) {
      console.error('[PERPLEXITY] Job listings failed:', error)
      return []
    }
  }

  static async hiringContacts(companyName: string) {
    const key = makeKey('ppx:contacts', { companyName })
    const cached = getCache(key)
    if (cached) return cached
    const client = createClient()
    const SYSTEM_CONTACTS = `You are a Hiring Contacts Finder with real-time web access. Your role is to identify the people responsible for hiring for a given company based on public company websites, LinkedIn pages, Google search, and professional directories.

CRITICAL REQUIREMENTS:
1. Use only publicly accessible sources (no scraping behind login).
2. Look for titles containing “HR,” “Talent Acquisition,” “Recruiter,” “Hiring Manager,” “People Operations,” or department leads in that area.
3. Scrape full name, exact job title, department, LinkedIn URL (if public), and company website email format patterns.
4. Infer email addresses using common patterns (e.g., first.last@company.com) but label them “inferred.”
5. Return up to 5 contacts.

OUTPUT JSON FORMAT:
[
  {
    "name": string,
    "title": string,
    "department": string,
    "linkedinUrl": string | null,
    "email": string | null,
    "emailType": "public" | "inferred",
    "source": string
  }
]`
    const USER_CONTACTS = `Identify up to 5 hiring contacts at ${companyName}. Search the company’s official site, LinkedIn company page, Google search, and professional directories. For each contact, return [name, title, department, linkedinUrl, email, emailType, source].`
    try {
      const out = await client.makeRequest(SYSTEM_CONTACTS, USER_CONTACTS, { temperature: 0.2, maxTokens: 1000 })
      const text = (out.content || '').trim()
      const parsed = JSON.parse(text)
      const arr = Array.isArray(parsed) ? parsed.slice(0, 5) : []
      setCache(key, arr)
      return arr
    } catch {
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

  static async jobMarketAnalysis(location: string, resumeText: string, roleHint?: string) {
    return this.jobMarketAnalysisV2(location, resumeText, { roleHint: roleHint || undefined })
  }
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
        const prompt = `Find ${options.maxResults || 20} relevant job opportunities in ${location} matching this profile.

RESUME:
${resumeText}

FILTERS:
- Role: ${options.roleHint || '(infer from resume)'}
- Work Type: ${options.workType || 'any'}
- Experience: ${options.experienceLevel || 'any'}
- Min Salary: ${options.salaryMin ? ('$' + options.salaryMin + '+') : 'any'}

PRIORITY JOB BOARDS (search these first):
${targetBoards.slice(0, 12).map((board, i) => {
  const config = CANADIAN_JOB_BOARDS[board] || MAJOR_JOB_BOARDS[board] || OPEN_API_BOARDS[board] || ATS_PLATFORMS[board]
  return `${i + 1}. ${config?.displayName || board} (${config?.scrapingConfig?.baseUrl || ''})`
}).join('\n')}

${isCanadian ? `
CANADIAN ATS PLATFORMS - Check these tech companies:
- Greenhouse: Shopify, Hootsuite, Wealthsimple, Faire, Thinkific, Lightspeed, Jobber
- Lever: Slack, Bench, Clio, Clearco, League, ApplyBoard, Ritual
- Workable: FreshBooks, Visier, Unbounce, Axonify, TouchBistro
- Recruitee: Ecobee, Geotab, Auvik, Wave, KOHO, SkipTheDishes
- Ashby: Faire, Clearco, Maple, Borrowell, Shakepay, Wealthsimple
` : ''}

REQUIREMENTS:
1. Search ALL listed job boards above
2. Match skills from resume to job requirements
3. Calculate skillMatchPercent (0-100) based on overlap
4. Include salary data when visible
5. Deduplicate across all sources
6. Rank by: skillMatchPercent → recency → salary

OUTPUT JSON FORMAT:
[{
  "title": string,
  "company": string,
  "location": string,
  "address": string | null,
  "url": string,
  "source": string (job board name),
  "summary": string (100-150 words),
  "postedDate": "YYYY-MM-DD",
  "salary": string | null,
  "skillMatchPercent": number (0-100),
  "skills": string[],
  "workType": "remote" | "hybrid" | "onsite",
  "experienceLevel": "entry" | "mid" | "senior" | "executive",
  "contacts": {
    "hrEmail": string | null,
    "hiringManagerEmail": string | null,
    "generalEmail": string | null,
    "phone": string | null,
    "linkedinProfiles": string[]
  },
  "benefits": string[],
  "requirements": string[]
}]`

        const res = await client.makeRequest(SYSTEM, prompt, { 
          temperature: 0.15, 
          maxTokens: Math.min((options.maxResults || 20) * 120, 4000) 
        })
        if (!res.content?.trim()) throw new Error('Empty job analysis')
        return res
      })

      let parsed = JSON.parse(out.content.trim()) as JobListing[]
      parsed = Array.isArray(parsed) ? parsed.slice(0, options.maxResults || 20) : []
      
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
        
        // SIMPLIFIED PROMPT: Direct JSON request for better parsing reliability
        const prompt = `Find hiring contacts at ${companyName}. Search company website, LinkedIn, and press releases for verified emails.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "John Smith",
    "title": "HR Manager",
    "department": "HR",
    "linkedinUrl": "https://linkedin.com/in/johnsmith",
    "email": "john.smith@company.com",
    "emailType": "public",
    "source": "Company Website",
    "confidence": 0.9,
    "phone": "+1-555-0123",
    "alternativeEmails": ["j.smith@company.com"],
    "discoveryMethod": "Found on company careers page"
  }
]

Focus on: Recruiters, HR managers, hiring managers, department heads. If no email found, use pattern-based guesses (firstname.lastname@domain.com).`

        // PERPLEXITY AUDIT FIX: Use optimal token limits (1500 → 2500)
        return client.makeRequest(SYSTEM, prompt, { 
          temperature: config.temperature, 
          maxTokens: config.maxTokens 
        })
      })
      
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
      
      console.log(`[HIRING_CONTACTS] ✅ Enterprise extraction succeeded after: ${extractionResult.attemptedCleanups.join(', ')}`)
      console.log(`[HIRING_CONTACTS] ✅ Extracted ${parsed.length} contacts for ${companyName}`)
      
      // Enhance each contact with inferred emails
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
      
      console.log(`[HIRING_CONTACTS] ✅ Final result: ${parsed.length} contacts, ${parsed.filter(c => c.email).length} with emails`)
      
      // CRITICAL: Always cache the result (even if empty array)
      setCache(key, parsed)
      return { 
        success: true, 
        data: parsed, 
        metadata: { 
          requestId, 
          timestamp: started, 
          duration: Date.now() - started,
          contactsFound: parsed.length,
          withEmails: parsed.filter(c => c.email).length
        }, 
        cached: false 
      }
    } catch (e) {
      console.error('[HIRING_CONTACTS] Error:', e)
      return { success: false, data: [], metadata: { requestId, timestamp: started, duration: Date.now() - started, error: (e as Error).message }, cached: false }
    }
  }

  // Job Board Utilities
  /**
   * Get all available job boards with their configurations
   */
  static getAvailableJobBoards() {
    return {
      canadian: Object.entries(CANADIAN_JOB_BOARDS).map(([key, config]) => ({
        id: key,
        name: config.displayName,
        country: config.country,
        accessType: config.accessType,
        canDiscoverJobs: config.features.canDiscoverJobs,
        estimatedJobCount: config.features.estimatedJobCount
      })),
      global: Object.entries(MAJOR_JOB_BOARDS).map(([key, config]) => ({
        id: key,
        name: config.displayName,
        country: config.country,
        accessType: config.accessType,
        canDiscoverJobs: config.features.canDiscoverJobs,
        estimatedJobCount: config.features.estimatedJobCount
      })),
      openAPI: Object.entries(OPEN_API_BOARDS).map(([key, config]) => ({
        id: key,
        name: config.displayName,
        country: config.country,
        accessType: config.accessType,
        canDiscoverJobs: config.features.canDiscoverJobs,
        estimatedJobCount: config.features.estimatedJobCount
      })),
      ats: Object.entries(ATS_PLATFORMS).map(([key, config]) => ({
        id: key,
        name: config.displayName,
        country: config.country,
        accessType: config.accessType,
        canDiscoverJobs: config.features.canDiscoverJobs,
        estimatedJobCount: config.features.estimatedJobCount
      })),
      totalBoards: Object.keys(CANADIAN_JOB_BOARDS).length + 
                   Object.keys(MAJOR_JOB_BOARDS).length + 
                   Object.keys(OPEN_API_BOARDS).length + 
                   Object.keys(ATS_PLATFORMS).length,
      discoveryOrder: DISCOVERY_PRIORITY_ORDER,
      canadianATSCompanies: CANADIAN_ATS_COMPANIES
    }
  }

  /**
   * Get recommended job boards for a specific location
   */
  static getRecommendedBoards(location: string) {
    const isCanadian = /canada|canadian|toronto|vancouver|montreal|calgary|ottawa|edmonton|quebec|winnipeg|halifax/i.test(location)
    
    if (isCanadian) {
      return {
        priority: Object.keys(CANADIAN_JOB_BOARDS),
        secondary: ['linkedin', 'indeed', 'glassdoor'],
        atsCompanies: CANADIAN_ATS_COMPANIES,
        reasoning: 'Canadian location detected - prioritizing Canadian job boards and local ATS platforms'
      }
    }

    return {
      priority: DISCOVERY_PRIORITY_ORDER.slice(0, 10),
      secondary: Object.keys(OPEN_API_BOARDS),
      atsCompanies: null,
      reasoning: 'Global location - using general priority order'
    }
  }

  /**
   * Custom query for flexible Perplexity requests
   * Used by enhanced resume analyzer and other advanced features
   */
  static async customQuery(options: {
    systemPrompt: string
    userPrompt: string
    temperature?: number
    maxTokens?: number
  }): Promise<string> {
    const client = createClient()
    const response = await client.makeRequest(
      options.systemPrompt,
      options.userPrompt,
      {
        temperature: options.temperature || 0.3,
        maxTokens: options.maxTokens || 1500
      }
    )
    return response.content || ''
  }

  // Cache utilities
  static getCacheStats() {
    const stats = { totalEntries: cache.size, totalHits: 0, entriesByPrefix: {} as Record<string, number> }
    cache.forEach((entry: CacheEntry, key: string) => {
      const prefix = key.split(':')[0]
      stats.entriesByPrefix[prefix] = (stats.entriesByPrefix[prefix] || 0) + 1
      const meta = entry.metadata as { hitCount?: number } | undefined
      if (meta && typeof meta.hitCount === 'number') stats.totalHits += meta.hitCount
    })
    return stats
  }

  static clearCache(prefix?: string) {
    if (!prefix) { const size = cache.size; cache.clear(); return size }
    const keys = Array.from(cache.keys()).filter(k => k.startsWith(prefix))
    keys.forEach(k => cache.delete(k))
    return keys.length
  }

  // ENTERPRISE FEATURE: Extract career timeline with industry tenure analysis
  static async extractCareerTimeline(
    resumeText: string
  ): Promise<{
    industries: Array<{ name: string; yearsOfExperience: number; keywords: string[]; percentage: number }>;
    totalWorkYears: number;
    totalEducationYears: number;
    currentIndustry: string;
    careerTransition?: { from: string; to: string; monthsAgo: number };
  }> {
    type CareerTimelineResult = {
      industries: Array<{ name: string; yearsOfExperience: number; keywords: string[]; percentage: number }>;
      totalWorkYears: number;
      totalEducationYears: number;
      currentIndustry: string;
      careerTransition?: { from: string; to: string; monthsAgo: number };
    }
    
    const key = makeKey('ppx:career:timeline:v1', { t: resumeText.slice(0, 3000) })
    const cached = getCache(key) as CareerTimelineResult | undefined
    if (cached) return cached

    try {
      const client = createClient()
      
      const prompt = `CAREER TIMELINE ANALYSIS - Extract industry tenure and calculate weights.

RESUME TEXT:
${resumeText}

TASK: Analyze this person's career trajectory and calculate industry tenure.

INSTRUCTIONS:
1. Identify ALL industries/sectors this person has worked in (e.g., "Transportation/Logistics", "Food Service", "Sales", "Technology")
2. For EACH industry, calculate:
   - Total years of experience in that industry
   - Percentage of total career time
   - Key skills/keywords specific to that industry
3. Identify if there's been a RECENT career transition (within last 12 months)
4. Calculate total work years vs education years
5. Determine current/most recent industry

EXAMPLE:
If someone drove trucks for 10 years (2010-2020), then became a cook for 6 months (2020-now):
- Transportation: 10 years, 95% of career, keywords: ["CDL", "Logistics", "Route Planning"]
- Food Service: 0.5 years, 5% of career, keywords: ["Food Prep", "Kitchen Safety"]
- Career transition: from "Transportation" to "Food Service" 6 months ago

RETURN STRICT JSON (no markdown, no explanation):
{
  "industries": [
    {
      "name": "Transportation/Logistics",
      "yearsOfExperience": 10,
      "keywords": ["CDL", "Logistics", "Route Planning", "Safety Compliance"],
      "percentage": 95
    },
    {
      "name": "Food Service",
      "yearsOfExperience": 0.5,
      "keywords": ["Food Prep", "Kitchen Safety", "Customer Service"],
      "percentage": 5
    }
  ],
  "totalWorkYears": 10.5,
  "totalEducationYears": 2,
  "currentIndustry": "Food Service",
  "careerTransition": {
    "from": "Transportation/Logistics",
    "to": "Food Service",
    "monthsAgo": 6
  }
}

CRITICAL: Order industries by yearsOfExperience (LONGEST FIRST), not by recency!`

      const response = await client.makeRequest(
        'You analyze career timelines and calculate industry tenure. Return only JSON.',
        prompt,
        { temperature: 0.2, maxTokens: 2000 }
      )

      // JSON extraction
      let cleanedContent = response.content.trim()
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
      const jsonMatch = cleanedContent.match(/(\{[\s\S]*\})/);
      if (jsonMatch) cleanedContent = jsonMatch[0]

      const parsed = JSON.parse(cleanedContent)
      
      console.log('[CAREER_TIMELINE] Analysis complete:', {
        industries: parsed.industries?.length,
        currentIndustry: parsed.currentIndustry,
        hasTransition: !!parsed.careerTransition
      })

      setCache(key, parsed) // Uses default cache TTL
      return parsed
    } catch (error) {
      console.error('[CAREER_TIMELINE] Failed:', error)
      return {
        industries: [],
        totalWorkYears: 0,
        totalEducationYears: 0,
        currentIndustry: 'Unknown'
      }
    }
  }

  // Extract normalized keywords and location from resume (STRICT JSON)
  static async extractResumeSignals(
    resumeText: string,
    maxKeywords: number = 50
  ): Promise<{ keywords: string[]; location?: string; locations?: string[] }> {
    const key = makeKey('ppx:resume:signals:v3', { t: resumeText.slice(0, 3000), maxKeywords })
    const cached = getCache(key) as { keywords: string[]; location?: string; locations?: string[] } | undefined
    if (cached) return cached

    try {
      const client = createClient()
      
      // ENTERPRISE PROMPT - WEIGHTED KEYWORD EXTRACTION WITH TIME-BASED RELEVANCE
      const prompt = `CRITICAL TASK: Extract weighted keywords and location from this resume.

RESUME TEXT:
${resumeText}

KEYWORD EXTRACTION WITH TIME-BASED WEIGHTING:
1. Extract ALL relevant skills, technologies, and competencies (up to 50)
2. WEIGHT keywords based on:
   - Years of experience using that skill (more years = higher priority)
   - Recency (recent roles = higher weight than old roles or education)
   - Frequency of mention across work experience
3. ORDER keywords by weighted relevance (most important first)
4. Skills from work experience should be weighted HIGHER than skills from education only
5. Calculate weight as: (years using skill / total career years) * recency_multiplier

LOCATION EXTRACTION RULES:
1. Find ANY city/province/state mentioned (email header, address, work experience)
2. Look for patterns like "City, PROVINCE" or "City, STATE"
3. Check contact information section first
4. If multiple locations, use the FIRST one found (likely primary)
5. Return EXACTLY as found (e.g., "Edmonton, AB" not "Edmonton, Alberta")

RETURN STRICT JSON (no explanation, no markdown):
{
  "keywords": ["Most Important Skill", "Second Most Important", "...", "50th skill"],
  "location": "City, PROVINCE"
}

IMPORTANT: 
- Order keywords by weighted importance (years of experience + recency)
- If NO location found after thorough search, return "location": null (do NOT guess or default)`

      console.log('[SIGNALS] Input length:', resumeText.length)
      console.log('[SIGNALS] First 300 chars:', resumeText.slice(0, 300))

      const response = await client.makeRequest(
        'You extract keywords and locations from resumes. Return only JSON.',
        prompt,
        { temperature: 0.2, maxTokens: 2000 } // CRITICAL FIX: Increased from 800 to handle 50 keywords
      )

      console.log('[SIGNALS] Raw response:', response.content?.slice(0, 400))

      // ENTERPRISE FIX: Strip markdown code blocks that Perplexity sometimes adds
      let cleanedContent = response.content.trim()
      
      // Remove markdown code fences (```json ... ``` or ``` ... ```)
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
      
      // Extract JSON array/object if wrapped in explanatory text
      const jsonMatch = cleanedContent.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      }
      
      console.log('[SIGNALS] Cleaned for parsing:', cleanedContent.slice(0, 200))

      const parsed = JSON.parse(cleanedContent)

      const result = {
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, maxKeywords) : [],
        location: parsed.location || undefined, // CRITICAL: No default location ever
        locations: parsed.location ? [parsed.location] : []
      }

      console.log('[SIGNALS] Final result:', result)

      setCache(key, result)
      return result

    } catch (error) {
      console.error('[SIGNALS] Extraction failed:', error)
      // CRITICAL: Return empty results, NO defaults - let user know extraction failed
      return {
        keywords: [],
        location: undefined, // NEVER default location
        locations: [] // NEVER default locations
      }
    }
  }
}
