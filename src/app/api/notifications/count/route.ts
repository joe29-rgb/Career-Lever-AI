import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Notification from '@/models/Notification'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications/count - Get unread notification count
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const count = await Notification.countDocuments({
      userId: session.user.id,
      read: false
    })

    return NextResponse.json({
      success: true,
      count
    })
  } catch (error) {
    console.error('[NOTIFICATIONS] Count error:', error)
    return NextResponse.json(
      { error: 'Failed to get count' },
      { status: 500 }
    )
  }
}

