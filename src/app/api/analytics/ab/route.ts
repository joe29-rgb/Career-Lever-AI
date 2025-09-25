import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import ABEvent from '@/models/ABEvent'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const { applicationId, resumeId, variant, action, meta } = await req.json()
    await ABEvent.create({ userId: (session.user as any).id, applicationId, resumeId, variant, action, meta })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const url = new URL(req.url)
    const applicationId = url.searchParams.get('applicationId')
    const match: any = { userId: (session.user as any).id }
    if (applicationId) match.applicationId = applicationId
    const events = await ABEvent.find(match).sort({ createdAt: -1 }).limit(500)
    const summary = {
      views: events.filter(e => e.action === 'view').length,
      selects: events.filter(e => e.action === 'select').length,
      downloads: events.filter(e => e.action === 'download').length,
      submits: events.filter(e => e.action === 'submit').length,
      interviews: events.filter(e => e.action === 'interview').length,
      offers: events.filter(e => e.action === 'offer').length,
    }
    return NextResponse.json({ success: true, events, summary })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}


