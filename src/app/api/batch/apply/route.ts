import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { batchApplyToJobs } from '@/lib/batch/operations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/batch/apply
 * Batch apply to multiple jobs
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobIds, resumeVariant } = body

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: 'Job IDs array is required' },
        { status: 400 }
      )
    }

    if (jobIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 jobs per batch' },
        { status: 400 }
      )
    }

    console.log(`[BATCH_APPLY] User ${session.user.id} applying to ${jobIds.length} jobs`)

    const result = await batchApplyToJobs(
      session.user.id,
      jobIds,
      resumeVariant
    )

    console.log(`[BATCH_APPLY] Complete: ${result.successful} successful, ${result.failed} failed`)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('[BATCH_APPLY] Error:', error)
    return NextResponse.json(
      {
        error: 'Batch apply failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
