import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import AlertPreference from '@/models/AlertPreference'

export const dynamic = 'force-dynamic'

/**
 * GET /api/alerts/preferences - Get user's alert preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()
    
    let preferences = await AlertPreference.findOne({ userId: session.user.id })
    
    // Create default preferences if none exist
    if (!preferences) {
      preferences = await AlertPreference.create({
        userId: session.user.id,
        enabled: true,
        channels: {
          email: true,
          inApp: true,
          push: false
        },
        alertTypes: {
          newJobMatches: true,
          applicationUpdates: true,
          interviewReminders: true,
          followUpReminders: true,
          deadlineAlerts: true,
          responseTimeAlerts: false,
          networkActivity: false
        },
        frequency: 'realtime',
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'America/Toronto'
        }
      })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('[ALERT_PREFERENCES] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get alert preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/alerts/preferences - Update user's alert preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates = body.preferences || body

    await connectToDatabase()
    
    const preferences = await AlertPreference.findOneAndUpdate(
      { userId: session.user.id },
      { $set: updates },
      { new: true, upsert: true }
    )

    return NextResponse.json({ 
      success: true,
      preferences 
    })
  } catch (error) {
    console.error('[ALERT_PREFERENCES] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update alert preferences' },
      { status: 500 }
    )
  }
}
