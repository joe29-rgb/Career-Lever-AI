import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerformanceMonitor } from '@/lib/performance-monitor'
import { Logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const logger = Logger.getInstance()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow authenticated admin users
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const monitor = PerformanceMonitor.getInstance()
    const stats = monitor.getAPIStats()
    const slowest = monitor.getSlowestEndpoints(10)

    logger.info('Performance stats retrieved', { 
      user: session.user.email
    })

    return NextResponse.json({
      success: true,
      stats,
      slowestEndpoints: slowest,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Failed to fetch performance stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { error: 'Failed to fetch performance stats' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const monitor = PerformanceMonitor.getInstance()
    monitor.cleanup()

    logger.info('Performance metrics cleaned up', {
      user: session.user.email
    })

    return NextResponse.json({
      success: true,
      message: 'Performance metrics cleaned up'
    })

  } catch (error) {
    logger.error('Failed to cleanup performance metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { error: 'Failed to cleanup metrics' },
      { status: 500 }
    )
  }
}

