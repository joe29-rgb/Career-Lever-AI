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
    const outlook = await OAuthToken.findOne({ userId: (session.user as any).id, provider: 'outlook' }).lean<IOAuthToken>()
    if (!outlook?.accessToken) return NextResponse.json({ error: 'Outlook not linked' }, { status: 400 })
    const categoryName = 'Career Lever AI Applications'
    const create = await fetch('https://graph.microsoft.com/v1.0/me/outlook/masterCategories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${outlook.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: categoryName, color: 'preset0' })
    })
    if (create.ok || create.status === 409) return NextResponse.json({ success: true, category: categoryName })
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}


