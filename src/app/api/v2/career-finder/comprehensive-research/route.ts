import { NextRequest, NextResponse } from 'next/server'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

/**
 * 🚀 ONE-SHOT COMPREHENSIVE RESEARCH ENDPOINT
 * Replaces multiple separate API calls with a single comprehensive research request
 * This dramatically reduces API costs and improves user experience
 * 
 * Called once when user selects a job, data is cached for all subsequent pages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobTitle, company, jobDescription, location, resumeText, resumeSkills } = body

    // Validation
    if (!jobTitle || !company || !resumeText) {
      return NextResponse.json(
        { error: 'Missing required fields: jobTitle, company, resumeText' },
        { status: 400 }
      )
    }

    console.log('[COMPREHENSIVE_RESEARCH_API] Starting research for:', { 
      jobTitle, 
      company, 
      location,
      resumeLength: resumeText.length,
      skillsCount: resumeSkills?.length || 0
    })

    // Make single comprehensive Perplexity call
    const result = await PerplexityIntelligenceService.comprehensiveJobResearch({
      jobTitle,
      company,
      jobDescription: jobDescription || '',
      location,
      resumeText,
      resumeSkills
    })

    if (!result.success) {
      console.error('[COMPREHENSIVE_RESEARCH_API] Research failed:', result.metadata.error)
      return NextResponse.json(
        { error: 'Research failed', details: result.metadata.error },
        { status: 500 }
      )
    }

    console.log('[COMPREHENSIVE_RESEARCH_API] ✅ Research complete:', {
      duration: result.metadata.duration,
      matchScore: result.data.jobAnalysis.matchScore,
      contactsFound: result.data.hiringContacts.length,
      newsArticles: result.data.news.length,
      reviews: result.data.reviews.length,
      confidence: result.data.confidenceLevel
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        duration: result.metadata.duration,
        timestamp: result.metadata.timestamp,
        requestId: result.metadata.requestId
      }
    })
  } catch (error) {
    console.error('[COMPREHENSIVE_RESEARCH_API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

