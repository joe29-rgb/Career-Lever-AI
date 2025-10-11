import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import Resume from '@/models/Resume'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { LocalResumeParser } from '@/lib/local-resume-parser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await dbService.connect()
    const resumeDoc = await Resume.findOne({ userId: (session.user as any).id }).sort({ createdAt: -1 }).lean<import('@/models/Resume').IResume>().exec()
    const txt = (resumeDoc && typeof (resumeDoc as any).extractedText === 'string') ? (resumeDoc as any).extractedText : ''
    if (!txt || txt.length < 30) {
      return NextResponse.json({ success: true, keywords: [], location: null, locations: [] })
    }
    // Debug: log resume snippet being sent
    try {
      console.log('[signals:input]', { len: txt.length, preview: txt.slice(0, 500) })
    } catch {}
    
    const started = Date.now()
    let signals
    let method = 'perplexity'
    
    // Try Perplexity first, fallback to local parser
    try {
      signals = await PerplexityIntelligenceService.extractResumeSignals(txt, 50)
    } catch (perplexityError) {
      console.warn('[signals] Perplexity failed, using local parser:', (perplexityError as Error).message)
      const parsed = LocalResumeParser.parse(txt, 50)
      signals = {
        keywords: parsed.keywords,
        location: parsed.location || undefined,
        locations: parsed.locations
      }
      method = 'local-parser'
    }
    
    const durationMs = Date.now() - started
    // Basic verification logging (best-effort, do not block)
    try {
      console.log('[signals]', {
        userId: (session.user as any).id,
        durationMs,
        method,
        keywordCount: (signals.keywords || []).length,
        primaryLocation: signals.location || null,
        hasLocationsList: Array.isArray(signals.locations),
      })
    } catch {}
    return NextResponse.json({ success: true, keywords: signals.keywords || [], location: signals.location || null, locations: signals.locations || [], method })
  } catch (e) {
    return NextResponse.json({ success: true, keywords: [], location: null, locations: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    if (!body.resumeText || typeof body.resumeText !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid resumeText field' },
        { status: 400 }
      )
    }

    if (body.resumeText.length < 50) {
      return NextResponse.json(
        { error: 'Resume text too short (minimum 50 characters)' },
        { status: 400 }
      )
    }

    console.log('[API] Processing resume signals request')
    console.log('[API] Resume length:', body.resumeText.length)

    let signals
    let method = 'perplexity'
    
    // Try Perplexity first, fallback to local parser
    try {
      signals = await PerplexityIntelligenceService.extractResumeSignals(
        body.resumeText,
        body.maxKeywords || 50
      )
    } catch (perplexityError) {
      console.warn('[API] Perplexity failed, using local parser:', (perplexityError as Error).message)
      const parsed = LocalResumeParser.parse(body.resumeText, body.maxKeywords || 50)
      signals = {
        keywords: parsed.keywords,
        location: parsed.location || undefined,
        locations: parsed.locations
      }
      method = 'local-parser'
    }

    console.log('[API] Extraction successful:', { method, keywordCount: signals.keywords.length })

    return NextResponse.json({
      success: true,
      keywords: signals.keywords,
      location: signals.location,
      method,
      metadata: {
        keywordCount: signals.keywords.length,
        primaryLocation: signals.location,
        extractedAt: new Date().toISOString(),
        method
      }
    })

  } catch (error) {
    console.error('[API] Signals extraction error:', error)
    return NextResponse.json(
      { error: 'Signal extraction failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}


