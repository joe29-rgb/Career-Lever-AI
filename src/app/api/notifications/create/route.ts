import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import Notification from '@/models/Notification'

export const dynamic = 'force-dynamic'

/**
 * ENTERPRISE API: Create Notification
 * 
 * Creates a new notification for the user
 * Types: job_match, application_status, interview_invite, new_feature, system_alert
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
    const { type, title, message, actionUrl, metadata } = body

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'type, title, and message are required' },
        { status: 400 }
      )
    }

    const validTypes = ['job_match', 'application_status', 'interview_invite', 'new_feature', 'system_alert']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    await dbService.connect()

    const notification = await Notification.create({
      userId: session.user.id || session.user.email,
      type,
      title,
      message,
      actionUrl,
      metadata,
      read: false
    })

    console.log('[NOTIFICATION_API] Created:', notification._id, 'for user:', session.user.email)

    return NextResponse.json({
      success: true,
      notification: {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        read: notification.read,
        createdAt: notification.createdAt
      }
    })

  } catch (error) {
    console.error('[NOTIFICATION_API] Create error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification', details: (error as Error).message },
      { status: 500 }
    )
  }
}

