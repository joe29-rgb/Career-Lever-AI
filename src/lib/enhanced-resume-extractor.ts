/**
 * Enhanced Resume Extractor with Intelligent Weighting
 * 
 * Extracts and weights:
 * - Skills (by recency, frequency, and context)
 * - Location (with fallbacks and validation)
 * - Work experience (with duration weighting)
 * - Education (with relevance scoring)
 * - Keywords (with TF-IDF-like scoring)
 */

import { PerplexityIntelligenceService } from './perplexity-intelligence'

export interface WeightedSkill {
  skill: string
  weight: number
  sources: ('work_experience' | 'education' | 'certifications' | 'summary')[]
  yearsUsed?: number
  lastUsed?: Date
  frequency: number
}

export interface ExtractedWorkExperience {
  company: string
  title: string
  location?: string
  startDate: Date
  endDate?: Date
  isCurrent: boolean
  description: string
  achievements: string[]
  skills: string[]
  durationYears: number
  recencyScore: number // 0-1, higher = more recent
}

export interface ExtractedEducation {
  institution: string
  degree: string
  field: string
  startDate: Date
  endDate?: Date
  relevanceScore: number // 0-1, based on field match to target roles
}

export interface EnhancedResumeData {
  // Personal Info
  name: string
  email: string
  phone?: string
  linkedin?: string
  
  // Location (with confidence)
  location: {
    city: string
    province: string
    country: string
    confidence: number // 0-1
    source: 'header' | 'work_experience' | 'inferred'
  }
  
  // Weighted Skills
  skills: WeightedSkill[]
  topSkills: string[] // Top 20 by weight
  
  // Work Experience (sorted by recency)
  workExperience: ExtractedWorkExperience[]
  totalYearsExperience: number
  
  // Education
  education: ExtractedEducation[]
  
  // Career Summary
  currentRole?: string
  targetRoles: string[]
  industries: string[]
  
  // Metadata
  extractionQuality: number // 0-1
  warnings: string[]
}

export class EnhancedResumeExtractor {
  /**
   * Extract and weight all resume data
   */
  static async extract(resumeText: string): Promise<EnhancedResumeData> {
    console.log('[ENHANCED_EXTRACTOR] Starting extraction...')
    
    const warnings: string[] = []
    
    // Use Perplexity with enhanced prompt
    const extracted = await this.extractWithPerplexity(resumeText)
    
    // Calculate skill weights
    const weightedSkills = this.calculateSkillWeights(
      extracted.skills,
      extracted.workExperience,
      extracted.education
    )
    
    // Calculate recency scores for work experience
    const scoredExperience = this.scoreWorkExperience(extracted.workExperience)
    
    // Validate and score location
    const location = this.validateLocation(extracted.location, scoredExperience)
    if (location.confidence < 0.7) {
      warnings.push(`Location confidence low (${Math.round(location.confidence * 100)}%)`)
    }
    
    // Calculate total years of experience
    const totalYears = scoredExperience.reduce((sum, exp) => sum + exp.durationYears, 0)
    
    // Score education relevance
    const scoredEducation = this.scoreEducation(extracted.education, weightedSkills)
    
    // Infer target roles from experience
    const targetRoles = this.inferTargetRoles(scoredExperience, weightedSkills)
    
    // Extract industries
    const industries = this.extractIndustries(scoredExperience)
    
    // Calculate extraction quality
    const quality = this.calculateExtractionQuality({
      hasName: !!extracted.name,
      hasEmail: !!extracted.email,
      hasLocation: location.confidence > 0.5,
      workExpCount: scoredExperience.length,
      educationCount: scoredEducation.length,
      skillCount: weightedSkills.length
    })
    
    if (quality < 0.7) {
      warnings.push(`Extraction quality low (${Math.round(quality * 100)}%)`)
    }
    
    console.log('[ENHANCED_EXTRACTOR] Extraction complete:', {
      skills: weightedSkills.length,
      topSkills: weightedSkills.slice(0, 20).map(s => s.skill),
      workExp: scoredExperience.length,
      education: scoredEducation.length,
      location: `${location.city}, ${location.province}`,
      locationConfidence: Math.round(location.confidence * 100) + '%',
      quality: Math.round(quality * 100) + '%'
    })
    
    return {
      name: extracted.name,
      email: extracted.email,
      phone: extracted.phone,
      linkedin: extracted.linkedin,
      location,
      skills: weightedSkills,
      topSkills: weightedSkills.slice(0, 20).map(s => s.skill),
      workExperience: scoredExperience,
      totalYearsExperience: totalYears,
      education: scoredEducation,
      currentRole: scoredExperience.find(e => e.isCurrent)?.title,
      targetRoles,
      industries,
      extractionQuality: quality,
      warnings
    }
  }
  
