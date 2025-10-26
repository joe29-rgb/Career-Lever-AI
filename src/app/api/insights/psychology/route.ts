import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityService } from '@/lib/perplexity-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobDescription, companySignals } = await request.json()
    if (!jobDescription || typeof jobDescription !== 'string') return NextResponse.json({ error: 'jobDescription required' }, { status: 400 })

    const ppx = new PerplexityService()
    const system = `You are an employer psychology analyst. Return strict JSON only with keys: tone (formal|neutral|casual), formality (0-100), values (3-6 strings), languageGuidance (2-4 strings), bestSendWindows (2-4 strings).`
    const user = `Analyze job and company signals.\nJob Description:\n${jobDescription}\nCompany Signals:\n${companySignals ? JSON.stringify(companySignals) : 'N/A'}`
    const res = await ppx.makeRequest(system, user, { maxTokens: 800, temperature: 0.2 })
    let text = res.content || ''
    if (/```/.test(text)) { const m = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/); if (m && m[0]) text = m[0].replace(/```json|```/g,'').trim() }
    let parsed: any = {}
    try { parsed = JSON.parse(text) } catch { parsed = { tone: 'neutral', formality: 50, values: [], languageGuidance: [], bestSendWindows: [] } }
    return NextResponse.json({ success: true, psychology: parsed })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute psychology' }, { status: 500 })
  }
}


