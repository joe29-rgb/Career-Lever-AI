import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { extractKeywords } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function estimateApplicants(jobDescription: string, source?: string) {
  const len = jobDescription.length
  let base = Math.min(500, Math.max(20, Math.floor(len / 60)))
  if (source?.includes('linkedin')) base *= 1.2
  if (source?.includes('indeed')) base *= 1.1
  return Math.round(base)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobDescription, jobUrl, resumeText } = await request.json()
    if (!jobDescription || typeof jobDescription !== 'string') return NextResponse.json({ error: 'jobDescription required' }, { status: 400 })

    const source = jobUrl ? new URL(jobUrl).hostname.replace('www.','') : ''
    const applicants = estimateApplicants(jobDescription, source)
    const keywords = extractKeywords(jobDescription)
    const urgency = Math.min(100, Math.round((applicants / 5) + (keywords.length / 3)))
    const band = applicants < 60 ? 'low' : applicants < 160 ? 'medium' : 'high'

    // Resume-aware differentiation suggestions
    const diffs: string[] = []
    const top = keywords.slice(0, 10)
    if (resumeText && typeof resumeText === 'string' && resumeText.length > 50) {
      for (const k of top) {
        const has = resumeText.toLowerCase().includes(k.toLowerCase())
        diffs.push(has ? `Elevate ${k} with a quantified bullet where impact >10% or $50k+` : `Add a specific achievement demonstrating ${k} with metrics and timeframe`)
      }
    } else {
      for (const k of top) diffs.push(`Provide a quantified example demonstrating ${k}`)
    }

    return NextResponse.json({ success: true, competition: { applicantsEstimate: applicants, competitionBand: band, urgency, differentiation: diffs } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute competition' }, { status: 500 })
  }
}