  /**
   * Extract data using Perplexity with enhanced prompt
   */
  private static async extractWithPerplexity(resumeText: string): Promise<any> {
    const prompt = `ANALYZE THIS RESUME AND EXTRACT ALL DATA WITH CONTEXT

RESUME TEXT:
${resumeText}

EXTRACT:

1. PERSONAL INFO:
   - Full name
   - Email
   - Phone
   - LinkedIn URL

2. LOCATION (CRITICAL):
   - Look in: header, contact section, current address
   - Format: "City, PROVINCE" (e.g., "Edmonton, AB")
   - If only country found, mark confidence as low
   - If multiple locations, use most recent

3. WORK EXPERIENCE (for each job):
   - Company name
   - Job title
   - Location
   - Start date (YYYY-MM format)
   - End date (YYYY-MM or "Present")
   - Description (full text)
   - Key achievements (bullet points)
   - Skills used (extract from description)
   - Calculate duration in years

4. EDUCATION (for each degree):
   - Institution
   - Degree type
   - Field of study
   - Start date
   - End date (or "Present")

5. SKILLS:
   - Technical skills
   - Soft skills
   - Languages
   - Tools/platforms
   - Certifications

RETURN STRICT JSON:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "555-1234",
  "linkedin": "linkedin.com/in/username",
  "location": {
    "city": "Edmonton",
    "province": "AB",
    "country": "Canada",
    "confidence": 0.9
  },
  "workExperience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, Province",
      "startDate": "2020-01",
      "endDate": "2023-06",
      "isCurrent": false,
      "description": "Full description...",
      "achievements": ["Achievement 1", "Achievement 2"],
      "skills": ["Skill 1", "Skill 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "startDate": "2016-09",
      "endDate": "2020-05"
    }
  ],
  "skills": {
    "technical": ["JavaScript", "Python"],
    "soft": ["Leadership", "Communication"],
    "languages": ["English", "French"],
    "tools": ["Git", "Docker"]
  }
}`

    const response = await PerplexityIntelligenceService.customQuery({
      systemPrompt: 'You are a resume parser. Extract ALL data from the resume. Return ONLY valid JSON.',
      userPrompt: prompt,
      temperature: 0.1,
      maxTokens: 4000
    })
    
    // Parse JSON
    let cleaned = response.content.trim()
    cleaned = cleaned.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
    const jsonMatch = cleaned.match(/(\{[\s\S]*\})/)
    if (jsonMatch) cleaned = jsonMatch[0]
    
    return JSON.parse(cleaned)
  }
  
  /**
   * Calculate skill weights based on recency, frequency, and context
   */
  private static calculateSkillWeights(
    skills: any,
    workExperience: any[],
    education: any[]
  ): WeightedSkill[] {
    const skillMap = new Map<string, WeightedSkill>()
    
    // Weight from work experience (highest weight)
    workExperience.forEach((exp, index) => {
      const recencyWeight = 1 - (index * 0.1) // More recent = higher weight
      const durationWeight = Math.min(exp.durationYears / 5, 1) // Cap at 5 years
      
      exp.skills?.forEach((skill: string) => {
        const existing = skillMap.get(skill.toLowerCase())
        if (existing) {
          existing.weight += recencyWeight * durationWeight * 10
          existing.frequency++
          existing.sources.push('work_experience')
          if (!existing.yearsUsed) existing.yearsUsed = 0
          existing.yearsUsed += exp.durationYears
        } else {
          skillMap.set(skill.toLowerCase(), {
            skill,
            weight: recencyWeight * durationWeight * 10,
            sources: ['work_experience'],
            yearsUsed: exp.durationYears,
            lastUsed: exp.isCurrent ? new Date() : new Date(exp.endDate),
            frequency: 1
          })
        }
      })
    })
    
    // Weight from education (medium weight)
    education.forEach(edu => {
      const eduSkills = [edu.field, edu.degree]
      eduSkills.forEach(skill => {
        if (!skill) return
        const existing = skillMap.get(skill.toLowerCase())
        if (existing) {
          existing.weight += 3
          existing.frequency++
          existing.sources.push('education')
        } else {
          skillMap.set(skill.toLowerCase(), {
            skill,
            weight: 3,
            sources: ['education'],
            frequency: 1
          })
        }
      })
    })
    
    // Add technical/soft skills (base weight)
    Object.entries(skills || {}).forEach(([category, skillList]: [string, any]) => {
      (skillList || []).forEach((skill: string) => {
        const existing = skillMap.get(skill.toLowerCase())
        if (existing) {
          existing.weight += 1
          existing.frequency++
        } else {
          skillMap.set(skill.toLowerCase(), {
            skill,
            weight: 1,
            sources: [category as any],
            frequency: 1
          })
        }
      })
    })
    
    // Sort by weight
    return Array.from(skillMap.values())
      .sort((a, b) => b.weight - a.weight)
  }
  
