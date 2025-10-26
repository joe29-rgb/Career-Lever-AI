import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import Notification from '@/models/Notification'

export const dynamic = 'force-dynamic'

/**
 * ENTERPRISE API: List Notifications
 * 
 * Fetches user's notifications with pagination
 * Query params: limit (default 20), unreadOnly (default false)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    await dbService.connect()

    const userId = session.user.id || session.user.email

    const query: any = { userId }
    if (unreadOnly) {
      query.read = false
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    const unreadCount = await Notification.countDocuments({ userId, read: false })

    console.log('[NOTIFICATION_API] Fetched', notifications.length, 'notifications, unread:', unreadCount)

    return NextResponse.json({
      success: true,
      notifications: notifications.map(n => ({
        id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        actionUrl: n.actionUrl,
        read: n.read,
        createdAt: n.createdAt
      })),
      unreadCount,
      total: notifications.length
    })

  } catch (error) {
    console.error('[NOTIFICATION_API] List error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: (error as Error).message },
      { status: 500 }
    )
  }
}

