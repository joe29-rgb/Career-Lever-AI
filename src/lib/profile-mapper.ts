/**
 * Profile Mapper Service
 * 
 * Maps resume data to UserProfile for:
 * - Job search (location, keywords)
 * - Resume optimization (work history, education, skills)
 * - Cover letter generation (experience, psychology)
 * - Application tracking (preferences)
 */

import UserProfile, { IUserProfile } from '@/models/UserProfile'
import Resume from '@/models/Resume'
import { EnhancedResumeExtractor } from './enhanced-resume-extractor'

export interface ProfileMappingResult {
  success: boolean
  profile?: IUserProfile
  errors?: string[]
  warnings?: string[]
}

export class ProfileMapper {
  /**
   * Create or update user profile from resume
   */
  static async mapResumeToProfile(
    userId: string,
    resumeId: string
  ): Promise<ProfileMappingResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Get resume
      const resume = await Resume.findOne({ _id: resumeId, userId })
      if (!resume) {
        return { success: false, errors: ['Resume not found'] }
      }

      // Use enhanced extractor for better weighting and accuracy
      console.log('[PROFILE_MAPPER] Using enhanced extractor...')
      const extracted = await EnhancedResumeExtractor.extract(resume.extractedText)

      // Add extraction warnings
      if (extracted.warnings.length > 0) {
        warnings.push(...extracted.warnings)
      }

      console.log('[PROFILE_MAPPER] Extraction quality:', Math.round(extracted.extractionQuality * 100) + '%')

      // Get or create profile
      let profile = await UserProfile.findOne({ userId })
      const isNew = !profile

      if (!profile) {
        profile = new UserProfile({ userId })
      }

      // Map personal information
      if (extracted.name) {
        const nameParts = extracted.name.split(' ')
        profile.firstName = nameParts[0] || ''
        profile.lastName = nameParts.slice(1).join(' ') || ''
      } else {
        warnings.push('Name not found in resume')
      }

      if (extracted.email) {
        profile.email = extracted.email
      } else {
        warnings.push('Email not found in resume')
      }

      if (extracted.phone) {
        profile.phone = extracted.phone
      }

      if (extracted.linkedin) {
        profile.linkedinUrl = extracted.linkedin
      }

      // Map location (CRITICAL for job search) - with confidence
      if (extracted.location && extracted.location.confidence > 0.5) {
        profile.location = {
          city: extracted.location.city,
          province: extracted.location.province,
          country: extracted.location.country
        }
        console.log('[PROFILE_MAPPER] Location confidence:', Math.round(extracted.location.confidence * 100) + '%')
      } else {
        warnings.push('Location not found or low confidence')
      }

      // Map years of experience
      profile.yearsExperience = extracted.totalYearsExperience

      // Map work experience (already scored and sorted by recency)
      if (extracted.workExperience.length > 0) {
        profile.workExperience = extracted.workExperience.map(exp => ({
          company: exp.company,
          title: exp.title,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          isCurrent: exp.isCurrent,
          description: exp.description,
          achievements: exp.achievements,
          skills: exp.skills,
          industry: undefined // Will be inferred later
        }))
      } else {
        warnings.push('No work experience found in resume')
      }

      // Map education (already scored by relevance)
      if (extracted.education.length > 0) {
        profile.education = extracted.education.map(edu => ({
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          location: undefined,
          startDate: edu.startDate,
          endDate: edu.endDate,
          gpa: undefined,
          achievements: []
        }))
      } else {
        warnings.push('No education found in resume')
      }

      // Map skills (WEIGHTED by importance)
      if (extracted.topSkills.length > 0) {
        // Use top skills categorized by the extractor
        const categorized = this.categorizeSkills(extracted.topSkills)
        profile.skills = categorized
        
        console.log('[PROFILE_MAPPER] Top skills:', extracted.topSkills.slice(0, 10))
      } else {
        warnings.push('No skills/keywords found in resume')
      }

      // Map career preferences from extracted data
      if (extracted.targetRoles.length > 0) {
        if (!profile.careerPreferences) {
          profile.careerPreferences = {
            targetRoles: [],
            targetIndustries: [],
            targetCompanies: [],
            workType: [],
            willingToRelocate: false,
            preferredLocations: [],
            jobSearchRadius: 70
          }
        }
        profile.careerPreferences.targetRoles = extracted.targetRoles
      }

      // Map psychology profile if available
      if (resume.comprehensiveResearch?.psychology) {
        const psych = resume.comprehensiveResearch.psychology as any
        profile.psychologyProfile = {
          workStyle: psych.workStyle || [],
          motivators: psych.motivators || [],
          strengths: psych.strengths || [],
          communicationStyle: psych.communicationStyle || 'Unknown',
          leadershipStyle: psych.leadershipStyle,
          teamDynamics: psych.teamDynamics || [],
          generatedAt: new Date()
        }
      }

