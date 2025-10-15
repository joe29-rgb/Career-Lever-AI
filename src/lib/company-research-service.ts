/**
 * Shared Company Research Service
 * Eliminates duplicate logic across career-finder pages
 */

import CareerFinderStorage from './career-finder-storage'
import type {
  CompanyAiRiskAnalysis,
  CompanyCompensationInsight,
  CompanyContact,
  CompanyCulturePoint,
  CompanyFinancial,
  CompanyGlassdoorRating,
  CompanyMarketIntelligence,
  CompanyNewsItem,
  CompanyResearchPayload,
  CompanyResearchResult,
  CompanyReview,
  CompanySalary,
  CompanySocialMedia,
  CompanyStockProfile
} from './company-research-types'

export interface CompanyResearchOptions {
  company: string
  role?: string
  location?: string
  onProgress?: (progress: number) => void
}

export type { CompanyResearchResult } from './company-research-types'

export class CompanyResearchService {
  /**
   * Perform company research with caching and progress tracking
   */
  static async research(options: CompanyResearchOptions): Promise<CompanyResearchResult> {
    const { company, role, location, onProgress } = options

    if (!company) {
      throw new Error('Company name is required')
    }

    console.log('[COMPANY_RESEARCH_SERVICE] Starting research for:', company)
    onProgress?.(25)

    // Check for cached research first
    const cached = CareerFinderStorage.getCompanyResearch()
    if (cached) {
      const normalized = normalizeCompanyResearch(cached, company)
      if (normalized.company.toLowerCase() === company.trim().toLowerCase()) {
        console.log('[COMPANY_RESEARCH_SERVICE] ✅ Using cached research')
        onProgress?.(100)
        return normalized
      }
    }

    // Perform new research
    try {
      const response = await fetch('/api/v2/company/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company.trim(),
          role: role?.trim(),
          geo: location?.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`Research API failed: ${response.status}`)
      }

      onProgress?.(75)
      const data = (await response.json()) as CompanyResearchPayload

      const processed = normalizeCompanyResearch(data, company)

      console.log('[COMPANY_RESEARCH_SERVICE] ✅ Research complete:', processed.company, `(${processed.hiringContacts.length} contacts)`)

      // Cache the result
      CareerFinderStorage.setCompanyResearch(processed)

      onProgress?.(100)
      return processed

    } catch (error) {
      console.error('[COMPANY_RESEARCH_SERVICE] ❌ Research failed:', error)
      throw error
    }
  }

  /**
   * Clear cached company research
   */
  static clearCache(): void {
    CareerFinderStorage.clearCompanyResearch()
  }

  /**
   * Get cached company research without making an API call
   */
  static getCached(): CompanyResearchResult | null {
    const cached = CareerFinderStorage.getCompanyResearch()
    if (!cached) return null
    return normalizeCompanyResearch(cached, cached.company)
  }
}

export default CompanyResearchService

function normalizeCompanyResearch(input: CompanyResearchPayload | null | undefined, fallbackCompany: string): CompanyResearchResult {
  const companyName = coerceString(input?.company) || fallbackCompany
  const confidence = coerceNumber(input?.confidence, 0.5) ?? 0.5

  return {
    company: companyName,
    description: coerceString(input?.description) || 'Company research completed',
    size: coerceString(input?.size),
    revenue: coerceString(input?.revenue),
    industry: coerceString(input?.industry),
    founded: coerceString(input?.founded),
    headquarters: coerceString(input?.headquarters),
    psychology: coerceString(input?.psychology),
    marketIntelligence: normalizeMarketIntelligence(input?.marketIntelligence),
    financials: normalizeFinancials(input?.financials),
    culture: normalizeCulture(input?.culture),
    salaries: normalizeSalaries(input?.salaries),
    contacts: normalizeContacts(input?.contacts),
    hiringContacts: normalizeHiringContacts(input?.hiringContacts ?? input?.contacts),
    sources: normalizeSources(input?.sources),
    confidence,
    aiRiskAnalysis: normalizeAiRisk(input?.aiRiskAnalysis ?? input?.aiAutomationThreat),
    salaryIntelligence: normalizeCompensation(input?.salaryIntelligence ?? input?.compensation),
    recentNews: normalizeNews(input?.recentNews ?? input?.news),
    reviews: normalizeReviews(input?.reviews),
    socialMedia: normalizeSocialMedia(input?.socialMedia),
    glassdoorRating: normalizeGlassdoor(input?.glassdoorRating),
    stockProfile: normalizeStockProfile(input?.stockProfile),
    timestamp: typeof input?.timestamp === 'number' ? input.timestamp : Date.now()
  }
}

