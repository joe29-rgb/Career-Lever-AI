import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityService } from '@/lib/perplexity-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobTitle, companyData, jobDescription } = await request.json()
    if (!jobTitle || (!companyData && !jobDescription)) return NextResponse.json({ error: 'jobTitle and companyData or jobDescription required' }, { status: 400 })
    const ppx = new PerplexityService()
    const system = `You are a company pain-points analyst. Return strict JSON only with keys: companyPainPoints (3-6), rolePainPoints (3-6), solutionAngles (4-8), quantIdeas (3-5).`
    const user = `Role: ${jobTitle}\nCompany Data: ${companyData ? JSON.stringify(companyData) : 'N/A'}\nJob Description: ${jobDescription || 'N/A'}`
    const out = await ppx.makeRequest(system, user, { maxTokens: 900, temperature: 0.2 })
    let text = out.content || ''
    if (/```/.test(text)) { const m = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/); if (m && m[0]) text = m[0].replace(/```json|```/g,'').trim() }
    let parsed: any = {}
    try { parsed = JSON.parse(text) } catch { parsed = { companyPainPoints: [], rolePainPoints: [], solutionAngles: [], quantIdeas: [] } }
    return NextResponse.json({ success: true, painpoints: parsed })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute pain points' }, { status: 500 })
  }
}


