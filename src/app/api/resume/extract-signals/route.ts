import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

/**
 * ENTERPRISE API: Extract Resume Signals
 * 
 * Extracts keywords, location, and other signals from resume text
 * Used by autopilot job search flow
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { resume } = body

    if (!resume || typeof resume !== 'string' || resume.length < 50) {
      return NextResponse.json(
        { error: 'Invalid resume text provided' },
        { status: 400 }
      )
    }

    console.log('[EXTRACT_SIGNALS] Processing resume, length:', resume.length)

    // ENTERPRISE FIX: extractResumeSignals returns plain object { keywords, location, locations }
    // NOT a wrapped response with .success, .data, .metadata
    let signals
    try {
      signals = await PerplexityIntelligenceService.extractResumeSignals(resume)
    } catch (perplexityError) {
      console.error('[EXTRACT_SIGNALS] Perplexity error:', perplexityError)
      // Return graceful fallback instead of 500 error
      return NextResponse.json({
        success: false,
        keywords: [],
        location: null,
        locations: [],
        error: 'Signal extraction failed',
        details: (perplexityError as Error).message
      })
    }

    if (!signals || !signals.keywords || signals.keywords.length === 0) {
      console.error('[EXTRACT_SIGNALS] No keywords extracted from resume')
      // Return empty but valid response instead of 500 error
      return NextResponse.json({
        success: false,
        keywords: [],
        location: null,
        locations: [],
        error: 'No keywords found',
        details: 'Unable to extract meaningful keywords from resume text'
      })
    }

    console.log('[EXTRACT_SIGNALS] Success:', {
      keywords: signals.keywords.length,
      location: signals.location,
      locations: signals.locations?.length || 0
    })

    return NextResponse.json({
      success: true,
      keywords: signals.keywords,
      location: signals.location || null, // CRITICAL: Never default - let frontend handle missing location
      locations: signals.locations || []
    })

  } catch (error) {
    console.error('[EXTRACT_SIGNALS] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

