export interface Company {
  name: string
  website?: string
  industry?: string
  description?: string
  stockSymbol?: string
  stockPrice?: number
  marketCap?: string
  founded?: number
  employees?: string
  revenue?: string
  glassdoorRating?: number
  glassdoorReviews?: number
  culture?: string
  benefits?: string[]
  perks?: string[]
  recentNews?: CompanyNews[]
  headquarters?: string
  locations?: string[]
  verified?: boolean
  lastUpdated?: string
}

export interface CompanyNews {
  title: string
  source: string
  date: string
  url: string
  summary?: string
}

export interface CompanyResearchRequest {
  companyName: string
  location?: string
}

export interface CompanyResearchResponse {
  success: boolean
  data: Company
  meta: {
    sources: string[]
    confidence: number
    researchedAt: string
  }
  error?: string
}
