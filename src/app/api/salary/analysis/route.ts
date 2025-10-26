import { NextRequest, NextResponse } from 'next/server'
import { PerplexityService } from '@/lib/perplexity-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { jobTitle, companyName, location } = await request.json()
    if (!jobTitle || !companyName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const ppx = new PerplexityService()
    const system = 'You are a compensation research specialist. Provide a concise, up-to-date salary analysis with sources where possible.'
    const prompt = `Salary analysis for ${jobTitle} at ${companyName} in ${location || 'N/A'}.`
    const out = await ppx.makeRequest(system, prompt, { maxTokens: 900, temperature: 0.2 })
    return NextResponse.json({ success: true, analysis: (out.content || '').trim() })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to analyze salary' }, { status: 500 })
  }
}
