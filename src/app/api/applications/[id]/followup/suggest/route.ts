import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import { AIService } from '@/lib/ai-service'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectToDatabase()
    const app: any = await JobApplication.findOne({ _id: params.id, userId: (session.user as any).id }).lean()
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    // Simple suggestion logic: next weekdays (3, 7, 14 days)
    const base = new Date()
    const nextDates = [3, 7, 14].map(d => {
      const dt = new Date(base.getTime() + d * 24 * 60 * 60 * 1000)
      const day = dt.getDay()
      if (day === 0) dt.setDate(dt.getDate() + 1) // Sunday -> Monday
      if (day === 6) dt.setDate(dt.getDate() + 2) // Saturday -> Monday
      return dt
    })

    // Email body via AI helper (reuse Follow-up generation)
    const email = await AIService.generateFollowUpEmail(
      app.jobTitle,
      app.companyName,
      Math.max(3, Math.ceil((Date.now() - new Date(app.createdAt).getTime()) / (24*60*60*1000))),
      ['Submitted resume and cover letter', 'Strong fit on key requirements'],
      (app.analysis?.companyCulture || [])
    )

    return NextResponse.json({ success: true, dates: nextDates, email })
  } catch (e) {
    console.error('Follow-up suggest error:', e)
    return NextResponse.json({ error: 'Failed to generate follow-up suggestions' }, { status: 500 })
  }
}


