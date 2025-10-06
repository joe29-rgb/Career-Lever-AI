import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import Resume from '@/models/Resume'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

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
    // Provide header location hint if present to guide PPX
    const headerMatch = txt.split(/\n|\r/).slice(0, 40).join(' ').match(/([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*),\s*(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)/)
    const hint = headerMatch && headerMatch[0] ? headerMatch[0] : undefined
    // Debug: log resume snippet being sent
    try {
      console.log('[signals:input]', { len: txt.length, preview: txt.slice(0, 500) })
    } catch {}
    const started = Date.now()
    const signals = await PerplexityIntelligenceService.extractResumeSignals(txt, 50, hint)
    const durationMs = Date.now() - started
    // Basic verification logging (best-effort, do not block)
    try {
      console.log('[signals]', {
        userId: (session.user as any).id,
        durationMs,
        keywordCount: (signals.keywords || []).length,
        primaryLocation: signals.location || null,
        hasLocationsList: Array.isArray(signals.locations),
      })
    } catch {}
    return NextResponse.json({ success: true, keywords: signals.keywords || [], location: signals.location || null, locations: signals.locations || [] })
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

    const signals = await PerplexityIntelligenceService.extractResumeSignals(
      body.resumeText,
      body.maxKeywords || 50,
      body.locationHint
    )

    console.log('[API] Extraction successful:', signals)

    return NextResponse.json({
      success: true,
      keywords: signals.keywords,
      location: signals.location,
      metadata: {
        keywordCount: signals.keywords.length,
        primaryLocation: signals.location,
        extractedAt: new Date().toISOString()
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


