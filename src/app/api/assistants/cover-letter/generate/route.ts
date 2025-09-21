import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobTitle, companyName, jobDescription, resumeText, companyData, tone = 'professional', length = 'medium', jobApplicationId } = await request.json()
    if (!jobTitle || !companyName || !jobDescription || !resumeText) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    let mergedCompany = companyData
    try {
      if (jobApplicationId) {
        await connectToDatabase()
        const app = await JobApplication.findOne({ _id: jobApplicationId, userId: (session.user as any).id })
        if (app?.context?.companyData) mergedCompany = { ...(mergedCompany || {}), ...app.context.companyData }
      }
    } catch {}
    const res = await AIService.generateCoverLetter(jobTitle, companyName, jobDescription, resumeText, mergedCompany, tone, length)
    return NextResponse.json({ success: true, coverLetter: res.coverLetter, keyPoints: res.keyPoints, wordCount: res.wordCount })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 })
  }
}


