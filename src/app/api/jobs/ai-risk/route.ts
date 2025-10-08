import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { JobOutlookAnalyzer } from '@/lib/job-outlook-analyzer'
import { isRateLimited } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * ENTERPRISE API: AI/Automation Risk Analysis
 * 
 * Analyzes automation risk for a specific job title
 * Returns risk level, score, and 5-year projections
 * Cached for 24 hours via JobOutlookAnalyzer
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
    if (await isRateLimited(userId, 'ai-risk-analysis')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { jobTitle, location = 'Canada' } = body

    if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.length < 2) {
      return NextResponse.json(
        { error: 'Valid job title is required' },
        { status: 400 }
      )
    }

    console.log('[AI_RISK_API] Analyzing:', jobTitle, 'in', location)

    const outlook = await JobOutlookAnalyzer.analyzeJobOutlook(jobTitle, location)

    console.log('[AI_RISK_API] Risk:', outlook.automation.riskLevel, 'Score:', outlook.automation.riskScore)

    return NextResponse.json({
      success: true,
      aiRisk: {
        level: outlook.automation.riskLevel,
        score: outlook.automation.riskScore,
        timeline: outlook.automation.automationTimeline,
        vulnerableTasks: outlook.automation.vulnerableTasks,
        safeTasks: outlook.automation.safeTasks,
        recommendations: outlook.automation.recommendations
      },
      marketIntelligence: {
        currentDemand: outlook.market.currentDemand,
        competitionLevel: outlook.market.competitionLevel,
        emergingSkills: outlook.market.emergingSkills,
        averageSalary: outlook.market.averageSalary
      },
      projections: outlook.projections,
      safetyScore: outlook.recommendations.safetyScore
    })

  } catch (error) {
    console.error('[AI_RISK_API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze AI risk', details: (error as Error).message },
      { status: 500 }
    )
  }
}

