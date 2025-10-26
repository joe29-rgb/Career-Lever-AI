// Unified Type System for Career Lever AI
// Single source of truth for all application types

export interface User {
  _id: string
  email: string
  name: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface Resume {
  _id: string
  userId: string
  originalFileName: string
  extractedText: string
  customizedVersions: CustomizedResume[]
  uploadedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface CustomizedResume {
  _id: string
  jobApplicationId: string
  customizedText: string
  jobTitle: string
  companyName: string
  matchScore: number
  createdAt: Date
}

export interface JobApplication {
  _id: string
  userId: string
  jobTitle: string
  companyName: string
  jobDescription: string
  jobUrl?: string
  location?: string
  salary?: string
  applicationStatus: 'saved' | 'applied' | 'screening' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn'
  appliedDate?: Date
  notes?: string[]
  documents?: ApplicationDocument[]
  createdAt: Date
  updatedAt: Date
}

export interface ApplicationDocument {
  type: 'resume' | 'cover-letter' | 'portfolio' | 'other'
  filename: string
  url?: string
  generatedAt: Date
}

// Single unified job result interface for all scraping sources
export interface JobResult {
  id: string
  title: string
  company: string
  location?: string
  salary?: string
  url?: string
  source: string
  description?: string
  snippet?: string
  postedDate?: Date | string
  requirements?: string[]
  benefits?: string[]
}

export interface CompanyResearch {
  _id: string
  companyName: string
  website?: string
  industry?: string
  size?: string
  description?: string
  culture?: string[]
  financials?: FinancialData[]
  news?: NewsItem[]
  reviews?: CompanyReview[]
  contacts?: HiringContact[]
  lastUpdated: Date
  expiresAt?: Date
}

export interface FinancialData {
  year: number
  revenue?: string
  growth?: string
  funding?: string
}

export interface NewsItem {
  title: string
  url: string
  date: Date | string
  source: string
  summary?: string
}

export interface CompanyReview {
  rating: number
  title: string
  pros?: string
  cons?: string
  source: string
  date?: Date | string
}

export interface HiringContact {
  name: string
  title?: string
  email?: string
  linkedIn?: string
  role?: string
  department?: string
  linkedinUrl?: string
  emailType?: 'public' | 'inferred' | 'pattern'
  source?: string
  confidence?: number
  phone?: string
  alternativeEmails?: string[]
  discoveryMethod?: string
}

// API Response wrapper for consistent responses
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  metadata?: ResponseMetadata
}

export interface ResponseMetadata {
  requestId?: string
  timestamp: Date
  cached?: boolean
  executionTime?: number
}

// Perplexity API types
export interface PerplexityJobSearch {
  query: string
  results?: JobResult[]
  sources?: string[]
}

export interface IntelligenceResponse {
  company: string
  freshness: string
  sources: any[]
  confidence: number
  financials: any[]
  culture: any[]
  salaries: any[]
  contacts: any[]
  growth: any[]
  summary: string
  description: string
  size: string
  revenue: string
  industry: string
  founded: string
  headquarters: string
  psychology: string
  marketIntelligence: string
}

// PDF Processing types
export interface PDFExtractionResult {
  text: string
  method: 'text-extraction' | 'ocr-fallback' | 'manual-input'
  confidence: number
  error?: string
}

// Session types (NextAuth)
export interface SessionUser {
  id: string
  email: string
  name?: string
  image?: string
}

// Form validation schemas
export interface ResumeCustomizeInput {
  resumeId: string
  jobDescription: string
  jobTitle: string
  companyName: string
  tone?: 'professional' | 'casual' | 'enthusiastic'
}

export interface CompanyResearchInput {
  companyName: string
  website?: string
  includeNews?: boolean
  includeReviews?: boolean
}

// Rate limiting types
export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitEntry {
  count: number
  resetTime: number
}

// Circuit breaker types for AI service
export interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  state: 'closed' | 'open' | 'half-open'
}

export interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
  cost: number
  model: string
}
