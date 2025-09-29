import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityService } from '@/lib/perplexity-service'
import { JOB_ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompts/perplexity'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json({ error: 'AI temporarily unavailable (missing PERPLEXITY_API_KEY)' }, { status: 503 })
    }
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobDescription } = await request.json()
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.length < 20) {
      return NextResponse.json({ error: 'jobDescription required' }, { status: 400 })
    }
    try {
      const ppx = new PerplexityService()
      const result = await ppx.makeRequest(JOB_ANALYSIS_SYSTEM_PROMPT, `Analyze this job posting and produce strict JSON.\n\n${jobDescription}`, { maxTokens: 1400, temperature: 0.2 })
      let text = result.content || ''
      if (/```/.test(text)) { const m = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/); if (m && m[0]) text = m[0].replace(/```json|```/g,'').trim() }
      const analysis = JSON.parse(text)
      return NextResponse.json({ success: true, analysis })
    } catch (e: any) {
      // Graceful fallback like primary endpoint
      const minimal = {
        jobTitle: 'Unknown Position',
        companyName: 'Unknown Company',
        keyRequirements: [],
        preferredSkills: [],
        responsibilities: [],
        companyCulture: [],
        experienceLevel: 'unknown',
        educationRequirements: [],
        remoteWorkPolicy: 'unknown',
        salaryRange: 'unknown',
      }
      return NextResponse.json({ success: true, analysis: minimal })
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to analyze job' }, { status: 500 })
  }
}


