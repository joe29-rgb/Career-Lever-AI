import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { MarketIntelligenceService } from '@/lib/market-intelligence-service'
import { isRateLimited } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * ENTERPRISE API: Get Real-Time Salary Data
 * 
 * Uses Perplexity AI to fetch current salary ranges for a role in a location
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
    if (await isRateLimited(userId, 'market-intelligence-salary')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { role, location } = body

    if (!role || typeof role !== 'string' || role.length < 2) {
      return NextResponse.json(
        { error: 'Valid role is required' },
        { status: 400 }
      )
    }

    if (!location || typeof location !== 'string' || location.length < 2) {
      return NextResponse.json(
        { error: 'Valid location is required' },
        { status: 400 }
      )
    }

    console.log('[MARKET_INTEL_API] Fetching salary for:', role, 'in', location)

    const service = MarketIntelligenceService.getInstance()
    const salaryData = await service.getSalaryData(role, location)

    console.log('[MARKET_INTEL_API] Salary data:', {
      role: salaryData.role,
      avgSalary: salaryData.avgSalary,
      range: `${salaryData.minSalary}-${salaryData.maxSalary}`,
      confidence: salaryData.confidence
    })

    return NextResponse.json({
      success: true,
      salary: salaryData
    })

  } catch (error) {
    console.error('[MARKET_INTEL_API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salary data', details: (error as Error).message },
      { status: 500 }
    )
  }
}

