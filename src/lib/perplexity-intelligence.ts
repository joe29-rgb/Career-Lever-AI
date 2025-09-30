import crypto from 'crypto'
import { PerplexityService } from './perplexity-service'

// Environment
const CACHE_TTL_MS = Number(process.env.PPX_CACHE_TTL_MS || 24 * 60 * 60 * 1000)
const MAX_RETRY_ATTEMPTS = Number(process.env.PPX_MAX_RETRIES || 3)
const RETRY_DELAY_MS = Number(process.env.PPX_RETRY_DELAY || 1000)

type CacheEntry = { expiresAt: number; value: unknown }
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
export type RequestMetadata = { requestId: string; timestamp: number; duration?: number; error?: string }
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
}

// V2 Data structures (for job listings and contacts)
export interface JobListing {
  title: string
  company: string
  location: string
  address?: string | null
  url: string
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
Return a JSON object with: company, freshness (ISO datetime), sources[{title,url}], confidence (0..1), financials[{metric,value,confidence,source}], culture[{point,confidence,source}], salaries[{title,range,currency,geo,source,confidence}], contacts[{name,title,url,source,confidence}], growth[{signal,source,confidence}], summary.`
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
      const fb: IntelligenceResponse = { company: input.company, freshness: new Date().toISOString(), sources: [], confidence: 0.3, financials: [], culture: [], salaries: [], contacts: [], growth: [], summary: 'Research failed - please retry' }
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
        summary: 'No data available'
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

  static async jobListings(jobTitle: string, location: string) {
    const key = makeKey('ppx:jobs', { jobTitle, location })
    const cached = getCache(key)
    if (cached) return cached
    const client = createClient()
    const SYSTEM_JOBS = `You are a Job Listings Scraper with real-time web access. Your role is to find publicly posted job openings in a user’s specified location and industry from multiple sources, including local job boards, Google Jobs, and public sections of sites like Indeed, Monster, Craigslist, and company career pages.

CRITICAL REQUIREMENTS:
1. Search ONLY publicly accessible listings (no login required).
2. Target user’s location and role keywords (e.g., “Edmonton Sales Manager”).
3. Scrape job title, company name, location, posting URL, summary, and posting date.
4. Deduplicate identical listings across sources.
5. Rank results by recency and relevance.
6. Return JSON array of up to 20 listings.

OUTPUT JSON FORMAT:
[
  {
    "title": string,
    "company": string,
    "location": string,
    "url": string,
    "summary": string,
    "postedDate": "YYYY-MM-DD"
  }
]`
    const USER_JOBS = `Find the latest public job listings for “${jobTitle}” in ${location} from sources including Google Jobs, Indeed, Monster, local job boards, and company career pages. Return up to 20 unique listings in JSON format with fields [title, company, location, url, summary, postedDate].`
    try {
      const out = await client.makeRequest(SYSTEM_JOBS, USER_JOBS, { temperature: 0.2, maxTokens: 1000 })
      const text = (out.content || '').trim()
      const parsed = JSON.parse(text)
      const arr = Array.isArray(parsed) ? parsed.slice(0, 20) : []
      setCache(key, arr)
      return arr
    } catch {
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
  static async jobQuickSearch(query: string, domains: string[] = [], maxResults: number = 20, recency: 'day'|'week'|'month'|'year' = 'month') {
    const key = makeKey('ppx:search', { query, domains, maxResults, recency })
    const cached = getCache(key) as Array<Record<string, unknown>> | undefined
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
      const data: unknown = await resp.json()
      const results = (data as Record<string, unknown>)?.results as unknown
      const itemsUnknown: unknown = Array.isArray(results) ? results : (Array.isArray(data as unknown[]) ? data : [])
      const items: Array<Record<string, unknown>> = Array.isArray(itemsUnknown) ? (itemsUnknown as Array<Record<string, unknown>>) : []
      const mapped = items.map((it) => ({
        title: (it.title as string) || (it.snippet as string) || '',
        url: (it.url as string) || (it.link as string) || '',
        snippet: (it.snippet as string) || (it.summary as string) || '',
        source: ((it.domain as string) || (it.source as string) || '')
      }))
      setCache(key, mapped)
      return mapped
    } catch {
      return []
    }
  }

  static async jobMarketAnalysis(location: string, resumeText: string, roleHint?: string) {
    const key = makeKey('ppx:jobmarket', { location, resumeText: resumeText.slice(0, 1000), roleHint })
    const cached = getCache(key)
    if (cached) return cached
    const client = createClient()
    const SYSTEM_JOBMARKET = `You are a job market analyst with real-time web access.

Rules:
- Use only public sources (no login) and prioritize last 30 days.
- Return structured JSON only (no markdown), suitable for database import.
- Include direct posting URLs and identify source sites.
`
    const USER_JOBMARKET = `Find 15 job listings in ${location} that match the skills and experience from this resume.

RESUME:
${resumeText}

If helpful, focus on role: ${roleHint || '(infer from resume)'}.

Return EXACT JSON array (no wrapper object, no commentary), where each item has:
{
  "company": string,
  "title": string,
  "location": string,
  "address": string | null,
  "salary": string | null,
  "source": string,
  "url": string,
  "skillMatchPercent": number,
  "skills": string[],
  "contacts": {
    "hrEmail": string | null,
    "hiringManagerEmail": string | null,
    "generalEmail": string | null,
    "phone": string | null,
    "linkedinProfiles": string[]
  }

  // V2: Enhanced job market analysis with options and ranking
  static async jobMarketAnalysisV2(location: string, resumeText: string, options: { roleHint?: string; workType?: 'remote'|'hybrid'|'onsite'|'any'; salaryMin?: number; experienceLevel?: 'entry'|'mid'|'senior'|'executive'; maxResults?: number } = {}): Promise<EnhancedResponse<JobListing[]>> {
    const requestId = generateRequestId()
    const started = Date.now()
    const key = makeKey('ppx:jobmarket:v2', { location, resume: resumeText.slice(0,1000), options })
    const cached = getCache(key) as JobListing[] | undefined
    if (cached) return { success: true, data: cached, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: true }
    try {
      const out = await withRetry(async () => {
        const client = createClient()
        const prompt = `Find ${options.maxResults || 15} relevant job opportunities in ${location} matching this profile.

RESUME:\n${resumeText}

FILTERS:\n- Role: ${options.roleHint || '(infer from resume)'}\n- Work Type: ${options.workType || 'any'}\n- Experience: ${options.experienceLevel || 'any'}\n- Min Salary: ${options.salaryMin ? ('$' + options.salaryMin + '+') : 'any'}

Return JSON array with fields: title, company, location, address, url, summary, postedDate, salary, skillMatchPercent, skills, workType, experienceLevel, contacts{hrEmail,hiringManagerEmail,generalEmail,phone,linkedinProfiles}, benefits, requirements.`
        const res = await client.makeRequest(SYSTEM, prompt, { temperature: 0.15, maxTokens: 2200 })
        if (!res.content?.trim()) throw new Error('Empty job analysis')
        return res
      })
      let parsed = JSON.parse(out.content.trim()) as JobListing[]
      parsed = Array.isArray(parsed) ? parsed.slice(0, options.maxResults || 15) : []
      parsed = parsed.map(j => ({
        ...j,
        skills: normalizeSkills(j.skills || []),
        skillMatchPercent: Math.max(0, Math.min(100, j.skillMatchPercent || 0)),
        workType: j.workType || 'onsite',
        experienceLevel: j.experienceLevel || 'mid',
        benefits: j.benefits || [],
        requirements: j.requirements || []
      }))
      parsed.sort((a,b)=>{
        if (Math.abs(a.skillMatchPercent - b.skillMatchPercent) > 5) return b.skillMatchPercent - a.skillMatchPercent
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
      })
      setCache(key, parsed)
      return { success: true, data: parsed, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: false }
    } catch (e) {
      return { success: false, data: [], metadata: { requestId, timestamp: started, duration: Date.now() - started, error: (e as Error).message }, cached: false }
    }
  }

  // V2: Enhanced hiring contacts with email enrichment
  static async hiringContactsV2(companyName: string): Promise<EnhancedResponse<HiringContact[]>> {
    const requestId = generateRequestId()
    const started = Date.now()
    const key = makeKey('ppx:contacts:v2', { companyName })
    const cached = getCache(key) as HiringContact[] | undefined
    if (cached) return { success: true, data: cached, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: true }
    try {
      const out = await withRetry(async () => {
        const client = createClient()
        const prompt = `Find verified hiring contacts at ${companyName}. Include name, title, department, linkedinUrl, email, emailType, source, confidence, phone, alternativeEmails.`
        return client.makeRequest(SYSTEM, prompt, { temperature: 0.1, maxTokens: 1200 })
      })
      let parsed = JSON.parse(out.content.trim()) as HiringContact[]
      parsed = Array.isArray(parsed) ? parsed.slice(0,8) : []
      parsed = parsed.map(c => {
        const domain = `${companyName.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'')}.com`
        const inferred = c.name ? inferEmails(c.name, domain) : []
        return { ...c, confidence: Math.max(0, Math.min(1, c.confidence || 0.5)), alternativeEmails: c.alternativeEmails || inferred, emailType: (c.email ? c.emailType : 'inferred') as 'public'|'inferred'|'pattern' }
      })
      setCache(key, parsed)
      return { success: true, data: parsed, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: false }
    } catch (e) {
      return { success: false, data: [], metadata: { requestId, timestamp: started, duration: Date.now() - started, error: (e as Error).message }, cached: false }
    }
  }
}
