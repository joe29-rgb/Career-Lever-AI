import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Notification from '@/models/Notification'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/notifications/[id]/read - Mark notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const notification = await Notification.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    )

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      notification
    })
  } catch (error) {
    console.error('[NOTIFICATIONS] Mark read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    )
  }
}

