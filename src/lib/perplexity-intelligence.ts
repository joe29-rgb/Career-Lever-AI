import OpenAI from 'openai'
import crypto from 'crypto'

// Environment
const PPX_API_KEY = process.env.PERPLEXITY_API_KEY || ''
const PPX_BASE_URL = process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai'
const PPX_MODEL = process.env.PERPLEXITY_MODEL || 'sonar-pro'
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

function createClient(): OpenAI {
  if (!PPX_API_KEY) throw new Error('PERPLEXITY_API_KEY missing')
  return new OpenAI({ apiKey: PPX_API_KEY, baseURL: PPX_BASE_URL } as any)
}

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
      const completion: any = await client.chat.completions.create({
        model: PPX_MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: user }
        ],
        temperature: 0.2,
        max_tokens: 1400,
      } as any)
      const text = completion.choices?.[0]?.message?.content?.trim() || ''
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
    const user = `Find current salary ranges for ${role}${company ? ` at ${company}` : ''}${geo ? ` in ${geo}` : ''}. Return JSON: items[{title,range,currency,geo,source,confidence}], summary, freshness`.
    try {
      const completion: any = await client.chat.completions.create({
        model: PPX_MODEL,
        messages: [ { role: 'system', content: SYSTEM }, { role: 'user', content: user } ],
        temperature: 0.2,
        max_tokens: 900,
      } as any)
      const text = completion.choices?.[0]?.message?.content?.trim() || ''
      const parsed = JSON.parse(text)
      setCache(key, parsed)
      return parsed
    } catch {
      return { items: [], summary: 'Unavailable', freshness: new Date().toISOString() }
    }
  }
}


