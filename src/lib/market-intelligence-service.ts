/**
 * Market Intelligence Service
 * Provides real-time salary data, industry trends, and job market insights
 * Uses Perplexity AI for real-time web data
 */

import { PerplexityIntelligenceService } from './perplexity-intelligence'
import { PerplexityService } from './perplexity-service'

export interface SalaryData {
  role: string
  location: string
  avgSalary: number
  minSalary: number
  maxSalary: number
  currency: string
  experienceLevel: string
  sources: string[]
  confidence: number
}

export interface IndustryTrend {
  trend: string
  description: string
  recommendation: string
  growthRate?: number
  sources?: string[]
}

export interface MarketInsight {
  topIndustries: Array<{ industry: string; count: number; avgSalary?: number }>
  salaryData: SalaryData[]
  marketTrends: IndustryTrend[]
  skillsDemand: Array<{ skill: string; demandScore: number; avgSalaryImpact: number }>
}

interface SalaryItem {
  title?: string
  range?: string
  currency?: string
  geo?: string
  source?: string
  confidence?: number
}

interface SalaryResponse {
  items?: SalaryItem[]
  summary?: string
  freshness?: string
}

export class MarketIntelligenceService {
  private static instance: MarketIntelligenceService
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  static getInstance(): MarketIntelligenceService {
    if (!MarketIntelligenceService.instance) {
      MarketIntelligenceService.instance = new MarketIntelligenceService()
    }
    return MarketIntelligenceService.instance
  }

  /**
   * Get real-time salary data using Perplexity AI
   */
  async getSalaryData(role: string, location: string): Promise<SalaryData> {
    const cacheKey = `salary:${role}:${location}`
    const cached = this.getFromCache<SalaryData>(cacheKey)
    if (cached) return cached

    try {
      const result = await PerplexityIntelligenceService.salaryForRole(role, location, 'mid') as SalaryResponse
      
      // Parse salary data from Perplexity response
      // Response format: { items: [{title, range, currency, geo, source, confidence}], summary, freshness }
      const items = result.items || []
      
      interface ParsedRange {
        min: number
        max: number
      }
      
      const ranges = items.map((item: SalaryItem): ParsedRange | null => {
        const range = item.range || ''
        const match = range.match(/\$?([\d,]+)k?\s*-\s*\$?([\d,]+)k?/i)
        if (match) {
          return {
            min: parseInt(match[1].replace(/,/g, '')) * (range.includes('k') ? 1000 : 1),
            max: parseInt(match[2].replace(/,/g, '')) * (range.includes('k') ? 1000 : 1)
          }
        }
        return null
      }).filter((r): r is ParsedRange => r !== null)
      
      const avgMin = ranges.length > 0 ? ranges.reduce((sum: number, r: ParsedRange) => sum + r.min, 0) / ranges.length : 0
      const avgMax = ranges.length > 0 ? ranges.reduce((sum: number, r: ParsedRange) => sum + r.max, 0) / ranges.length : 0
      
      const salaryData: SalaryData = {
        role,
        location,
        avgSalary: ranges.length > 0 ? (avgMin + avgMax) / 2 : 0,
        minSalary: ranges.length > 0 ? Math.min(...ranges.map((r: ParsedRange) => r.min)) : 0,
        maxSalary: ranges.length > 0 ? Math.max(...ranges.map((r: ParsedRange) => r.max)) : 0,
        currency: items[0]?.currency || 'USD',
        experienceLevel: 'mid',
        sources: items.map((item: SalaryItem) => item.source).filter((s): s is string => !!s),
        confidence: items[0]?.confidence || 0.7
      }

      this.setCache(cacheKey, salaryData)
      return salaryData
    } catch (error) {
      console.error('[MARKET_INTEL] Failed to fetch salary data:', error)
      // Return fallback data
      return {
        role,
        location,
        avgSalary: 0,
        minSalary: 0,
        maxSalary: 0,
        currency: 'USD',
        experienceLevel: 'mid',
        sources: [],
        confidence: 0
      }
    }
  }

  /**
   * Get real-time market trends using Perplexity AI
   */
  async getMarketTrends(industry?: string): Promise<IndustryTrend[]> {
    const cacheKey = `trends:${industry || 'general'}`
    const cached = this.getFromCache<IndustryTrend[]>(cacheKey)
    if (cached) return cached

    try {
      const prompt = industry
        ? `What are the top 5 current hiring trends and job market insights specifically for the ${industry} industry in 2025? Include growth rates, emerging skills, and actionable recommendations for job seekers.`
        : `What are the top 5 current hiring trends and job market insights across all industries in 2025? Include growth rates, emerging skills, and actionable recommendations for job seekers.`

      const perplexityService = new PerplexityService()
      const result = await perplexityService.makeRequest('You are a market intelligence analyst providing accurate, data-driven insights about job markets and hiring trends.', prompt)
      
      // Parse the response (Perplexity returns structured data)
      const trends: IndustryTrend[] = this.parseMarketTrends(result.content)
      
      this.setCache(cacheKey, trends)
      return trends
    } catch (error) {
      console.error('[MARKET_INTEL] Failed to fetch market trends:', error)
      // Return fallback trends
      return [
        {
          trend: 'Remote work adoption',
          description: 'Remote and hybrid work models are now standard across industries',
          recommendation: 'Highlight remote work experience and tools proficiency in applications'
        },
        {
          trend: 'AI and automation skills',
          description: 'AI literacy is becoming essential across most roles',
          recommendation: 'Consider upskilling in AI tools relevant to your field'
        },
        {
          trend: 'Focus on outcomes',
          description: 'Employers prioritize measurable results and impact',
          recommendation: 'Quantify achievements with specific metrics in your resume'
        }
      ]
    }
  }

