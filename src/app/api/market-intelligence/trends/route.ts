import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { MarketIntelligenceService } from '@/lib/market-intelligence-service'
import { isRateLimited } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * ENTERPRISE API: Get Market Trends
 * 
 * Uses Perplexity AI to fetch current industry trends, hiring patterns, and market insights
 * Cached for 24 hours for performance
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Rate limiting
    const userId = session.user.id || session.user.email
    if (await isRateLimited(userId, 'market-intelligence-trends')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { industry } = body

    console.log('[MARKET_TRENDS_API] Fetching trends for:', industry || 'general market')

    const service = MarketIntelligenceService.getInstance()
    const trends = await service.getMarketTrends(industry)

    console.log('[MARKET_TRENDS_API] Found', trends.length, 'trends')

    return NextResponse.json({
      success: true,
      trends
    })

  } catch (error) {
    console.error('[MARKET_TRENDS_API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market trends', details: (error as Error).message },
      { status: 500 }
    )
  }
}

