import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProfileExtractionService } from '@/lib/profile-extraction'
import { isRateLimited } from '@/lib/rate-limit'
import Resume from '@/models/Resume'
import { dbService } from '@/lib/database'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * PHASE 1B: Smart Profile Extraction API
 * Extracts salary expectations, work type, commute radius, and preferences from resume
 */
export async function POST(request: NextRequest) {
  try {
    await dbService.connect()
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Rate limiting
    if (await isRateLimited(session.user.id, 'extract-profile')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    const body = await request.json()
    const { resumeText: inputResumeText, resumeId } = body
    
    let resumeText = inputResumeText
    
    // If resumeText not provided, try to load from DB
    if (!resumeText || resumeText.length < 100) {
      if (resumeId) {
        const resumeDoc = await Resume.findOne({ _id: resumeId, userId: session.user.id }).lean()
        resumeText = (resumeDoc as any)?.extractedText
      } else {
        // Load most recent resume
        const resumeDoc = await Resume.findOne({ userId: session.user.id })
          .sort({ createdAt: -1 })
          .lean()
        resumeText = (resumeDoc as any)?.extractedText
      }
    }
    
    if (!resumeText || resumeText.length < 100) {
      return NextResponse.json(
        { error: 'Resume text is required and must be at least 100 characters.' },
        { status: 400 }
      )
    }
    
    console.log('[EXTRACT_PROFILE] Starting extraction for user:', session.user.id)
    
    // Extract complete profile using Perplexity
    const profile = await ProfileExtractionService.extractCompleteProfile(resumeText)
    
    console.log('[EXTRACT_PROFILE] Extraction complete:', {
      location: profile.location,
      experience: profile.experience_years,
      salary: `${profile.salary_currency} ${profile.salary_min}-${profile.salary_max}`,
      work_type: profile.work_type,
      seniority: profile.seniority_level,
      confidence: profile.skill_confidence
    })
    
    return NextResponse.json({
      success: true,
      profile,
      message: `Profile extracted: ${profile.seniority_level} level, ${profile.experience_years} years experience`
    })
    
  } catch (error) {
    console.error('[EXTRACT_PROFILE] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract profile.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

