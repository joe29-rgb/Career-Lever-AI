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
    const { applicationId, event } = await req.json()
    if (!applicationId || !event) return NextResponse.json({ error: 'applicationId and event required' }, { status: 400 })
    const update: any = {}
    if (event === 'view') update.$inc = { views: 1 }
    if (event === 'interview') update.$inc = { interviews: 1 }
    if (event === 'offer') update.$inc = { offers: 1 }
    const app = await JobApplication.findOneAndUpdate({ _id: applicationId, userId: (session.user as any).id }, update, { new: true })
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    return NextResponse.json({ success: true, application: app })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to record outcome' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const apps = await JobApplication.find({ userId: (session.user as any).id }).lean()
    const summary = {
      total: apps.length,
      views: apps.reduce((a,b)=> a + (b.views || 0), 0),
      interviews: apps.reduce((a,b)=> a + (b.interviews || 0), 0),
      offers: apps.reduce((a,b)=> a + (b.offers || 0), 0),
    }
    return NextResponse.json({ success: true, summary })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to summarize outcomes' }, { status: 500 })
  }
}


