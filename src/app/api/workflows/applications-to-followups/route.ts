/**
 * WORKFLOW: Applications → Follow-ups
 * 
 * Automatically schedules and sends follow-up emails
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Application from '@/models/Application'
import { dbService } from '@/lib/database'
import { ApplicationStatusService } from '@/lib/services/application-status-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[WORKFLOW] Checking applications for follow-ups')

    await dbService.connect()

    // Find applications that need follow-ups (applied > 7 days ago, no response)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const applicationsNeedingFollowUp = await Application.find({
      userId: session.user.id,
      status: 'applied',
      appliedAt: { $lte: sevenDaysAgo },
      followUpStatus: 'pending',
      lastContactedAt: { $exists: false }
    })

    console.log('[WORKFLOW] Found', applicationsNeedingFollowUp.length, 'applications needing follow-up')

    const statusService = ApplicationStatusService.getInstance()
    const scheduled: Array<{
      id: string
      company: string
      jobTitle: string
      scheduledFor: Date
    }> = []

    for (const app of applicationsNeedingFollowUp) {
      // Schedule follow-up for tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0) // 9 AM

      await statusService.scheduleFollowUp(
        session.user.id,
        app._id.toString(),
        tomorrow,
        'Automated follow-up: Check application status'
      )

      scheduled.push({
        id: app._id,
        company: app.company,
        jobTitle: app.jobTitle,
        scheduledFor: tomorrow
      })
    }

    console.log('[WORKFLOW] ✅ Scheduled', scheduled.length, 'follow-ups')

    return NextResponse.json({
      success: true,
      scheduled: scheduled.length,
      followUps: scheduled
    })

  } catch (error) {
    console.error('[WORKFLOW] Error:', error)
    return NextResponse.json({
      error: 'Workflow failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET: Get pending follow-ups
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbService.connect()

    const pendingFollowUps = await Application.find({
      userId: session.user.id,
      followUpStatus: 'scheduled',
      followUpScheduledAt: { $exists: true }
    }).sort({ followUpScheduledAt: 1 })

    return NextResponse.json({
      success: true,
      count: pendingFollowUps.length,
      followUps: pendingFollowUps.map(app => ({
        id: app._id,
        company: app.company,
        jobTitle: app.jobTitle,
        scheduledAt: app.followUpScheduledAt,
        notes: app.followUpNotes
      }))
    })

  } catch (error) {
    console.error('[WORKFLOW] Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch follow-ups',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
