import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RedisCache } from '@/lib/redis-cache'
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

    const cache = RedisCache.getInstance()
    const stats = await cache.getStats()

    logger.info('Cache stats retrieved', { 
      user: session.user.email,
      connected: stats.connected
    })

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Failed to fetch cache stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { error: 'Failed to fetch cache stats' },
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

    const cache = RedisCache.getInstance()
    const success = await cache.flush()

    if (success) {
      logger.warn('Cache flushed', {
        user: session.user.email
      })

      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Cache is not available'
      }, { status: 503 })
    }

  } catch (error) {
    logger.error('Failed to flush cache', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

