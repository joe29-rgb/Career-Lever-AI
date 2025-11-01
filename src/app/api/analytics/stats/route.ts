import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
  getUserApplicationStats,
  getApplicationTrendLine,
  calculateSuccessRate,
  getIndustryBreakdown,
  calculateAverageResponseTime,
  predictNextOffer
} from '@/lib/analytics/application-stats'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/stats
 * Get comprehensive application statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const includeAll = searchParams.get('includeAll') === 'true'

    // Get basic stats
    const stats = await getUserApplicationStats(session.user.id)

    // Get trend data
    const trendLine = await getApplicationTrendLine(session.user.id, days)

    // Get success rates
    const successRate = await calculateSuccessRate(session.user.id)

    // Get industry breakdown
    const industryBreakdown = await getIndustryBreakdown(session.user.id)

    // Get average response time
    const avgResponseTime = await calculateAverageResponseTime(session.user.id)

    // Get prediction
    const prediction = await predictNextOffer(session.user.id)

    const response = {
      success: true,
      stats,
      trendLine,
      successRate,
      industryBreakdown,
      avgResponseTime,
      prediction,
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[ANALYTICS_STATS] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
