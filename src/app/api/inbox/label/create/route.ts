import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import OAuthToken, { IOAuthToken } from '@/models/OAuthToken'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const gmail = await OAuthToken.findOne({ userId: (session.user as any).id, provider: 'gmail' }).lean<IOAuthToken>()
    if (!gmail?.accessToken) return NextResponse.json({ error: 'Gmail not linked' }, { status: 400 })
    const labelName = 'Career Lever AI Applications'
    // Create label if missing
    const create = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      method: 'POST',
      headers: { Authorization: `Bearer ${gmail.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: labelName, labelListVisibility: 'labelShow', messageListVisibility: 'show' })
    })
    const json = await create.json().catch(()=>({}))
    if (create.ok || (json?.error?.code === 409)) {
      return NextResponse.json({ success: true, label: labelName })
    }
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}


