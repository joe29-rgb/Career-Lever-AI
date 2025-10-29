/**
 * Comprehensive User Profile Model
 * 
 * Central source of truth for all user data:
 * - Personal information
 * - Location (for job search)
 * - Work experience
 * - Education
 * - Skills & keywords
 * - Career preferences
 */

import mongoose, { Schema, Document } from 'mongoose'

export interface IWorkExperience {
  company: string
  title: string
  location?: string
  startDate: Date
  endDate?: Date // null = current position
  isCurrent: boolean
  description: string
  achievements: string[]
  skills: string[]
  industry?: string
}

export interface IEducation {
  institution: string
  degree: string
  field: string
  location?: string
  startDate: Date
  endDate?: Date
  gpa?: number
  achievements: string[]
}

export interface ICertification {
  name: string
  issuer: string
  issueDate: Date
  expiryDate?: Date
  credentialId?: string
  url?: string
}

export interface ICareerPreferences {
  targetRoles: string[]
  targetIndustries: string[]
  targetCompanies: string[]
  workType: ('remote' | 'hybrid' | 'onsite')[]
  salaryMin?: number
  salaryMax?: number
  willingToRelocate: boolean
  preferredLocations: string[]
  jobSearchRadius: number // km
  availableStartDate?: Date
}

export interface IUserProfile extends Document {
  userId: Schema.Types.ObjectId
  
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone?: string
  linkedinUrl?: string
  portfolioUrl?: string
  githubUrl?: string
  
  // Location (PRIMARY for job search)
  location: {
    city: string
    province: string // or state
    country: string
    fullAddress?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  
  // Professional Summary
  headline?: string // e.g., "Senior Software Developer"
  summary?: string // Professional bio
  yearsExperience: number
  
  // Work Experience (MAPPED from resume)
  workExperience: IWorkExperience[]
  
  // Education (MAPPED from resume)
  education: IEducation[]
  
  // Certifications
  certifications: ICertification[]
  
  // Skills & Keywords (EXTRACTED from resume + manual)
  skills: {
    technical: string[]
    soft: string[]
    languages: string[]
    tools: string[]
    
    // NEW: Weighted skills from Perplexity analysis
    weighted?: {
      primarySkills: Array<{
        skill: string
        weight: number
        years?: number | null
        category: string
        extractedAt?: Date
      }>
      secondarySkills: Array<{
        skill: string
        weight: number
        years?: number | null
        category: string
        extractedAt?: Date
      }>
      lastAnalyzedAt?: Date
    }
  }
  
  // Career Preferences
  careerPreferences: ICareerPreferences
  
  // Psychology Profile (from resume analysis)
  psychologyProfile?: {
    workStyle: string[]
    motivators: string[]
    strengths: string[]
    communicationStyle: string
    leadershipStyle?: string
    teamDynamics: string[]
    generatedAt: Date
  }
  
  // Resume Reference
  currentResumeId?: Schema.Types.ObjectId
  
  // Metadata
  profileCompleteness: number // 0-100
  lastUpdated: Date
  createdAt: Date
  
  // Methods
  calculateCompleteness(): number
}

const WorkExperienceSchema = new Schema({
  company: { type: String, required: true },
  title: { type: String, required: true },
  location: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  isCurrent: { type: Boolean, default: false },
  description: { type: String, required: true },
  achievements: [String],
  skills: [String],
  industry: String
})

const EducationSchema = new Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: { type: String, required: true },
  location: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  gpa: Number,
  achievements: [String]
})

const CertificationSchema = new Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: Date,
  credentialId: String,
  url: String
})

const UserProfileSchema = new Schema<IUserProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Personal Information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  linkedinUrl: String,
  portfolioUrl: String,
  githubUrl: String,
  
  // Location
  location: {
    city: { type: String, required: true },
    province: { type: String, required: true },
    country: { type: String, required: true, default: 'Canada' },
    fullAddress: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Professional Summary
  headline: String,
  summary: String,
  yearsExperience: { type: Number, default: 0 },
  
  // Work Experience
  workExperience: [WorkExperienceSchema],
  
  // Education
  education: [EducationSchema],
  
  // Certifications
  certifications: [CertificationSchema],
  
  // Skills
  skills: {
    technical: [String],
    soft: [String],
    languages: [String],
    tools: [String],
    
    // NEW: Weighted skills from Perplexity analysis
    weighted: {
      primarySkills: [{
        skill: String,
        weight: Number,
        years: Number,
        category: String,
        extractedAt: Date
      }],
      secondarySkills: [{
        skill: String,
        weight: Number,
        years: Number,
        category: String,
        extractedAt: Date
      }],
      lastAnalyzedAt: Date
    }
  },
  
  // Career Preferences
  careerPreferences: {
    targetRoles: [String],
    targetIndustries: [String],
    targetCompanies: [String],
    workType: [{ type: String, enum: ['remote', 'hybrid', 'onsite'] }],
    salaryMin: Number,
    salaryMax: Number,
    willingToRelocate: { type: Boolean, default: false },
    preferredLocations: [String],
    jobSearchRadius: { type: Number, default: 70 }, // km
    availableStartDate: Date
  },
  
  // Psychology Profile
  psychologyProfile: {
    workStyle: [String],
    motivators: [String],
    strengths: [String],
    communicationStyle: String,
    leadershipStyle: String,
    teamDynamics: [String],
    generatedAt: Date
  },
  
  // Resume Reference
  currentResumeId: {
    type: Schema.Types.ObjectId,
    ref: 'Resume'
  },
  
  // Metadata
  profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
})

// Indexes
// Note: userId already indexed via unique: true
UserProfileSchema.index({ email: 1 })
UserProfileSchema.index({ 'location.city': 1, 'location.province': 1 })
UserProfileSchema.index({ 'skills.technical': 1 })
UserProfileSchema.index({ 'careerPreferences.targetRoles': 1 })

// Calculate profile completeness
UserProfileSchema.methods.calculateCompleteness = function(): number {
  let score = 0
  const weights = {
    personalInfo: 15, // firstName, lastName, email, phone
    location: 15,
    workExperience: 25,
    education: 15,
    skills: 15,
    careerPreferences: 10,
    summary: 5
  }
  
  // Personal info
  if (this.firstName && this.lastName && this.email) score += weights.personalInfo * 0.75
  if (this.phone) score += weights.personalInfo * 0.25
  
  // Location
  if (this.location?.city && this.location?.province) score += weights.location
  
  // Work experience
  if (this.workExperience?.length > 0) {
    score += weights.workExperience * Math.min(this.workExperience.length / 3, 1)
  }
  
  // Education
  if (this.education?.length > 0) score += weights.education
  
  // Skills
  const totalSkills = (this.skills?.technical?.length || 0) + (this.skills?.soft?.length || 0)
  if (totalSkills > 0) {
    score += weights.skills * Math.min(totalSkills / 10, 1)
  }
  
  // Career preferences
  if (this.careerPreferences?.targetRoles?.length > 0) score += weights.careerPreferences
  
  // Summary
  if (this.summary && this.summary.length > 50) score += weights.summary
  
  return Math.round(score)
}

// Update completeness before save
UserProfileSchema.pre('save', function(next) {
  this.profileCompleteness = this.calculateCompleteness()
  this.lastUpdated = new Date()
  next()
})

export default mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema)