  /**
   * Get top industries by job openings and average salary
   */
  async getTopIndustries(): Promise<Array<{ industry: string; count: number; avgSalary?: number }>> {
    const cacheKey = 'top-industries'
    const cached = this.getFromCache<Array<{ industry: string; count: number; avgSalary?: number }>>(cacheKey)
    if (cached) return cached

    try {
      const prompt = `What are the top 10 industries with the most job openings in 2025? Include approximate number of openings and average salary ranges in USD. Return as structured data.`
      
      const perplexityService = new PerplexityService()
      const result = await perplexityService.makeRequest('You are a market intelligence analyst providing accurate, data-driven insights about job markets and hiring trends.', prompt)
      
      const industries = this.parseTopIndustries(result.content)
      
      this.setCache(cacheKey, industries)
      return industries
    } catch (error) {
      console.error('[MARKET_INTEL] Failed to fetch top industries:', error)
      // Return fallback data based on common knowledge
      return [
        { industry: 'Technology', count: 0, avgSalary: 120000 },
        { industry: 'Healthcare', count: 0, avgSalary: 85000 },
        { industry: 'Finance', count: 0, avgSalary: 95000 },
        { industry: 'Education', count: 0, avgSalary: 65000 },
        { industry: 'Retail', count: 0, avgSalary: 45000 }
      ]
    }
  }

  /**
   * Get in-demand skills and their salary impact
   */
  async getSkillsDemand(industry?: string): Promise<Array<{ skill: string; demandScore: number; avgSalaryImpact: number }>> {
    const cacheKey = `skills:${industry || 'general'}`
    const cached = this.getFromCache<Array<{ skill: string; demandScore: number; avgSalaryImpact: number }>>(cacheKey)
    if (cached) return cached

    try {
      const prompt = industry
        ? `What are the top 10 most in-demand skills for ${industry} in 2025? Include demand scores (1-10) and salary impact (% increase). Return as structured data.`
        : `What are the top 10 most in-demand skills across all industries in 2025? Include demand scores (1-10) and salary impact (% increase). Return as structured data.`
      
      const perplexityService = new PerplexityService()
      const result = await perplexityService.makeRequest('You are a market intelligence analyst providing accurate, data-driven insights about job markets and hiring trends.', prompt)
      
      const skills = this.parseSkillsDemand(result.content)
      
      this.setCache(cacheKey, skills)
      return skills
    } catch (error) {
      console.error('[MARKET_INTEL] Failed to fetch skills demand:', error)
      return []
    }
  }

  /**
   * Get comprehensive market insights
   */
  async getMarketInsights(userIndustry?: string, userRole?: string): Promise<MarketInsight> {
    try {
      const [topIndustries, marketTrends, skillsDemand, salaryData] = await Promise.all([
        this.getTopIndustries(),
        this.getMarketTrends(userIndustry),
        this.getSkillsDemand(userIndustry),
        userRole ? this.getSalaryData(userRole, 'United States') : Promise.resolve(null)
      ])

      return {
        topIndustries,
        salaryData: salaryData ? [salaryData] : [],
        marketTrends,
        skillsDemand
      }
    } catch (error) {
      console.error('[MARKET_INTEL] Failed to get market insights:', error)
      throw error
    }
  }

  // Helper methods for parsing Perplexity responses
  private parseMarketTrends(response: unknown): IndustryTrend[] {
    try {
      let parsed: unknown = response
      
      // Perplexity returns structured JSON
      if (typeof response === 'string') {
        // Extract JSON from markdown if needed
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1])
        }
      }

      if (Array.isArray(parsed)) {
        return parsed.slice(0, 5)
      }

      if (parsed && typeof parsed === 'object' && 'trends' in parsed) {
        const obj = parsed as { trends: unknown }
        if (Array.isArray(obj.trends)) {
          return obj.trends.slice(0, 5)
        }
      }

      // Fallback parsing
      return []
    } catch (error) {
      console.error('[MARKET_INTEL] Failed to parse trends:', error)
      return []
    }
  }

  private parseTopIndustries(response: unknown): Array<{ industry: string; count: number; avgSalary?: number }> {
    try {
      let parsed: unknown = response
      
      if (typeof response === 'string') {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1])
        }
      }

      if (Array.isArray(parsed)) {
        return parsed.slice(0, 10)
      }

      if (parsed && typeof parsed === 'object' && 'industries' in parsed) {
        const obj = parsed as { industries: unknown }
        if (Array.isArray(obj.industries)) {
          return obj.industries.slice(0, 10)
        }
      }

      return []
    } catch (error) {
      console.error('[MARKET_INTEL] Failed to parse industries:', error)
      return []
    }
  }

  private parseSkillsDemand(response: unknown): Array<{ skill: string; demandScore: number; avgSalaryImpact: number }> {
    try {
      let parsed: unknown = response
      
      if (typeof response === 'string') {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1])
        }
      }

      if (Array.isArray(parsed)) {
        return parsed.slice(0, 10)
      }

      if (parsed && typeof parsed === 'object' && 'skills' in parsed) {
        const obj = parsed as { skills: unknown }
        if (Array.isArray(obj.skills)) {
          return obj.skills.slice(0, 10)
        }
      }

      return []
    } catch (error) {
      console.error('[MARKET_INTEL] Failed to parse skills:', error)
      return []
    }
  }

  // Cache management
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clearCache(): void {
    this.cache.clear()
  }
}