      // Set resume reference
      profile.currentResumeId = resume._id

      // Save profile
      await profile.save()

      console.log('[PROFILE_MAPPER] Profile mapped successfully:', {
        userId,
        isNew,
        completeness: profile.profileCompleteness,
        location: profile.location,
        workExperience: profile.workExperience.length,
        education: profile.education.length,
        skills: Object.values(profile.skills).flat().length
      })

      return {
        success: true,
        profile,
        warnings: warnings.length > 0 ? warnings : undefined
      }

    } catch (error) {
      console.error('[PROFILE_MAPPER] Error:', error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Parse location string into structured format
   */
  private static parseLocation(locationStr: string): {
    city: string
    province: string
    country: string
  } | null {
    // Try "City, PROVINCE" format
    const match = locationStr.match(/^([^,]+),\s*([A-Z]{2})$/i)
    if (match) {
      return {
        city: match[1].trim(),
        province: match[2].toUpperCase(),
        country: 'Canada' // Default, can be improved
      }
    }

    // Try "City, Province, Country" format
    const match2 = locationStr.match(/^([^,]+),\s*([^,]+),\s*([^,]+)$/i)
    if (match2) {
      return {
        city: match2[1].trim(),
        province: match2[2].trim(),
        country: match2[3].trim()
      }
    }

    // If just province/state
    if (locationStr.length === 2) {
      return {
        city: 'Unknown',
        province: locationStr.toUpperCase(),
        country: 'Canada'
      }
    }

    return null
  }

  /**
   * Categorize skills into technical, soft, languages, tools
   */
  private static categorizeSkills(keywords: string[]): {
    technical: string[]
    soft: string[]
    languages: string[]
    tools: string[]
  } {
    const technical: string[] = []
    const soft: string[] = []
    const languages: string[] = []
    const tools: string[] = []

    // Programming languages
    const programmingLanguages = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'ruby', 'php',
      'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql'
    ]

    // Soft skills
    const softSkills = [
      'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
      'time management', 'project management', 'collaboration', 'adaptability',
      'creativity', 'negotiation', 'presentation', 'mentoring', 'coaching'
    ]

    // Tools/Technologies
    const toolsKeywords = [
      'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'jenkins', 'terraform',
      'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'kafka'
    ]

    for (const keyword of keywords) {
      const lower = keyword.toLowerCase()

      if (programmingLanguages.some(lang => lower.includes(lang))) {
        languages.push(keyword)
      } else if (softSkills.some(skill => lower.includes(skill))) {
        soft.push(keyword)
      } else if (toolsKeywords.some(tool => lower.includes(tool))) {
        tools.push(keyword)
      } else {
        // Default to technical
        technical.push(keyword)
      }
    }

    return { technical, soft, languages, tools }
  }

  /**
   * Get profile for job search
   */
  static async getProfileForJobSearch(userId: string): Promise<{
    location: string
    keywords: string[]
    workType?: ('remote' | 'hybrid' | 'onsite')[]
    salaryMin?: number
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
  } | null> {
    const profile = await UserProfile.findOne({ userId })
    if (!profile) return null

    // Determine experience level
    let experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' = 'mid'
    if (profile.yearsExperience < 2) experienceLevel = 'entry'
    else if (profile.yearsExperience >= 2 && profile.yearsExperience < 5) experienceLevel = 'mid'
    else if (profile.yearsExperience >= 5 && profile.yearsExperience < 10) experienceLevel = 'senior'
    else if (profile.yearsExperience >= 10) experienceLevel = 'executive'

    // Build location string
    const location = profile.location?.city && profile.location?.province
      ? `${profile.location.city}, ${profile.location.province}`
      : 'Canada'

    // Get all skills as keywords
    const keywords = [
      ...profile.skills.technical,
      ...profile.skills.languages,
      ...profile.skills.tools
    ].filter(Boolean)

    return {
      location,
      keywords,
      workType: profile.careerPreferences?.workType,
      salaryMin: profile.careerPreferences?.salaryMin,
      experienceLevel
    }
  }

  /**
   * Get profile for resume optimization
   */
  static async getProfileForOptimization(userId: string) {
    const profile = await UserProfile.findOne({ userId })
    if (!profile) return null

    return {
      personalInfo: {
        name: `${profile.firstName} ${profile.lastName}`,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        linkedin: profile.linkedinUrl,
        portfolio: profile.portfolioUrl
      },
      summary: profile.summary,
      workExperience: profile.workExperience,
      education: profile.education,
      skills: profile.skills,
      certifications: profile.certifications,
      psychologyProfile: profile.psychologyProfile
    }
  }
}

export default ProfileMapper
