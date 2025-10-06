export namespace CareerLever {
  // Base interfaces
  export interface BaseEntity {
    _id: string
    createdAt: Date
    updatedAt: Date
  }

  // User system
  export interface User extends BaseEntity {
    email: string
    name: string
    image?: string
    role: 'user' | 'admin' | 'enterprise'
    settings: UserSettings
  }

  export interface UserSettings {
    notifications: NotificationSettings
    privacy: PrivacySettings
    ai: AISettings
  }

  // Job data - SINGLE unified interface
  export interface Job {
    id: string
    title: string
    company: string
    description: string
    location?: string
    salary?: SalaryRange
    source: JobSource
    url?: string
    postedDate?: Date
    expiryDate?: Date
    requirements: string[]
    benefits?: string[]
  }

  export interface SalaryRange {
    min?: number
    max?: number
    currency: string
    period: 'hour' | 'month' | 'year'
  }

  export type JobSource = 'indeed' | 'linkedin' | 'glassdoor' | 'company-direct' | 'imported'

  // Resume system
  export interface Resume extends BaseEntity {
    userId: string
    filename: string
    extractedText: string
    extractionMethod: ExtractionMethod
    extractionConfidence: number
    versions: ResumeVersion[]
    metadata: ResumeMetadata
  }

  export interface ResumeVersion {
    id: string
    jobApplicationId?: string
    customizedText: string
    targetRole: string
    targetCompany: string
    matchScore: number
    createdAt: Date
  }

  export type ExtractionMethod = 'text-extraction' | 'ocr-fallback' | 'manual-input'

  export interface ResumeMetadata {
    contactInfo: ContactInfo
    sections: ResumeSection[]
    skills: string[]
    experience: ExperienceEntry[]
    education: EducationEntry[]
  }

  export interface ContactInfo {
    name: string
    email: string
    phone: string
    address: string
  }

  export interface ResumeSection {
    title: string
    content: string
  }

  export interface ExperienceEntry {
    title: string
    company: string
    location: string
    startDate: Date
    endDate?: Date
    description: string
  }

  export interface EducationEntry {
    degree: string
    institution: string
    location: string
    startDate: Date
    endDate?: Date
    gpa?: number
  }

  export interface CultureData {
    values: string[]
    workStyle: string
    benefits: string[]
  }

  export interface FinancialData {
    revenue: string
    funding: string
    growthRate: string
  }

  export interface NewsItem {
    title: string
    url: string
    date: Date
    summary: string
  }

  export interface CompanyReview {
    rating: number
    title: string
    content: string
    author: string
    date: Date
  }

  export interface HiringContact {
    name: string
    title: string
    email: string
    department: string
  }

  export interface SocialMediaData {
    linkedin: string
    twitter: string
    facebook: string
  }

  export interface NotificationSettings {
    email: boolean
    push: boolean
    sms: boolean
  }

  export interface PrivacySettings {
    profileVisibility: 'public' | 'private' | 'friends'
    dataSharing: boolean
    analytics: boolean
  }

  export interface AISettings {
    autoSuggestions: boolean
    matchThreshold: number
    customizationLevel: 'basic' | 'advanced' | 'enterprise'
  }

  // Application tracking
  export interface JobApplication extends BaseEntity {
    userId: string
    job: Job
    status: ApplicationStatus
    appliedDate?: Date
    documents: ApplicationDocument[]
    timeline: ApplicationEvent[]
    notes: string[]
    companyResearch?: CompanyResearch
  }

  export type ApplicationStatus =
    | 'saved'
    | 'applied'
    | 'screening'
    | 'interviewing'
    | 'offer'
    | 'rejected'
    | 'withdrawn'

  export interface ApplicationDocument {
    type: 'resume' | 'cover-letter' | 'portfolio' | 'other'
    filename: string
    url?: string
    generatedAt: Date
  }

  export interface ApplicationEvent {
    type: 'status-change' | 'interview-scheduled' | 'follow-up' | 'note-added'
    timestamp: Date
    description: string
    metadata?: Record<string, any>
  }

  // Company research
  export interface CompanyResearch extends BaseEntity {
    companyName: string
    website?: string
    industry: string
    size: CompanySize
    description: string
    culture: CultureData
    financials?: FinancialData
    news: NewsItem[]
    reviews: CompanyReview[]
    contacts: HiringContact[]
    socialMedia: SocialMediaData
    lastUpdated: Date
  }

  export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise'

  // API responses
  export interface APIResponse<T = any> {
    success: boolean
    data?: T
    error?: APIError
    metadata?: ResponseMetadata
  }

  export interface APIError {
    code: string
    message: string
    details?: any
  }

  export interface ResponseMetadata {
    requestId: string
    timestamp: Date
    version: string
    cached?: boolean
  }
}
