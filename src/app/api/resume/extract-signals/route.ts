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

    // Extract signals using Perplexity Intelligence
    const signals = await PerplexityIntelligenceService.extractResumeSignals(resume)

    if (!signals.success) {
      console.error('[EXTRACT_SIGNALS] Extraction failed:', signals.metadata?.error)
      return NextResponse.json(
        { error: 'Failed to extract resume signals', details: signals.metadata?.error },
        { status: 500 }
      )
    }

    console.log('[EXTRACT_SIGNALS] Success:', {
      keywords: signals.data.keywords?.length,
      locations: signals.data.locations?.length
    })

    return NextResponse.json({
      success: true,
      keywords: signals.data.keywords || [],
      location: signals.data.location || 'Toronto, ON',
      locations: signals.data.locations || [],
      cached: signals.cached || false
    })

  } catch (error) {
    console.error('[EXTRACT_SIGNALS] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