  /**
   * Score work experience by recency
   */
  private static scoreWorkExperience(experiences: any[]): ExtractedWorkExperience[] {
    return experiences.map((exp, index) => {
      const start = new Date(exp.startDate)
      const end = exp.endDate ? new Date(exp.endDate) : new Date()
      const durationYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)
      
      // Recency score: 1.0 for current, decreasing for older roles
      const recencyScore = exp.isCurrent ? 1.0 : Math.max(0.1, 1 - (index * 0.15))
      
      return {
        ...exp,
        startDate: start,
        endDate: exp.endDate ? end : undefined,
        durationYears: Math.round(durationYears * 10) / 10,
        recencyScore
      }
    }).sort((a, b) => b.recencyScore - a.recencyScore)
  }
  
  /**
   * Validate and score location
   */
  private static validateLocation(location: any, workExperience: ExtractedWorkExperience[]): any {
    if (!location) {
      // Try to infer from most recent work experience
      const recentExp = workExperience.find(e => e.location)
      if (recentExp?.location) {
        const match = recentExp.location.match(/([^,]+),\s*([A-Z]{2})/)
        if (match) {
          return {
            city: match[1],
            province: match[2],
            country: 'Canada',
            confidence: 0.6,
            source: 'work_experience'
          }
        }
      }
      return {
        city: 'Unknown',
        province: 'Unknown',
        country: 'Canada',
        confidence: 0.1,
        source: 'inferred'
      }
    }
    
    return {
      ...location,
      confidence: location.confidence || 0.9,
      source: 'header'
    }
  }
  
  /**
   * Score education by relevance to skills
   */
  private static scoreEducation(education: any[], skills: WeightedSkill[]): ExtractedEducation[] {
    return education.map(edu => {
      // Check if education field matches top skills
      const relevantSkills = skills.filter(s => 
        s.skill.toLowerCase().includes(edu.field?.toLowerCase()) ||
        edu.field?.toLowerCase().includes(s.skill.toLowerCase())
      )
      
      const relevanceScore = Math.min(relevantSkills.length / 5, 1)
      
      return {
        ...edu,
        startDate: new Date(edu.startDate),
        endDate: edu.endDate ? new Date(edu.endDate) : undefined,
        relevanceScore
      }
    })
  }
  
  /**
   * Infer target roles from experience
   */
  private static inferTargetRoles(experience: ExtractedWorkExperience[], skills: WeightedSkill[]): string[] {
    const roles = new Set<string>()
    
    // Add current/most recent role
    if (experience[0]) {
      roles.add(experience[0].title)
    }
    
    // Add senior version of current role
    if (experience[0] && !experience[0].title.toLowerCase().includes('senior')) {
      roles.add(`Senior ${experience[0].title}`)
    }
    
    return Array.from(roles)
  }
  
  /**
   * Extract industries from work experience
   */
  private static extractIndustries(experience: ExtractedWorkExperience[]): string[] {
    // This would ideally use a company-to-industry mapping
    // For now, return unique company names
    return [...new Set(experience.map(e => e.company))]
  }
  
  /**
   * Calculate overall extraction quality
   */
  private static calculateExtractionQuality(metrics: {
    hasName: boolean
    hasEmail: boolean
    hasLocation: boolean
    workExpCount: number
    educationCount: number
    skillCount: number
  }): number {
    let score = 0
    
    if (metrics.hasName) score += 0.2
    if (metrics.hasEmail) score += 0.2
    if (metrics.hasLocation) score += 0.2
    if (metrics.workExpCount > 0) score += 0.2
    if (metrics.educationCount > 0) score += 0.1
    if (metrics.skillCount >= 10) score += 0.1
    
    return score
  }
}

export default EnhancedResumeExtractor
