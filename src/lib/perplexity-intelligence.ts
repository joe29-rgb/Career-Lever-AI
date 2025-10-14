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
import { parseAIResponse } from './utils/ai-response-parser'
import { PerplexityErrorContext } from './errors/perplexity-error'

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
  "contacts": [{"name": string, "title": string, "url": string, "source": string, "confidence": number}] (executives, managers, recruiters from LinkedIn),
  "growth": [{"signal": string, "source": string, "confidence": number}],
  "summary": string (comprehensive 2-3 paragraph summary),
  "recentNews": [{"title": string, "date": string, "url": string, "summary": string}] (last 6 months),
  "socialMedia": {"linkedin": string, "twitter": string, "facebook": string, "instagram": string, "youtube": string},
  "glassdoorRating": {"overallRating": number, "ceoApproval": number, "recommendToFriend": number, "reviewCount": number, "url": string},
  "stockProfile": {"ticker": string, "exchange": string, "currentPrice": string, "marketCap": string, "isPublic": boolean}
}

**CRITICAL REQUIREMENTS:**
1. Search company website for About page, Contact page, Leadership/Team page
2. Search "site:linkedin.com/company/${input.company}" for official company page
3. Search "site:linkedin.com ${input.company} CEO OR president OR manager" for executive contacts
4. Search "${input.company} headquarters address phone email"
5. Search "${input.company} site:glassdoor.com" for reviews and culture insights
6. Search "${input.company} revenue employees industry" for business intelligence
7. DO NOT return "Unknown", "No description available", or "No data" - search multiple sources until you find information
8. Include REAL contact information (names, titles, LinkedIn URLs) - minimum 3 contacts if company has >10 employees`
      const out = await withRetry(async () => {
        const client = createClient()
        const user = userPrompt
        const res = await client.makeRequest(SYSTEM, user, { temperature: 0.2, maxTokens: 3000, model: 'sonar-pro' })
        if (!res.content?.trim()) throw new Error('Empty response')
        return res
      })
      const context: PerplexityErrorContext = {
        requestId,
        prompts: { system: SYSTEM, user: userPrompt },
        timestamp: started,
        endpoint: 'researchCompanyV2'
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
  static async researchCompany(input: IntelligenceRequest): Promise<IntelligenceResponse> {
    const key = makeKey('ppx:research', input)
    const cached = getCache(key) as IntelligenceResponse | undefined
    if (cached) return cached

    const client = createClient()
    const user = `Research current intelligence for ${input.company}${input.role ? ` (role: ${input.role})` : ''}${input.geo ? ` in ${input.geo}` : ''}.