function normalizeFinancials(items: CompanyResearchPayload['financials']): CompanyFinancial[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      const metric = coerceString(item?.metric)
      const value = coerceString(item?.value)
      if (!metric || !value) return null
      return {
        metric,
        value,
        confidence: coerceNumber(item?.confidence),
        source: coerceString(item?.source)
      }
    })
    .filter(Boolean) as CompanyFinancial[]
}

function normalizeCulture(items: CompanyResearchPayload['culture']): CompanyCulturePoint[] {
  if (!Array.isArray(items)) return []
  const arr = items as unknown[]
  return arr
    .map((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim()
        if (!trimmed) return null
        return { point: trimmed }
      }
      if (!item || typeof item !== 'object') return null
      const obj = item as Partial<CompanyCulturePoint> & { description?: unknown }
      const point = coerceString(obj.point) || coerceString(obj.description)
      if (!point) return null
      return {
        point,
        confidence: coerceNumber(obj.confidence),
        source: coerceString(obj.source)
      }
    })
    .filter(Boolean) as CompanyCulturePoint[]
}

function normalizeSalaries(items: CompanyResearchPayload['salaries']): CompanySalary[] {
  if (!Array.isArray(items)) return []
  const arr = items as unknown[]
  return arr
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const obj = item as Partial<CompanySalary> & { salaryRange?: unknown }
      const title = coerceString(obj.title) || 'Unknown role'
      const range = coerceString(obj.range) || coerceString(obj.salaryRange)
      if (!range) return null
      return {
        title,
        range,
        currency: coerceString(obj.currency),
        geo: coerceString(obj.geo),
        source: coerceString(obj.source),
        confidence: coerceNumber(obj.confidence)
      }
    })
    .filter(Boolean) as CompanySalary[]
}

function normalizeContacts(items: CompanyResearchPayload['contacts']): CompanyContact[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => toContact(item))
    .filter(Boolean) as CompanyContact[]
}

function normalizeHiringContacts(items: CompanyResearchPayload['hiringContacts']): CompanyContact[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      const contact = toContact(item)
      if (!contact) return null
      return {
        ...contact,
        authority: (item?.authority as CompanyContact['authority']) || 'manager'
      }
    })
    .filter(Boolean) as CompanyContact[]
}

function normalizeNews(items: CompanyResearchPayload['recentNews'] | CompanyResearchPayload['news']): CompanyNewsItem[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      const title = coerceString(item?.title)
      const summary = coerceString(item?.summary)
      const url = coerceString(item?.url)
      if (!title || !summary || !url) return null
      return {
        title,
        summary,
        url,
        date: coerceString(item?.date),
        source: coerceString(item?.source),
        impact: coerceString(item?.impact)
      }
    })
    .filter(Boolean) as CompanyNewsItem[]
}

function normalizeReviews(items: CompanyResearchPayload['reviews']): CompanyReview[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      const platform = coerceString(item?.platform)
      const summary = coerceString(item?.summary)
      const url = coerceString(item?.url)
      if (!platform || !summary || !url) return null
      return {
        platform,
        rating: coerceNumber(item?.rating),
        summary,
        url,
        pros: coerceStringArray(item?.pros),
        cons: coerceStringArray(item?.cons)
      }
    })
    .filter(Boolean) as CompanyReview[]
}

function normalizeSocialMedia(value: CompanyResearchPayload['socialMedia']): CompanySocialMedia | undefined {
  if (!value || typeof value !== 'object') return undefined
  const result: Record<string, string> = {}
  for (const [key, raw] of Object.entries(value)) {
    const val = coerceString(raw)
    if (val) {
      result[key] = val
    }
  }
  return Object.keys(result).length ? result : undefined
}

function normalizeGlassdoor(value: CompanyResearchPayload['glassdoorRating']): CompanyGlassdoorRating | undefined {
  if (!value || typeof value !== 'object') return undefined
  const rating: CompanyGlassdoorRating = {
    overallRating: coerceNumber(value.overallRating),
    ceoApproval: coerceNumber(value.ceoApproval),
    recommendToFriend: coerceNumber(value.recommendToFriend),
    reviewCount: coerceNumber(value.reviewCount),
    url: coerceString(value.url),
    pros: coerceStringArray(value.pros),
    cons: coerceStringArray(value.cons)
  }
  return Object.values(rating).some(Boolean) ? rating : undefined
}

