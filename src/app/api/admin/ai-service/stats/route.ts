import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EnterpriseAIService } from '@/lib/ai-service-enterprise'
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

    const aiService = EnterpriseAIService.getInstance()
    const stats = aiService.getStats()

    logger.info('AI Service Stats retrieved', { 
      endpoint: '/api/admin/ai-service/stats',
      user: session.user.email
    })

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Failed to fetch AI service stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/admin/ai-service/stats'
    })

    return NextResponse.json(
      { error: 'Failed to fetch AI service stats' },
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

    const aiService = EnterpriseAIService.getInstance()
    aiService.clearCache()

    logger.info('AI Service cache cleared', {
      endpoint: '/api/admin/ai-service/stats',
      user: session.user.email
    })

    return NextResponse.json({
      success: true,
      message: 'AI service cache cleared'
    })

  } catch (error) {
    logger.error('Failed to clear AI service cache', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/admin/ai-service/stats'
    })

    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

