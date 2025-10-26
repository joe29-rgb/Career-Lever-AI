import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityService } from '@/lib/perplexity-service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.PERPLEXITY_API_KEY) return NextResponse.json({ error: 'AI temporarily unavailable (missing PERPLEXITY_API_KEY)' }, { status: 503 })
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobDescription, resumeText, jobUrl, applicantsEstimate, urgencyHint, companyData } = await req.json()
    if (!jobDescription || !resumeText) return NextResponse.json({ error: 'jobDescription and resumeText required' }, { status: 400 })
    const ppx = new PerplexityService()
    const system = 'You are an application success evaluator. Return JSON: score (0-100), reasons[], riskFactors[], improvements[], timing?, competition?'
    const user = `Evaluate success probability.\nJob Description:\n${jobDescription}\nResume:\n${resumeText}\nHints:\n${JSON.stringify({ jobUrl, applicantsEstimate, urgencyHint, companyData })}`
    const out = await ppx.makeRequest(system, user, { maxTokens: 900, temperature: 0.2 })
    let text = out.content || ''
    if (/```/.test(text)) { const m = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/); if (m && m[0]) text = m[0].replace(/```json|```/g,'').trim() }
    let parsed: any = {}
    try { parsed = JSON.parse(text) } catch { parsed = { score: 50, reasons: [], riskFactors: [], improvements: [] } }
    return NextResponse.json({ success: true, result: parsed })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute success v2' }, { status: 500 })
  }
}


