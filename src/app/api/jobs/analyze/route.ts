/**
 * Job Analysis API
 * Analyzes job match with user's resume
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface AnalysisRequest {
  job: {
    title: string
    company: string
    description: string
    skills?: string[]
  }
  resume: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // CRITICAL FIX: Input validation with 400 responses (Perplexity recommendation)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const { jobTitle, company, jobDescription, resumeText } = body
    
    if (!jobTitle || typeof jobTitle !== 'string') {
      return NextResponse.json(
        { error: 'jobTitle is required and must be a string' },
        { status: 400 }
      )
    }
    
    if (!company || typeof company !== 'string') {
      return NextResponse.json(
        { error: 'company is required and must be a string' },
        { status: 400 }
      )
    }
    
    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: 'resumeText is required and must be a string' },
        { status: 400 }
      )
    }

    // Build job object safely
    const job = {
      title: jobTitle,
      company,
      description: jobDescription || '',
      summary: jobDescription || '',
      skills: Array.isArray(body.skills) ? body.skills : []
    }

    // Simple keyword-based analysis (can be enhanced with AI later)
    const analysis = await analyzeJobMatch(job, resumeText)

    return NextResponse.json({
      success: true,
      ...analysis
    })
  } catch (error: any) {
    console.error('[API] Job analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    )
  }
}

async function analyzeJobMatch(job: any, resume: string) {
  // ENTERPRISE FIX: Validate inputs with proper defaults
  const resumeLower = (resume || '').toLowerCase()
  const jobDescLower = (job?.description || job?.summary || '').toLowerCase()

  // Early return if no valid data
  if (!resumeLower || !jobDescLower) {
    console.warn('[ANALYSIS] Insufficient data for analysis:', { hasResume: !!resume, hasJobDesc: !!(job?.description || job?.summary) })
    return {
      matchScore: 50,
      matchingSkills: [],
      missingSkills: [],
      recommendations: ['Upload your resume for detailed matching'],
      estimatedFit: 'fair' as const
    }
  }
  
  // ENTERPRISE FEATURE: Extract years of experience from resume
  const experienceYears = extractTotalExperience(resume)
  const educationLevel = extractEducationLevel(resume)
  
  console.log('[ANALYSIS] Experience weighting:', { experienceYears, educationLevel })
  
  // Common tech skills to check
  const coreSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
    'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Git',
    'CSS', 'HTML', 'REST', 'GraphQL', 'Redux', 'Next.js',
    'Vue', 'Angular', 'C++', 'C#', '.NET', 'PHP',
    // Add sales/business skills
    'Sales', 'Business Development', 'Account Management', 'CRM',
    'Salesforce', 'HubSpot', 'Lead Generation', 'Negotiation',
    'Customer Success', 'B2B', 'B2C', 'SaaS'
  ]
  
  // CRITICAL FIX: Safely merge job skills, ensuring they're all strings
  const jobSkills = Array.isArray(job.skills) 
    ? job.skills.filter((s: any) => typeof s === 'string' && s.trim().length > 0)
    : []
  
  const allSkills = [...coreSkills, ...jobSkills]
  
  const matchingSkills: string[] = []
  const missingSkills: string[] = []
  
  for (const skill of allSkills) {
    // CRITICAL FIX: Ensure skill is a string before calling toLowerCase
    if (typeof skill !== 'string') continue
    
    const skillLower = skill.toLowerCase()
    const inResume = resumeLower.includes(skillLower)
    const inJob = jobDescLower.includes(skillLower) || jobSkills.some((s: string) => s.toLowerCase().includes(skillLower))
    
    if (inJob) {
      if (inResume) {
        matchingSkills.push(skill)
      } else {
        missingSkills.push(skill)
      }
    }
  }
  
  // ENTERPRISE FEATURE: Calculate experience-weighted match score
  let baseScore = 0
  const totalRelevantSkills = matchingSkills.length + missingSkills.length
  
  if (totalRelevantSkills > 0) {
    baseScore = (matchingSkills.length / totalRelevantSkills) * 100
  } else {
    baseScore = 50 // neutral if no skills detected
  }
  
  // Apply experience multiplier (15 years = higher weight)
  let experienceMultiplier = 1.0
  if (experienceYears >= 15) {
    experienceMultiplier = 1.25 // 25% boost for 15+ years
  } else if (experienceYears >= 10) {
    experienceMultiplier = 1.15 // 15% boost for 10+ years
  } else if (experienceYears >= 5) {
    experienceMultiplier = 1.10 // 10% boost for 5+ years
  } else if (experienceYears <= 1) {
    experienceMultiplier = 0.85 // 15% penalty for entry-level
  }
  
  // Apply education multiplier
  let educationMultiplier = 1.0
  if (educationLevel === 'PhD' || educationLevel === 'Masters') {
    educationMultiplier = 1.10 // 10% boost for advanced degree
  } else if (educationLevel === 'Bachelors') {
    educationMultiplier = 1.05 // 5% boost for bachelor's
  }
  
  // Calculate final weighted score
  let matchScore = Math.round(baseScore * experienceMultiplier * educationMultiplier)
  matchScore = Math.min(matchScore, 100) // Cap at 100
  
  console.log('[ANALYSIS] Score calculation:', { 
    baseScore, 
    experienceMultiplier, 
    educationMultiplier, 
    finalScore: matchScore 
  })
  
  // Determine fit level
  let estimatedFit: 'excellent' | 'good' | 'fair' | 'poor'
  if (matchScore >= 85) estimatedFit = 'excellent'
  else if (matchScore >= 70) estimatedFit = 'good'
  else if (matchScore >= 50) estimatedFit = 'fair'
  else estimatedFit = 'poor'
  
  // Generate experience-aware recommendations
  const recommendations: string[] = []
  
  if (experienceYears >= 15) {
    recommendations.push(`Leverage your ${experienceYears}+ years of experience as a senior professional`)
  } else if (experienceYears >= 5) {
    recommendations.push(`Emphasize your ${experienceYears} years of proven industry experience`)
  } else if (experienceYears <= 1) {
    recommendations.push(`Highlight your education, projects, and eagerness to learn`)
  }
  
  if (matchingSkills.length > 0) {
    recommendations.push(`Highlight your experience with: ${matchingSkills.slice(0, 3).join(', ')}`)
  }
  
  if (missingSkills.length > 0 && missingSkills.length <= 3) {
    recommendations.push(`Consider learning: ${missingSkills.join(', ')}`)
  }
  
  if (matchScore >= 70) {
    recommendations.push('You have strong qualifications for this role')
  } else {
    recommendations.push('Emphasize transferable skills and willingness to learn')
  }
  
  recommendations.push('Tailor your resume to match the job description')
  
  return {
    matchScore,
    matchingSkills: matchingSkills.slice(0, 10),
    missingSkills: missingSkills.slice(0, 5),
    recommendations: recommendations.slice(0, 5),
    estimatedFit
  }
}

// ENTERPRISE HELPER: Extract total years of experience from resume
function extractTotalExperience(resume: string): number {
  const text = resume.toLowerCase()
  
  // Look for explicit "X years of experience" statements
  const explicitMatch = text.match(/(\d+)[\s\-+]*(?:years?|yrs?)[\s\-+]*(?:of\s+)?experience/i)
  if (explicitMatch) {
    return parseInt(explicitMatch[1])
  }
  
  // Calculate from date ranges (YYYY - YYYY or Month YYYY - Month YYYY)
  const dateRangePattern = /(\d{4})\s*[-–—]\s*(\d{4}|present|current)/gi
  const matches = Array.from(text.matchAll(dateRangePattern))
  
  let totalYears = 0
  for (const match of matches) {
    const startYear = parseInt(match[1])
    const endYear = match[2].match(/\d{4}/) ? parseInt(match[2]) : new Date().getFullYear()
    totalYears += (endYear - startYear)
  }
  
  // If we found date ranges, use that
  if (totalYears > 0) {
    return Math.min(totalYears, 50) // cap at 50 years
  }
  
  // Fallback: estimate from education (assume 4 years post-grad work if bachelor's mentioned)
  if (text.includes('bachelor') || text.includes('b.s.') || text.includes('b.a.')) {
    return 4 // assume mid-level
  }
  
  // Default to entry-level
  return 1
}

// ENTERPRISE HELPER: Extract education level from resume
function extractEducationLevel(resume: string): 'PhD' | 'Masters' | 'Bachelors' | 'Associate' | 'HighSchool' | 'None' {
  const text = resume.toLowerCase()
  
  if (text.match(/ph\.?d|doctorate|doctoral/i)) {
    return 'PhD'
  }
  if (text.match(/master|m\.s\.|m\.a\.|mba|m\.eng/i)) {
    return 'Masters'
  }
  if (text.match(/bachelor|b\.s\.|b\.a\.|b\.eng|undergraduate degree/i)) {
    return 'Bachelors'
  }
  if (text.match(/associate|a\.s\.|a\.a\./i)) {
    return 'Associate'
  }
  if (text.match(/high school|secondary school|diploma/i)) {
    return 'HighSchool'
  }
  
  return 'None'
}