function normalizeStockProfile(value: CompanyResearchPayload['stockProfile']): CompanyStockProfile | undefined {
  if (!value || typeof value !== 'object') return undefined
  const profile: CompanyStockProfile = {
    ticker: coerceString(value.ticker),
    exchange: coerceString(value.exchange),
    currentPrice: coerceString(value.currentPrice),
    marketCap: coerceString(value.marketCap),
    isPublic: typeof value.isPublic === 'boolean' ? value.isPublic : undefined,
    website: coerceString(value.website),
    marketPosition: coerceString(value.marketPosition),
    financialStability: coerceString(value.financialStability),
    recentPerformance: coerceString(value.recentPerformance)
  }
  return Object.values(profile).some((entry) => entry !== undefined) ? profile : undefined
}

function normalizeMarketIntelligence(value: CompanyResearchPayload['marketIntelligence']): CompanyMarketIntelligence | undefined {
  if (!value) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }
  if (typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  const result: Exclude<CompanyMarketIntelligence, string> = {}
  if (coerceString(record.competitivePosition)) result.competitivePosition = coerceString(record.competitivePosition)!
  const trends = coerceStringArray(record.industryTrends)
  if (trends?.length) result.industryTrends = trends
  if (coerceString(record.financialStability)) result.financialStability = coerceString(record.financialStability)!
  if (coerceString(record.recentPerformance)) result.recentPerformance = coerceString(record.recentPerformance)!
  const recentNews = coerceStringArray(record.recentNews)
  if (recentNews?.length) result.recentNews = recentNews
  return Object.keys(result).length ? result : undefined
}

function normalizeAiRisk(value: CompanyResearchPayload['aiRiskAnalysis'] | CompanyResearchPayload['aiAutomationThreat']): CompanyAiRiskAnalysis | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  const result: CompanyAiRiskAnalysis = {
    roleRisk: coerceString(record.roleRisk),
    automationProbability: coerceString(record.automationProbability),
    timeframe: coerceString(record.timeframe),
    companyAIAdoption: coerceString(record.companyAIAdoption),
    futureOutlook: coerceString(record.futureOutlook),
    recommendations: coerceStringArray(record.recommendations)
  }
  return Object.values(result).some(Boolean) ? result : undefined
}

function normalizeCompensation(value: CompanyResearchPayload['salaryIntelligence'] | CompanyResearchPayload['compensation']): CompanyCompensationInsight | undefined {
  if (!value || typeof value !== 'object') return undefined
  const result: CompanyCompensationInsight = {
    salaryRange: coerceString(value.salaryRange),
    benefits: coerceString(value.benefits),
    notes: coerceString(value.notes)
  }
  return Object.values(result).some(Boolean) ? result : undefined
}

function normalizeSources(items: CompanyResearchPayload['sources']): Array<{ title?: string; url?: string }> {
  if (!Array.isArray(items)) return []
  const arr = items as unknown[]
  return arr
    .map((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim()
        if (!trimmed) return null
        return { title: trimmed }
      }
      if (!item || typeof item !== 'object') return null
      const record = item as { title?: unknown; url?: unknown }
      const title = coerceString(record.title)
      const url = coerceString(record.url)
      if (!title && !url) return null
      return { title: title ?? undefined, url: url ?? undefined }
    })
    .filter(Boolean) as Array<{ title?: string; url?: string }>
}

function coerceString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }
  return undefined
}

function coerceNumber(value: unknown, fallback?: number): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function coerceStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const result = value
    .map((entry) => coerceString(entry))
    .filter(Boolean) as string[]
  return result.length ? result : undefined
}

function toContact(item: Partial<CompanyContact> | undefined | null): CompanyContact | null {
  if (!item || typeof item !== 'object') return null
  const name = coerceString(item.name)
  const title = coerceString(item.title)
  if (!name || !title) return null
  return {
    name,
    title,
    department: coerceString(item.department),
    email: coerceString(item.email),
    linkedinUrl: coerceString(item.linkedinUrl),
    authority: item.authority,
    confidence: coerceNumber(item.confidence),
    url: coerceString(item.url),
    source: coerceString(item.source)
  }
}

