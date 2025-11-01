import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { batchScheduleFollowUps } from '@/lib/batch/operations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/batch/follow-ups
 * Batch schedule follow-ups for multiple applications
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { applicationIds, daysAfter = 7 } = body

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { error: 'Application IDs array is required' },
        { status: 400 }
      )
    }

    if (applicationIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 applications per batch' },
        { status: 400 }
      )
    }

    console.log(`[BATCH_FOLLOWUPS] Scheduling ${applicationIds.length} follow-ups (${daysAfter} days after)`)

    const result = await batchScheduleFollowUps(applicationIds, daysAfter)

    console.log(`[BATCH_FOLLOWUPS] Complete: ${result.successful} scheduled, ${result.failed} failed`)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('[BATCH_FOLLOWUPS] Error:', error)
    return NextResponse.json(
      {
        error: 'Batch follow-up scheduling failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
