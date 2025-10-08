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

    const { job, resume }: AnalysisRequest = await request.json()

    // Simple keyword-based analysis (can be enhanced with AI later)
    const analysis = await analyzeJobMatch(job, resume)

    return NextResponse.json({
      success: true,
      analysis
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
  // Extract keywords from resume
  const resumeLower = resume.toLowerCase()
  const jobDescLower = job.description.toLowerCase()
  
  // Common tech skills to check
  const allSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
    'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Git',
    'CSS', 'HTML', 'REST', 'GraphQL', 'Redux', 'Next.js',
    'Vue', 'Angular', 'C++', 'C#', '.NET', 'PHP',
    ...(job.skills || [])
  ]
  
  const matchingSkills: string[] = []
  const missingSkills: string[] = []
  
  for (const skill of allSkills) {
    const skillLower = skill.toLowerCase()
    const inResume = resumeLower.includes(skillLower)
    const inJob = jobDescLower.includes(skillLower) || job.skills?.some((s: string) => s.toLowerCase().includes(skillLower))
    
    if (inJob) {
      if (inResume) {
        matchingSkills.push(skill)
      } else {
        missingSkills.push(skill)
      }
    }
  }
  
  // Calculate match score
  const totalRelevantSkills = matchingSkills.length + missingSkills.length
  const matchScore = totalRelevantSkills > 0
    ? Math.round((matchingSkills.length / totalRelevantSkills) * 100)
    : 70
  
  // Determine fit level
  let estimatedFit: 'excellent' | 'good' | 'fair' | 'poor'
  if (matchScore >= 85) estimatedFit = 'excellent'
  else if (matchScore >= 70) estimatedFit = 'good'
  else if (matchScore >= 50) estimatedFit = 'fair'
  else estimatedFit = 'poor'
  
  // Generate recommendations
  const recommendations: string[] = []
  
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
  recommendations.push('Research the company culture and values')
  
  return {
    matchScore,
    matchingSkills: matchingSkills.slice(0, 10),
    missingSkills: missingSkills.slice(0, 5),
    recommendations: recommendations.slice(0, 5),
    estimatedFit
  }
}

