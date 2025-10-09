/**
 * Shared Company Research Service
 * Eliminates duplicate logic across career-finder pages
 */

import CareerFinderStorage from './career-finder-storage'

export interface CompanyResearchOptions {
  company: string
  role?: string
  location?: string
  onProgress?: (progress: number) => void
}

export interface CompanyResearchResult {
  company: string
  description?: string
  size?: string
  revenue?: string
  industry?: string
  founded?: string
  headquarters?: string
  psychology?: string
  marketIntelligence?: any
  financials?: any[]
  culture?: any[]
  salaries?: any[]
  contacts?: any[]
  hiringContacts: any[] // Always an array
  sources?: any[]
  confidence?: number
  aiRiskAnalysis?: any
  salaryIntelligence?: any
}

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
    if (cached && cached.company === company) {
      console.log('[COMPANY_RESEARCH_SERVICE] ✅ Using cached research')
      onProgress?.(100)
      return cached
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
      const data = await response.json()

      // Process and normalize the response
      const processed: CompanyResearchResult = {
        company: data.company || company,
        description: data.description || 'Company research completed',
        size: data.size,
        revenue: data.revenue,
        industry: data.industry,
        founded: data.founded,
        headquarters: data.headquarters,
        psychology: data.psychology,
        marketIntelligence: data.marketIntelligence,
        financials: data.financials || [],
        culture: data.culture || [],
        salaries: data.salaries || [],
        contacts: Array.isArray(data.contacts) ? data.contacts : [],
        // CRITICAL: Ensure hiringContacts is always an array
        hiringContacts: Array.isArray(data.contacts) 
          ? data.contacts 
          : Array.isArray(data.hiringContacts)
            ? data.hiringContacts
            : [],
        sources: data.sources || [],
        confidence: data.confidence || 0.5,
        aiRiskAnalysis: data.aiRiskAnalysis,
        salaryIntelligence: data.salaryIntelligence
      }

      console.log('[COMPANY_RESEARCH_SERVICE] ✅ Research complete:', processed.company, 
        `(${processed.hiringContacts.length} contacts)`)

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
    return CareerFinderStorage.getCompanyResearch()
  }
}

export default CompanyResearchService

