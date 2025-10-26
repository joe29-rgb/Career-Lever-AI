export interface CompanyFinancial {
  metric: string
  value: string
  confidence?: number
  source?: string
}

export interface CompanyCulturePoint {
  point: string
  confidence?: number
  source?: string
}

export interface CompanySalary {
  title: string
  range: string
  currency?: string
  geo?: string
  source?: string
  confidence?: number
}

export interface CompanyContact {
  name: string
  title: string
  department?: string
  email?: string
  linkedinUrl?: string
  authority?: 'decision maker' | 'recruiter' | 'manager' | 'coordinator'
  confidence?: number
  url?: string
  source?: string
}

export interface CompanyNewsItem {
  title: string
  summary: string
  url: string
  date?: string
  source?: string
  impact?: string
}

export interface CompanyReview {
  platform: string
  rating?: number
  summary: string
  url: string
  pros?: string[]
  cons?: string[]
}

export interface CompanyGlassdoorRating {
  overallRating?: number
  ceoApproval?: number
  recommendToFriend?: number
  reviewCount?: number
  url?: string
  pros?: string[]
  cons?: string[]
}

export interface CompanyStockProfile {
  ticker?: string
  exchange?: string
  currentPrice?: string
  marketCap?: string
  isPublic?: boolean
  website?: string
  marketPosition?: string
  financialStability?: string
  recentPerformance?: string
}

export type CompanySocialMedia = Partial<Record<'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube', string>> &
  Record<string, string | undefined>

export interface CompanyAiRiskAnalysis {
  roleRisk?: string
  automationProbability?: string
  timeframe?: string
  companyAIAdoption?: string
  futureOutlook?: string
  recommendations?: string[]
}

export interface CompanyCompensationInsight {
  salaryRange?: string
  benefits?: string
  notes?: string
}

export type CompanyMarketIntelligence =
  | string
  | {
      competitivePosition?: string
      industryTrends?: string[]
      financialStability?: string
      recentPerformance?: string
      recentNews?: string[]
    }

export interface CompanyResearchResult {
  company: string
  description: string
  size?: string
  revenue?: string
  industry?: string
  founded?: string
  headquarters?: string
  psychology?: string
  marketIntelligence?: CompanyMarketIntelligence
  financials: CompanyFinancial[]
  culture: CompanyCulturePoint[]
  salaries: CompanySalary[]
  contacts: CompanyContact[]
  hiringContacts: CompanyContact[]
  sources: Array<{ title?: string; url?: string }>
  confidence: number
  aiRiskAnalysis?: CompanyAiRiskAnalysis
  salaryIntelligence?: CompanyCompensationInsight
  recentNews: CompanyNewsItem[]
  reviews: CompanyReview[]
  socialMedia?: CompanySocialMedia
  glassdoorRating?: CompanyGlassdoorRating
  stockProfile?: CompanyStockProfile
  timestamp?: number
  
  // Optional comprehensive research data (from comprehensiveJobResearch)
  jobAnalysis?: {
    matchScore: number
    matchingSkills: string[]
    missingSkills: string[]
    skillsToHighlight: string[]
    recommendations: string[]
    estimatedFit: string
  }
  news?: Array<{
    title: string
    summary: string
    url: string
    date?: string
    source?: string
    impact?: string
  }>
  strategicRecommendations?: {
    applicationStrategy: string
    contactStrategy: string
    interviewPrep: string[]
  }
}

export type CompanyResearchPayload = Partial<CompanyResearchResult> & {
  company?: string
  marketIntelligence?: CompanyMarketIntelligence
  financials?: Array<Partial<CompanyFinancial>>
  culture?: Array<Partial<CompanyCulturePoint> | string>
  salaries?: Array<Partial<CompanySalary>>
  contacts?: Array<Partial<CompanyContact>>
  hiringContacts?: Array<Partial<CompanyContact>>
  sources?: Array<{ title?: string; url?: string } | string>
  recentNews?: Array<Partial<CompanyNewsItem>>
  news?: Array<Partial<CompanyNewsItem>>
  reviews?: Array<Partial<CompanyReview>>
  socialMedia?: Record<string, unknown>
  glassdoorRating?: Partial<CompanyGlassdoorRating>
  stockProfile?: Partial<CompanyStockProfile>
  aiAutomationThreat?: Partial<CompanyAiRiskAnalysis>
  aiRiskAnalysis?: Partial<CompanyAiRiskAnalysis>
  compensation?: Partial<CompanyCompensationInsight>
  salaryIntelligence?: Partial<CompanyCompensationInsight>
}
