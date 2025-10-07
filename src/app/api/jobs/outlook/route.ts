import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { JobOutlookAnalyzer } from '@/lib/job-outlook-analyzer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/jobs/outlook
 * 
 * Get AI-powered 5-year job outlook analysis including automation risk
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobTitle, location } = body

    if (!jobTitle) {
      return NextResponse.json({ error: 'jobTitle is required' }, { status: 400 })
    }

    console.log(`[JOB OUTLOOK] Analyzing: ${jobTitle} in ${location || 'Canada'}`)

    const outlook = await JobOutlookAnalyzer.analyzeJobOutlook(
      jobTitle,
      location || 'Canada'
    )

    return NextResponse.json({
      success: true,
      outlook,
      cached: false
    })
  } catch (error) {
    console.error('[JOB OUTLOOK] Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze job outlook' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/jobs/outlook/quick?jobTitle=Software+Developer
 * 
 * Quick automation risk check (faster, less comprehensive)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobTitle = searchParams.get('jobTitle')

    if (!jobTitle) {
      return NextResponse.json({ error: 'jobTitle query param is required' }, { status: 400 })
    }

    const risk = await JobOutlookAnalyzer.quickAutomationRisk(jobTitle)

    return NextResponse.json({
      success: true,
      jobTitle,
      automationRisk: risk
    })
  } catch (error) {
    console.error('[JOB OUTLOOK] Quick risk error:', error)
    return NextResponse.json(
      { error: 'Failed to assess automation risk' },
      { status: 500 }
    )
  }
}

