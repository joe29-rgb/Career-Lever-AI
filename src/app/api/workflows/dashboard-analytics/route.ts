/**
 * WORKFLOW: Dashboard → Analytics
 * 
 * Connects dashboard to analytics with real-time data
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getUserApplicationStats,
  getApplicationTrendLine,
  calculateSuccessRate,
  getIndustryBreakdown,
  predictNextOffer
} from '@/lib/analytics/application-stats'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[WORKFLOW] Fetching dashboard analytics for user:', session.user.id)

    // Fetch all analytics in parallel
    const [
      stats,
      trendLine,
      successRate,
      industryBreakdown,
      prediction
    ] = await Promise.all([
      getUserApplicationStats(session.user.id),
      getApplicationTrendLine(session.user.id, 30),
      calculateSuccessRate(session.user.id),
      getIndustryBreakdown(session.user.id),
      predictNextOffer(session.user.id)
    ])

    console.log('[WORKFLOW] ✅ Analytics fetched successfully')

    return NextResponse.json({
      success: true,
      analytics: {
        overview: stats,
        trends: trendLine,
        successRates: successRate,
        industries: industryBreakdown,
        predictions: prediction
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[WORKFLOW] Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
