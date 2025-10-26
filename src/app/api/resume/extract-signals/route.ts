import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { LocalResumeParser } from '@/lib/local-resume-parser'

/**
 * ENTERPRISE API: Extract Resume Signals
 * 
 * Extracts keywords, location, and other signals from resume text
 * Used by autopilot job search flow
 * 
 * STRATEGY:
 * 1. Try Perplexity AI first (best quality)
 * 2. If Perplexity fails (out of credits, timeout, etc.), use local parser
 * 3. Local parser handles industry weighting, education weighting, and skill ranking
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

    // Try Perplexity AI first
    let signals
    let usedFallback = false
    
    try {
      console.log('[EXTRACT_SIGNALS] Attempting Perplexity extraction...')
      signals = await PerplexityIntelligenceService.extractResumeSignals(resume)
      console.log('[EXTRACT_SIGNALS] ✅ Perplexity success')
    } catch (perplexityError) {
      console.warn('[EXTRACT_SIGNALS] Perplexity failed, using local parser fallback:', (perplexityError as Error).message)
      
      // FALLBACK: Use local parser
      const parsed = LocalResumeParser.parse(resume, 50)
      signals = {
        keywords: parsed.keywords,
        location: parsed.location || undefined,
        locations: parsed.locations
      }
      usedFallback = true
      console.log('[EXTRACT_SIGNALS] ✅ Local parser success:', {
        keywords: signals.keywords.length,
        location: signals.location,
        industries: parsed.industries,
        experienceYears: parsed.experienceYears
      })
    }

    if (!signals || !signals.keywords || signals.keywords.length === 0) {
      console.error('[EXTRACT_SIGNALS] No keywords extracted from resume')
      return NextResponse.json(
        { error: 'Failed to extract resume signals', details: 'No keywords found in resume text' },
        { status: 500 }
      )
    }

    console.log('[EXTRACT_SIGNALS] Success:', {
      keywords: signals.keywords.length,
      location: signals.location,
      locations: signals.locations?.length || 0,
      method: usedFallback ? 'local-parser' : 'perplexity'
    })

    return NextResponse.json({
      success: true,
      keywords: signals.keywords,
      location: signals.location || null, // CRITICAL: Never default - let frontend handle missing location
      locations: signals.locations || [],
      method: usedFallback ? 'local-parser' : 'perplexity' // Let frontend know which method was used
    })

  } catch (error) {
    console.error('[EXTRACT_SIGNALS] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

