import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import Resume from '@/models/Resume'
import { AIService } from '@/lib/ai-service'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const app: any = await JobApplication.findOne({ _id: params.id, userId: (session.user as any).id }).lean()
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const resume: any = await Resume.findOne({ userId: (session.user as any).id }).sort({ createdAt: -1 }).lean()
    const resumeText = (resume && typeof (resume as any).extractedText === 'string') ? (resume as any).extractedText : ''
    const companyData = app.companyResearch || {}
    const result = await AIService.scoreApplication(app.jobDescription || '', resumeText, companyData)
    return NextResponse.json({ success: true, score: result })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to score application' }, { status: 500 })
  }
}


