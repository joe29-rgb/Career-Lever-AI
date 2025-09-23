import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Team from '@/models/Team'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const teams = await Team.find({ 'members.userId': (session.user as any).id }).lean()
    return NextResponse.json({ success: true, teams })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load teams' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
    await connectToDatabase()
    const team = await Team.create({ name, ownerId: (session.user as any).id, members: [{ userId: (session.user as any).id, role: 'owner' }] })
    return NextResponse.json({ success: true, team })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}


