import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Notification from '@/models/Notification'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/notifications/read-all - Mark all notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const result = await Notification.updateMany(
      { userId: session.user.id, read: false },
      { read: true, readAt: new Date() }
    )

    return NextResponse.json({
      success: true,
      count: result.modifiedCount
    })
  } catch (error) {
    console.error('[NOTIFICATIONS] Mark all read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark all as read' },
      { status: 500 }
    )
  }
}