Return a JSON object with: company, freshness (ISO datetime), sources[{title,url}], confidence (0..1), financials[{metric,value,confidence,source}], culture[{point,confidence,source}], salaries[{title,range,currency,geo,source,confidence}], contacts[{name,title,url,source,confidence}], growth[{signal,source,confidence}], summary.`
    try {
      const out = await client.makeRequest(SYSTEM, user, { temperature: 0.2, maxTokens: 1400, model: 'sonar-pro' })
      const text = (out.content || '').trim()
      const context: PerplexityErrorContext = {
        requestId: generateRequestId(),
        prompts: { system: SYSTEM, user },
        timestamp: Date.now(),
        endpoint: 'researchCompany'
      }
      const parsed = parseAIResponse<IntelligenceResponse>(text, { stripMarkdown: true, extractFirst: true }, context)
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
      const out = await client.makeRequest(SYSTEM, user, { temperature: 0.2, maxTokens: 900, model: 'sonar-pro' })
      const text = (out.content || '').trim()
      const context: PerplexityErrorContext = {
        requestId: generateRequestId(),
        prompts: { system: SYSTEM, user },
        timestamp: Date.now(),
        endpoint: 'salaryForRole'
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
3. **CRITICAL**: Extract salary from job posting (look for "$XX,XXX", "$XX-$XX/hour", "$XXK-$XXK", "salary range", "compensation")
4. If salary not explicitly stated, look for "competitive salary", "market rate", or industry standard estimates
5. Deduplicate across all sources
6. Rank by: recency → Canadian source priority → relevance
7. Return up to ${limit} listings with salary data whenever available

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

    const requestId = generateRequestId()
    const started = Date.now()
    try {
      const out = await client.makeRequest(SYSTEM_JOBS, USER_JOBS, { 
        temperature: 0.2, 
        maxTokens: Math.min(limit * 150, 8000), // INCREASED: More tokens for complete JSON
        model: 'sonar-pro' // Use research model for job search
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
      
      const context: PerplexityErrorContext = {
        requestId,
        prompts: { system: SYSTEM_JOBS, user: USER_JOBS },
        timestamp: started,
        endpoint: 'jobListings'
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
    const requestId = generateRequestId()
    const started = Date.now()
    try {
      const out = await client.makeRequest(SYSTEM_CONTACTS, USER_CONTACTS, { temperature: 0.2, maxTokens: 1000, model: 'sonar-pro' })
      const text = (out.content || '').trim()
      const context: PerplexityErrorContext = {
        requestId,
        prompts: { system: SYSTEM_CONTACTS, user: USER_CONTACTS },
        timestamp: started,
        endpoint: 'hiringContacts'
      }
      const parsed = parseAIResponse<unknown>(text, { stripMarkdown: true, extractFirst: true }, context)
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

PRIORITY JOB BOARDS (use site: search for each):
${targetBoards.slice(0, 12).map((board, i) => {
  const config = CANADIAN_JOB_BOARDS[board] || MAJOR_JOB_BOARDS[board] || OPEN_API_BOARDS[board] || ATS_PLATFORMS[board]
  const baseUrl = config?.scrapingConfig?.baseUrl || ''
  const domain = baseUrl ? baseUrl.replace(/https?:\/\//, '').replace(/\/$/, '') : board
  return `${i + 1}. site:${domain} "${options.roleHint || 'jobs'}" "${location}"`
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
1. **CRITICAL**: Use your real-time web search to find ACTUAL job postings on these boards
2. Search queries like: "site:jobbank.gc.ca ${options.roleHint || 'jobs'} ${location}"
3. For each board, extract: title, company, location, salary (if shown), URL, posted date
4. Match skills from resume to job requirements
5. Calculate skillMatchPercent (0-100) based on overlap
6. Include salary data when visible (look for "$XX,XXX", "$XX-$XX/hour", "salary range")
7. Deduplicate across all sources
8. Rank by: skillMatchPercent → recency → salary
9. **MUST return AT LEAST 10-15 real job postings with actual URLs**

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
          maxTokens: Math.min((options.maxResults || 20) * 150, 6000), // INCREASED: More tokens for comprehensive search
          model: 'sonar-pro' // Use research model for job analysis
        })
        if (!res.content?.trim()) throw new Error('Empty job analysis')
        
        // DEBUG: Log raw response
        console.log('[JOB_MARKET_V2] Raw response length:', res.content.length)
        console.log('[JOB_MARKET_V2] First 500 chars:', res.content.slice(0, 500))
        
        return res
      })

      // DEBUG: Log content before parsing
      console.log('[JOB_MARKET_V2] Parsing JSON, content length:', out.content.length)
      
      let parsed = JSON.parse(out.content.trim()) as JobListing[]
      console.log('[JOB_MARKET_V2] Parsed jobs:', parsed.length)
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
        
        // CRITICAL: Multi-source search using Perplexity's sonar-pro research capabilities
        const prompt = `URGENT: Find REAL hiring contacts at ${companyName} using multiple sources. Return ONLY valid JSON, NO explanatory text.

SEARCH STRATEGY (use ALL sources):
1. LinkedIn profiles: site:linkedin.com/in/ "${companyName}" (recruiter OR "talent acquisition" OR "HR manager" OR "hiring manager")
2. Company website: site:${companyName.toLowerCase().replace(/\s+/g, '')}.com (careers OR jobs OR contact OR "human resources")
3. Company careers page: "${companyName}" careers team contact email
4. Job board postings: site:indeed.com OR site:glassdoor.com "${companyName}" recruiter contact
5. Press releases/news: "${companyName}" hiring manager OR recruiter name

CRITICAL REQUIREMENTS:
- Extract REAL names from actual profiles/pages (e.g., "Sarah Johnson", "Michael Chen")
- Find verified email addresses or construct from pattern found on company website
- Include LinkedIn profile URLs when found
- If company website shows "firstname.lastname@company.com" pattern, use it with REAL names found
- DO NOT return fake placeholders like "Pattern Guess" or generic "firstname.lastname"
- If NO real contacts found after searching all sources, return empty array []

JSON FORMAT:
[{"name":"Sarah Johnson","title":"Senior Recruiter","department":"Talent Acquisition","email":"sarah.johnson@company.com","linkedinUrl":"https://linkedin.com/in/sarah-johnson-xyz","emailType":"verified","source":"LinkedIn + Company Website","confidence":0.95}]

