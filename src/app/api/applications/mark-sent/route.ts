import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const body = await req.json().catch(()=>({})) as any
    const jobTitle = (body?.jobTitle || '').toString().slice(0, 200)
    const companyName = (body?.companyName || '').toString().slice(0, 200)
    const jobDescription = (body?.jobDescription || '').toString().slice(0, 20000)
    const jobUrl = typeof body?.jobUrl === 'string' ? body.jobUrl : undefined
    if (!jobTitle || !companyName) return NextResponse.json({ error: 'jobTitle and companyName required' }, { status: 400 })

    const application = new JobApplication({
      userId: (session.user as any).id,
      jobTitle,
      companyName,
      jobDescription,
      jobUrl,
      applicationStatus: 'applied',
      appliedDate: new Date(),
      followUpDates: [],
      notes: 'Marked as sent via Career Finder outreach'
    })
    await application.save()

    return NextResponse.json({ success: true, applicationId: application._id })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to mark sent' }, { status: 500 })
  }
}


