import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { errorTracker } from '@/lib/error-tracking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/errors
 * Retrieve error statistics and recent errors
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const context = searchParams.get('context') || undefined
    const severity = searchParams.get('severity') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const since = searchParams.get('since') ? parseInt(searchParams.get('since')!) : undefined

    const stats = errorTracker.getStats()
    const errors = errorTracker.getErrors({
      context,
      severity,
      limit,
      since
    })

    return NextResponse.json({
      success: true,
      stats,
      errors,
      filters: {
        context,
        severity,
        limit,
        since
      }
    })
  } catch (error) {
    console.error('[API] Error tracking fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error data', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/errors
 * Clear error logs
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const olderThan = searchParams.get('olderThan')

    if (olderThan) {
      const ageMs = parseInt(olderThan)
      const cleared = errorTracker.clearOlderThan(ageMs)
      return NextResponse.json({
        success: true,
        message: `Cleared ${cleared} errors older than ${Math.round(ageMs / 3600000)}h`
      })
    } else {
      errorTracker.clearAll()
      return NextResponse.json({
        success: true,
        message: 'All errors cleared'
      })
    }
  } catch (error) {
    console.error('[API] Error tracking clear failed:', error)
    return NextResponse.json(
      { error: 'Failed to clear errors', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/errors
 * Manually track an error (for client-side error reporting)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context, severity, metadata } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const errorId = errorTracker.trackError(message, {
      context: context || 'client',
      severity: severity || 'medium',
      url: request.headers.get('referer') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata
    })

    return NextResponse.json({
      success: true,
      errorId,
      message: 'Error tracked successfully'
    })
  } catch (error) {
    console.error('[API] Error tracking failed:', error)
    return NextResponse.json(
      { error: 'Failed to track error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