Return ONLY the JSON array. If you can't find ANY real people after searching ALL sources, return: []`

        // PERPLEXITY AUDIT FIX: Use optimal token limits + sonar-pro for research
        return client.makeRequest(SYSTEM, prompt, { 
          temperature: config.temperature, 
          maxTokens: config.maxTokens,
          model: 'sonar-pro' // Use research model for multi-source search
        })
      })
      
      // CRITICAL DEBUG: Log raw Perplexity output (Perplexity recommendation)
      console.log('[PERPLEXITY RAW]', {
        method: 'hiringContactsV2',
        company: companyName,
        contentLength: out.content.length,
        contentPreview: out.content.slice(0, 300)
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
        maxTokens: options.maxTokens || 1500,
        model: 'sonar-pro' // Use research model for custom queries
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
        { temperature: 0.2, maxTokens: 2000, model: 'sonar-pro' }
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
        { temperature: 0.2, maxTokens: 2000, model: 'sonar-pro' } // CRITICAL FIX: Increased from 800 to handle 50 keywords
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

  /**
   * ENHANCED AGGRESSIVE COMPANY RESEARCH
   * Uses comprehensive prompt to gather hiring contacts, automation threats, and deep intelligence
   */
  static async enhancedCompanyResearch(params: {
    companyName: string
    jobTitle?: string
    location?: string
    industry?: string
    companyWebsite?: string
  }): Promise<EnhancedResponse<any>> {
    const requestId = generateRequestId()
    const started = Date.now()
    const key = makeKey('ppx:enhanced:research', params)
    const cached = getCache(key)
    
    if (cached) {
      return { 
        success: true, 
        data: cached, 
        metadata: { requestId, timestamp: started, duration: Date.now() - started }, 
        cached: true 
      }
    }

    try {
      // Generate company slug and handle for searches
      const companySlug = params.companyName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      
      const companyWebsite = params.companyWebsite || 
        `${params.companyName.toLowerCase().replace(/\s+inc\.?$|\s+ltd\.?$|\s+llc\.?$|\s+corp\.?$/i, '').replace(/\s+/g, '')}.com`

      const out = await withRetry(async () => {
        const client = createClient()
        const prompt = `COMPREHENSIVE RESEARCH TASK: Search for contacts, emails, website, and complete intelligence for ${params.companyName}${params.jobTitle ? ` (role: ${params.jobTitle})` : ''}${params.location ? ` in ${params.location}` : ''}.

**MANDATORY SEARCH SOURCES:**
- Use Google search extensively
- Search LinkedIn company page: site:linkedin.com/company/${companySlug}
- Search LinkedIn employees: site:linkedin.com "${params.companyName}" CEO OR president OR manager OR recruiter OR HR
- Search all social media platforms (Twitter, Facebook, Instagram, YouTube)
- Search company website thoroughly: site:${companyWebsite}
- Search business directories (BBB, Yellow Pages, ZoomInfo, Glassdoor)
- Search news sources and press releases
- Search "${params.companyName}" headquarters address phone email
- Search "${params.companyName}" site:glassdoor.com for reviews

**RETURN DETAILED JSON:**
{
  "companyIntelligence": {
    "name": "${params.companyName}",
    "industry": "specific industry",
    "founded": "year",
    "headquarters": "full address",
    "employeeCount": "employee range",
    "revenue": "annual revenue",
    "website": "official website",
    "description": "detailed overview (NOT 'No description available')",
    "marketPosition": "industry ranking",
    "financialStability": "assessment",
    "recentPerformance": "last 12 months highlights"
  },
  "hiringContactIntelligence": {
    "officialChannels": {
      "careersPage": "URL",
      "jobsEmail": "email",
      "hrEmail": "email",
      "phone": "phone number",
      "address": "mailing address"
    },
    "keyContacts": [
      {
        "name": "Full Name",
        "title": "Job Title",
        "department": "Department",
        "linkedinUrl": "LinkedIn URL",
        "email": "email if available",
        "authority": "decision maker | recruiter | manager",
        "contactMethod": "recommended approach"
      }
    ],
    "emailFormat": "first.last@company.com pattern",
    "socialMedia": {
      "linkedin": "company page URL",
      "twitter": "handle and URL",
      "facebook": "page URL",
      "instagram": "handle and URL"
    }
  },
  "companyPsychology": {
    "culture": "detailed culture description",
    "values": ["core values in practice"],
    "managementStyle": "leadership approach",
    "workEnvironment": "description"
  },
  "reviewAnalysis": {
    "glassdoor": {
      "rating": 0,
      "reviewCount": 0,
      "ceoApproval": "percentage",
      "recommendToFriend": "percentage",
      "pros": ["top positives"],
      "cons": ["top concerns"]
    },
    "employeeSentiment": "overall sentiment"
  },
  "aiAutomationThreat": {
    "roleRisk": "LOW | MODERATE | HIGH",
    "automationProbability": "percentage",
    "timeframe": "years",
    "companyAIAdoption": "current AI usage",
    "futureOutlook": "5-year projection",
    "recommendations": ["skill development suggestions"]
  },
  "recentNews": [
    {
      "headline": "news headline",
      "date": "YYYY-MM-DD",
      "source": "publication",
      "url": "article URL",
      "impact": "employment impact"
    }
  ],
  "compensation": {
    "salaryRange": "range for ${params.jobTitle || 'typical roles'}",
    "benefits": "benefits package description"
  },
  "redFlags": ["concerning patterns if any"],
  "strategicRecommendations": {
    "applicationStrategy": "how to apply",
    "contactStrategy": "who to contact first",
    "interviewPrep": "company-specific tips"
  },
  "sources": ["list of sources"],
  "confidenceLevel": 0.95
}

**CRITICAL:** 
- Find REAL contact information (names, emails, LinkedIn profiles)
- Minimum 3 contacts if company has 10+ employees
- DO NOT return "Unknown" or "No description available" - search until you find data
- Include specific salary information if available
- Assess AI/automation threat for ${params.jobTitle || 'the role'}
- Provide actionable contact strategies

Return ONLY valid JSON.`

        return client.makeRequest(
          'You are an elite corporate intelligence analyst. Conduct comprehensive research and return detailed JSON with hiring contacts and strategic intelligence.',
          prompt,
          { temperature: 0.1, maxTokens: 6000, model: 'sonar-pro' }
        )
      })

      const parsed = JSON.parse(out.content.trim())
      
      console.log(`[ENHANCED_RESEARCH] Complete intelligence for ${params.companyName}`)
      console.log(`[CONTACTS] Found ${parsed.hiringContactIntelligence?.keyContacts?.length || 0} key contacts`)
      console.log(`[AI_THREAT] Risk: ${parsed.aiAutomationThreat?.roleRisk || 'N/A'}`)
      console.log(`[CULTURE] Rating: ${parsed.reviewAnalysis?.glassdoor?.rating || 'N/A'}`)
      
      setCache(key, parsed)
      
      return { 
        success: true, 
        data: parsed, 
        metadata: { requestId, timestamp: started, duration: Date.now() - started }, 
        cached: false 
      }
    } catch (e) {
      console.error('[ENHANCED_RESEARCH] Failed:', e)
      return { 
        success: false, 
        data: null, 
        metadata: { requestId, timestamp: started, duration: Date.now() - started, error: (e as Error).message }, 
        cached: false 
      }
    }
  }

  /**
   * 🚀 ONE-SHOT COMPREHENSIVE RESEARCH
   * Replaces multiple API calls with a single comprehensive prompt
   * Returns: Job Analysis + Company Research + Hiring Contacts + News + Reviews
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
  }): Promise<EnhancedResponse<{
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
    compensation?: {
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
  }>> {
    const requestId = generateRequestId()
    const started = Date.now()
    
    try {
      const client = createClient()
      
      const prompt = `
# 🎯 COMPREHENSIVE JOB APPLICATION RESEARCH

## JOB DETAILS
- **Position:** ${params.jobTitle}
- **Company:** ${params.company}
- **Location:** ${params.location || 'Not specified'}
- **Description:** ${params.jobDescription.slice(0, 1000)}

## CANDIDATE RESUME SKILLS
${params.resumeSkills ? params.resumeSkills.slice(0, 20).join(', ') : 'Extract from description below'}

## RESUME TEXT (First 2000 chars)
${params.resumeText.slice(0, 2000)}

---

# YOUR MISSION
Conduct a **comprehensive research report** covering ALL of the following sections. This is a ONE-TIME research call, so be thorough and detailed. Include clickable URLs wherever possible.

## OUTPUT FORMAT (Valid JSON ONLY)
\`\`\`json
{
  "jobAnalysis": {
    "matchScore": 85,
    "matchingSkills": ["skill1", "skill2"],
    "missingSkills": ["skill3", "skill4"],
    "skillsToHighlight": ["top skill to emphasize"],
    "recommendations": ["specific action 1", "specific action 2"],
    "estimatedFit": "Excellent | Good | Moderate | Poor"
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
    "marketPosition": "market leader | challenger | niche player"
  },
  "companyPsychology": {
    "culture": "detailed culture description based on reviews and public info",
    "values": ["value1", "value2", "value3"],
    "managementStyle": "hierarchical | flat | hybrid",
    "workEnvironment": "remote-friendly | hybrid | office-centric"
  },
  "hiringContacts": [
    {
      "name": "Real Person Name",
      "title": "Talent Acquisition Manager",
      "department": "Human Resources",
      "email": "real.email@company.com",
      "linkedinUrl": "https://linkedin.com/in/person",
      "authority": "decision maker",
      "confidence": 0.9
    }
  ],
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
      "impact": "positive | neutral | negative for employment"
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
  "sources": [
    "https://source1.com",
    "https://source2.com",
    "https://source3.com"
  ],
  "confidenceLevel": 0.85
}
\`\`\`

## CRITICAL REQUIREMENTS
1. **Job Analysis**: Compare resume skills to job requirements, calculate match score
2. **Company Intel**: Search company website, LinkedIn, Crunchbase, Wikipedia for REAL data
3. **Hiring Contacts**: Find REAL people on LinkedIn, company website, job boards
   - Minimum 2-3 contacts if company has 10+ employees
   - Include verified LinkedIn URLs and emails where possible
   - DO NOT return fake/placeholder names
4. **News**: Find 2-5 recent news articles about the company (with clickable URLs)
5. **Reviews**: Search Glassdoor, Indeed, Comparably for employee reviews (with clickable URLs)
6. **Market Intelligence**: Research industry trends, competitive landscape
7. **Strategic Recommendations**: Provide actionable, company-specific advice

## IMPORTANT
- Return ONLY valid JSON (no markdown, no explanations)
- All URLs must be real and clickable
- If data not found after searching, use "Not available" but ALWAYS try multiple sources first
- Focus on actionable intelligence, not generic advice
`

      const out = await withRetry(async () => {
        return client.makeRequest(
          'You are an elite corporate intelligence analyst providing comprehensive job application research. Return detailed JSON with all requested fields.',
          prompt,
          { temperature: 0.2, maxTokens: 8000, model: 'sonar-pro' }
        )
      })

      console.log('[COMPREHENSIVE_RESEARCH] Raw response length:', out.content.length)

      // Parse response
      let cleanedContent = out.content.trim()
      
      // Remove markdown code blocks
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
      
      // Extract JSON object
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      }

      const parsed = JSON.parse(cleanedContent)

      // Ensure all required fields exist with defaults
      const data = {
        jobAnalysis: parsed.jobAnalysis || {
          matchScore: 0,
          matchingSkills: [],
          missingSkills: [],
          skillsToHighlight: [],
          recommendations: [],
          estimatedFit: 'Unknown'
        },
        companyIntel: parsed.companyIntel || {
          company: params.company,
          description: 'No description available',
          size: 'Unknown',
          industry: 'Unknown'
        },
        companyPsychology: parsed.companyPsychology || {
          culture: 'No information available',
          values: []
        },
        hiringContacts: Array.isArray(parsed.hiringContacts) ? parsed.hiringContacts : [],
        marketIntelligence: parsed.marketIntelligence || {},
        news: Array.isArray(parsed.news) ? parsed.news : [],
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
        compensation: parsed.compensation || {},
        strategicRecommendations: parsed.strategicRecommendations || {
          applicationStrategy: 'Apply through company website',
          contactStrategy: 'Reach out to HR via LinkedIn',
          interviewPrep: []
        },
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        confidenceLevel: parsed.confidenceLevel || 0.5
      }

      console.log('[COMPREHENSIVE_RESEARCH] ✅ Research complete:', {
        matchScore: data.jobAnalysis.matchScore,
        contacts: data.hiringContacts.length,
        news: data.news.length,
        reviews: data.reviews.length,
        confidence: data.confidenceLevel
      })

      return {
        success: true,
        data,
        metadata: {
          requestId,
          timestamp: started,
          duration: Date.now() - started
        },
        cached: false
      }
    } catch (error) {
      console.error('[COMPREHENSIVE_RESEARCH] Error:', error)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {
        success: false,
        data: null as unknown as {
          jobAnalysis: any
          companyIntel: any
          companyPsychology: any
          hiringContacts: any[]
          marketIntelligence: any
          news: any[]
          reviews: any[]
          compensation: any
          strategicRecommendations: any
          sources: string[]
          confidenceLevel: number
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
}
