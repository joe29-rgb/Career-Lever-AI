import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Profile from '@/models/Profile'
import Counter from '@/models/Counter'

export const dynamic = 'force-dynamic'

async function nextUserNo(): Promise<number> {
  const ctr = await Counter.findOneAndUpdate(
    { key: 'userNo' },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  )
  return ctr.value
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    let prof: any = await Profile.findOne({ userId: (session.user as any).id })
    if (!prof) {
      const userNo = await nextUserNo()
      prof = await Profile.create({ userId: (session.user as any).id, userNo, plan: 'free' })
    }
    return NextResponse.json({ success: true, profile: prof })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const body = await request.json()
    const update: any = {}
    if (typeof body.title === 'string') update.title = body.title
    if (typeof body.location === 'string') update.location = body.location
    if (body.preferences && typeof body.preferences === 'object') update.preferences = body.preferences
    const prof = await Profile.findOneAndUpdate({ userId: (session.user as any).id }, { $set: update }, { new: true })
    return NextResponse.json({ success: true, profile: prof })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}


