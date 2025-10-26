import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import Notification from '@/models/Notification'

export const dynamic = 'force-dynamic'

/**
 * ENTERPRISE API: Mark Notification as Read
 * 
 * Marks one or more notifications as read
 * Body: { notificationId: string } OR { markAll: true }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId, markAll } = body

    await dbService.connect()

    const userId = session.user.id || session.user.email

    if (markAll) {
      // Mark all notifications as read
      const result = await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
      )

      console.log('[NOTIFICATION_API] Marked all read for user:', session.user.email, 'Count:', result.modifiedCount)

      return NextResponse.json({
        success: true,
        markedCount: result.modifiedCount
      })
    } else if (notificationId) {
      // Mark single notification as read
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { $set: { read: true } },
        { new: true }
      )

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }

      console.log('[NOTIFICATION_API] Marked read:', notificationId)

      return NextResponse.json({
        success: true,
        notification: {
          id: notification._id,
          read: notification.read
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or markAll must be provided' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('[NOTIFICATION_API] Mark read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read', details: (error as Error).message },
      { status: 500 }
    )
  }
}

