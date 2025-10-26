import { validateCompany } from '../validators/company-validator'
import { DataSanitizer } from '../validators/data-sanitizer'

export interface CompanyResearchResult {
  success: boolean
  company: {
    name: string
    website?: string
    industry?: string
    description?: string
    stockSymbol?: string
    stockPrice?: number
    marketCap?: string
    founded?: number
    employees?: string
    glassdoorRating?: number
    glassdoorReviews?: number
    culture?: string
    benefits?: string[]
    recentNews?: Array<{
      title: string
      source: string
      date: string
      url: string
    }>
    headquarters?: string
    locations?: string[]
  }
  sources: string[]
  confidence: number
  error?: string
}

export class CompanyResearchAgent {
  
  static async researchCompany(companyName: string, location?: string): Promise<CompanyResearchResult> {
    console.log(`🔍 [COMPANY RESEARCH] Researching: ${companyName}`)
    
    const validation = validateCompany({ name: companyName, location })
    if (!validation.valid) {
      return {
        success: false,
        company: { name: companyName },
        sources: [],
        confidence: 0,
        error: validation.issues.join(', ')
      }
    }
    
    try {
      const prompt = this.buildResearchPrompt(companyName, location)
      const response = await this.callPerplexity(prompt)
      const companyData = this.extractCompanyData(response, companyName)
      const sanitized = DataSanitizer.sanitizeCompanyData(companyData) as CompanyResearchResult['company']
      
      console.log(`✅ [COMPANY RESEARCH] Research complete for ${companyName}`)
      
      return {
        success: true,
        company: sanitized,
        sources: this.getSourcesUsed(),
        confidence: this.calculateConfidence(companyData),
        error: undefined
      }
      
    } catch (error) {
      console.error(`❌ [COMPANY RESEARCH] Failed for ${companyName}:`, error)
      
      return {
        success: false,
        company: { name: companyName },
        sources: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  private static buildResearchPrompt(companyName: string, location?: string): string {
    return `Research the company "${companyName}"${location ? ` in ${location}` : ''}.

Use verified data sources:

FINANCIAL DATA:
- Yahoo Finance Canada
- TMX Money TSX
- SEC EDGAR
- Financial Modeling Prep API

COMPANY INFORMATION:
- LinkedIn Company Page
- Crunchbase
- Google Business
- Government of Canada Corporations

NEWS & MEDIA:
- Google News
- Reuters Business
- Financial Post
- BNN Bloomberg

CULTURE & WORKPLACE:
- Glassdoor Reviews
- Indeed Company Reviews

RETURN EXACTLY THIS JSON:

{
  "name": "Official company name",
  "website": "https://company.com",
  "industry": "Industry name",
  "description": "Brief description",
  "stockSymbol": "TSXV:ABC or null",
  "stockPrice": 123.45 or null,
  "marketCap": "$10M" or null,
  "founded": 2010 or null,
  "employees": "50-200" or null,
  "glassdoorRating": 4.2 or null,
  "glassdoorReviews": 145 or null,
  "culture": "Description" or null,
  "benefits": ["benefit1"] or [],
  "recentNews": [{"title":"","source":"","date":"","url":""}] or [],
  "headquarters": "City, Province" or null,
  "locations": ["Location1"] or []
}

Return ONLY the JSON object. No markdown, no text.`
  }
  
  private static async callPerplexity(prompt: string): Promise<string> {
    const apiKey = process.env.PERPLEXITY_API_KEY
    
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY not found')
    }
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        temperature: 0.1,
        max_tokens: 3000,
        messages: [
          { role: 'system', content: 'You are a company research specialist. Return ONLY valid JSON with verified data.' },
          { role: 'user', content: prompt }
        ]
      })
    })
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.choices[0].message.content
  }
  
  private static extractCompanyData(response: string, companyName: string): Record<string, unknown> {
    let cleaned = response.trim()
    cleaned = cleaned.replace(/^```json\s*/i, '')
    cleaned = cleaned.replace(/^```\s*/i, '')
    cleaned = cleaned.replace(/\s*```$/i, '')
    
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    
    const data = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    data.name = data.name || companyName
    
    return data as Record<string, unknown>
  }
  
  private static getSourcesUsed(): string[] {
    return [
      'Yahoo Finance',
      'TMX Money',
      'LinkedIn',
      'Crunchbase',
      'Google News',
      'Glassdoor'
    ]
  }
  
  private static calculateConfidence(data: Record<string, unknown>): number {
    let confidence = 50
    
    if (data.website) confidence += 10
    if (data.industry) confidence += 5
    if (data.description) confidence += 5
    if (data.stockSymbol || data.stockPrice) confidence += 10
    if (data.employees) confidence += 5
    if (data.glassdoorRating) confidence += 10
    if (data.recentNews && Array.isArray(data.recentNews) && data.recentNews.length > 0) confidence += 5
    
    return Math.min(confidence, 100)
  }
}
