import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Notification from '@/models/Notification'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications - Get user notifications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const query: any = { userId: session.user.id }
    if (unreadOnly) {
      query.read = false
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      notifications
    })
  } catch (error) {
    console.error('[NOTIFICATIONS] Get error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications - Create notification
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const body = await request.json()
    const { type, title, message, link, priority, metadata } = body

    const notification = await Notification.create({
      userId: session.user.id,
      type,
      title,
      message,
      link,
      priority: priority || 'medium',
      metadata,
      read: false
    })

    return NextResponse.json({
      success: true,
      notification
    })
  } catch (error) {
    console.error('[NOTIFICATIONS] Create error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

