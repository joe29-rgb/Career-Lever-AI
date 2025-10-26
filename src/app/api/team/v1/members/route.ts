import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Team from '@/models/Team'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { teamId, userId, role } = await req.json()
    if (!teamId || !userId) return NextResponse.json({ error: 'teamId and userId required' }, { status: 400 })
    await connectToDatabase()
    const team = await Team.findOne({ _id: teamId, 'members.userId': (session.user as any).id }).lean()
    if (!team) return NextResponse.json({ error: 'Not found or no access' }, { status: 404 })
    await Team.updateOne({ _id: teamId }, { $addToSet: { members: { userId, role: role || 'member' } } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}


