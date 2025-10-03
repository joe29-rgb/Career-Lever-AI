import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Resume from '@/models/Resume'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
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


