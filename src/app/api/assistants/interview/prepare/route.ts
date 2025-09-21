import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import JobApplication from '@/models/JobApplication'
import connectToDatabase from '@/lib/mongodb'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobTitle, seniority, resumeHighlights, companyData, focusAreas, numBehavioral, numTechnical, jobApplicationId } = await request.json()
    if (!jobTitle || !seniority || !resumeHighlights) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    let mergedCompany = companyData
    try {
      if (jobApplicationId) {
        await connectToDatabase()
        const app = await JobApplication.findOne({ _id: jobApplicationId, userId: (session.user as any).id })
        if (app?.context?.companyData) mergedCompany = { ...(mergedCompany || {}), ...app.context.companyData }
      }
    } catch {}
    const res = await AIService.generateInterviewCoach(jobTitle, seniority, resumeHighlights, mergedCompany, focusAreas, numBehavioral, numTechnical)
    return NextResponse.json({ success: true, ...res })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to prepare interview content' }, { status: 500 })
  }
}


