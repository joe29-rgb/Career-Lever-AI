import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobTitle, seniority, resumeHighlights, companyData, focusAreas, numBehavioral, numTechnical } = await request.json()
    if (!jobTitle || !seniority || !resumeHighlights) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const res = await AIService.generateInterviewCoach(jobTitle, seniority, resumeHighlights, companyData, focusAreas, numBehavioral, numTechnical)
    return NextResponse.json({ success: true, ...res })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to prepare interview content' }, { status: 500 })
  }
}


