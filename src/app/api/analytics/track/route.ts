import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export const dynamic = 'force-dynamic'

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: string
  userId?: string
  sessionId?: string
}

/**
 * Track user analytics events
 * This endpoint stores events for product analytics
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const event: AnalyticsEvent = await request.json()

    // Add user ID from session if available
    if (session?.user?.id) {
      event.userId = session.user.id
    }

    // Add IP and user agent for analytics
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // In production, you'd store this in a dedicated analytics DB or service
    // For now, we'll log it and optionally store in MongoDB
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics Event]', {
        event: event.name,
        userId: event.userId,
        sessionId: event.sessionId,
        properties: event.properties,
        ip,
        userAgent,
      })
    }

    // Store in database if needed (create AnalyticsEvent model)
    if (process.env.ENABLE_ANALYTICS_STORAGE === 'true') {
      try {
        await dbService.connect()
        // TODO: Create and use AnalyticsEvent model
        // await AnalyticsEvent.create({
        //   ...event,
        //   ip,
        //   userAgent,
        //   createdAt: new Date(),
        // })
      } catch (dbError) {
        // Silently fail - don't break user experience for analytics
        console.error('[Analytics] Failed to store event:', dbError)
      }
    }

    // Return success quickly - analytics shouldn't slow down the app
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    // Silently fail for analytics errors
    console.error('[Analytics] Error:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}

