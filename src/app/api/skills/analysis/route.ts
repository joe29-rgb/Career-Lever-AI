import { NextRequest, NextResponse } from 'next/server'
import { PerplexityService } from '@/lib/perplexity-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.PERPLEXITY_API_KEY) return NextResponse.json({ error: 'AI temporarily unavailable (missing PERPLEXITY_API_KEY)' }, { status: 503 })
    const { resumeText } = await request.json()
    if (!resumeText) return NextResponse.json({ error: 'resumeText required' }, { status: 400 })
    const ppx = new PerplexityService()
    const system = 'You are a skills extraction assistant. Return a JSON array of top skills.'
    const user = `Extract key skills from this resume:\n${resumeText}`
    const out = await ppx.makeRequest(system, user, { maxTokens: 600, temperature: 0.2 })
    let text = out.content || ''
    if (/```/.test(text)) { const m = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/); if (m && m[0]) text = m[0].replace(/```json|```/g,'').trim() }
    let skills: any = []
    try { skills = JSON.parse(text) } catch { skills = [] }
    return NextResponse.json({ success: true, skills })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to analyze skills' }, { status: 500 })
  }
}



