import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobTitle, companyData, jobDescription } = await request.json()
    if (!jobTitle || (!companyData && !jobDescription)) return NextResponse.json({ error: 'jobTitle and companyData or jobDescription required' }, { status: 400 })
    const content = `Given the role "${jobTitle}", and the following inputs, list concise bullet points for: companyPainPoints (3-6), rolePainPoints (3-6), solutionAngles (4-8), quantIdeas (3-5). Return strict JSON with those keys only.
Company Data: ${companyData ? JSON.stringify(companyData) : 'N/A'}
Job Description: ${jobDescription || 'N/A'}`
    const out = await AIService.generateText(content)
    let parsed: any = {}
    try { parsed = JSON.parse(out) } catch { parsed = { companyPainPoints: [], rolePainPoints: [], solutionAngles: [], quantIdeas: [] } }
    return NextResponse.json({ success: true, painpoints: parsed })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute pain points' }, { status: 500 })
  }
}


