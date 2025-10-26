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
    const { jobTitle, location, frequency = 'daily' } = await req.json()
    await connectToDatabase()
    const prof: any = await Profile.findOne({ userId: (session.user as any).id })
    const prefs = prof?.preferences || {}
    prefs.alerts = { jobTitle, location, frequency }
    await Profile.updateOne({ userId: (session.user as any).id }, { $set: { preferences: prefs } }, { upsert: true })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}


