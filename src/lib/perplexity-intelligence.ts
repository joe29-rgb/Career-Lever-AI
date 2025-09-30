import crypto from 'crypto'
import { PerplexityService } from './perplexity-service'

// Environment
const CACHE_TTL_MS = Number(process.env.PPX_CACHE_TTL_MS || 24 * 60 * 60 * 1000)

type CacheEntry = { expiresAt: number; value: any }
const cache: Map<string, CacheEntry> = new Map()

function makeKey(prefix: string, payload: any): string {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return `${prefix}:${crypto.createHash('sha256').update(raw).digest('hex')}`
}

function getCache(key: string): any | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) { cache.delete(key); return undefined }
  return entry.value
}

function setCache(key: string, value: any) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value })
}

function createClient(): PerplexityService { return new PerplexityService() }

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

const SYSTEM = `You are a research analyst using real-time web tools.
Rules:
- Use only public sources and respect robots.txt by following links provided by Perplexity tools.
- Always return structured JSON matching the requested schema.
- Include 5-10 source citations with titles and URLs.
- Provide confidence scores (0-1) for each data point and overall.
- Mark estimates or unverified signals clearly.
`

export class PerplexityIntelligenceService {
  static async researchCompany(input: IntelligenceRequest): Promise<IntelligenceResponse> {
    const key = makeKey('ppx:research', input)
    const cached = getCache(key)
    if (cached) return cached

    const client = createClient()
    const user = `Research current intelligence for ${input.company}${input.role ? ` (role: ${input.role})` : ''}${input.geo ? ` in ${input.geo}` : ''}.
Return a JSON object with: company, freshness (ISO datetime), sources[{title,url}], confidence (0..1), financials[{metric,value,confidence,source}], culture[{point,confidence,source}], salaries[{title,range,currency,geo,source,confidence}], contacts[{name,title,url,source,confidence}], growth[{signal,source,confidence}], summary.`
    try {
      const out = await client.makeRequest(SYSTEM, user, { temperature: 0.2, maxTokens: 1400 })
      const text = (out.content || '').trim()
      let parsed: IntelligenceResponse
      try { parsed = JSON.parse(text) } catch { throw new Error('Failed to parse intelligence JSON') }
      // Minimal validation
      parsed.company = parsed.company || input.company
      parsed.freshness = parsed.freshness || new Date().toISOString()
      parsed.sources = Array.isArray(parsed.sources) ? parsed.sources.slice(0, 12) : []
      parsed.confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.6
      setCache(key, parsed)
      return parsed
    } catch (e) {
      // Graceful fallback
      return {
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
]
`

  // Fast SEARCH API for raw listings from specific domains
  static async jobQuickSearch(query: string, domains: string[] = [], maxResults: number = 20, recency: 'day'|'week'|'month'|'year' = 'month') {
    const key = makeKey('ppx:search', { query, domains, maxResults, recency })
    const cached = getCache(key)
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
      const data: any = await resp.json()
      // Normalize best-effort: expect data.results or array-like
      const items: any[] = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : [])
      const mapped = items.map((it: any) => ({
        title: it.title || it.snippet || '',
        url: it.url || it.link || '',
        snippet: it.snippet || it.summary || '',
        source: (it.domain || it.source || '')
      }))
      setCache(key, mapped)
      return mapped
    } catch {
      return []
    }
  }
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
}
`
    try {
      const out = await client.makeRequest(SYSTEM_JOBMARKET, USER_JOBMARKET, { temperature: 0.2, maxTokens: 1600 })
      const text = (out.content || '').trim()
      const parsed = JSON.parse(text)
      const arr = Array.isArray(parsed) ? parsed.slice(0, 15) : []
      setCache(key, arr)
      return arr
    } catch {
      return []
    }
  }
}


