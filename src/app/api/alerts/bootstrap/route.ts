import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Profile from '@/models/Profile'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const prof: any = await Profile.findOne({ userId: (session.user as any).id })
    const prefs = prof?.preferences || {}
    const current = prefs.alerts || {}
    const jobTitle = current.jobTitle || 'Software Engineer'
    const location = current.location || prof?.location || 'Remote'
    prefs.alerts = { jobTitle, location, frequency: 'daily' }
    await Profile.updateOne({ userId: (session.user as any).id }, { $set: { preferences: prefs } }, { upsert: true })
    return NextResponse.json({ success: true, alerts: prefs.alerts })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to bootstrap alerts' }, { status: 500 })
  }
}


