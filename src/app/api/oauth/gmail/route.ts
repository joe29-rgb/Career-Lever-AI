import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import OAuthToken from '@/models/OAuthToken'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { accessToken, refreshToken, scope, expiresAt } = await req.json()
    await connectToDatabase()
    await OAuthToken.findOneAndUpdate(
      { userId: (session.user as any).id, provider: 'gmail' },
      { accessToken, refreshToken, scope, expiresAt: expiresAt ? new Date(expiresAt) : undefined },
      { upsert: true }
    )
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to store Gmail token' }, { status: 500 })
  }
}


