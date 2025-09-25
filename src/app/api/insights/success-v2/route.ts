import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobDescription, resumeText, jobUrl, applicantsEstimate, urgencyHint, companyData } = await req.json()
    if (!jobDescription || !resumeText) return NextResponse.json({ error: 'jobDescription and resumeText required' }, { status: 400 })
    const result = await AIService.successPredictorV2({ jobDescription, resumeText, jobUrl, applicantsEstimate, urgencyHint, companyData })
    return NextResponse.json({ success: true, success: result })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute success v2' }, { status: 500 })
  }
}


