import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get applications that need follow-up
    await connectToDatabase()
    const applications = await JobApplication.find(
      {
        userId: session.user.id,
        status: { $in: ['Applied', 'Screening', 'Under Review'] }
      },
      { _id: 1, company: 1, jobTitle: 1, createdAt: 1, status: 1, lastFollowUp: 1 }
    ).sort({ createdAt: 1 })

    const now = new Date()
    const reminders = applications
      .map(app => {
        const appliedDate = new Date(app.createdAt)
        const lastFollowUp = app.lastFollowUp ? new Date(app.lastFollowUp) : null
        const daysSinceApplied = Math.floor((now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))
        const daysSinceFollowUp = lastFollowUp 
          ? Math.floor((now.getTime() - lastFollowUp.getTime()) / (1000 * 60 * 60 * 24))
          : daysSinceApplied

        // Determine if follow-up is needed
        let needsFollowUp = false
        let priority: 'high' | 'medium' | 'low' = 'low'

        if (daysSinceFollowUp >= 14) {
          needsFollowUp = true
          priority = 'high'
        } else if (daysSinceFollowUp >= 7) {
          needsFollowUp = true
          priority = 'medium'
        } else if (daysSinceFollowUp >= 5) {
          needsFollowUp = true
          priority = 'low'
        }

        return {
          id: app._id.toString(),
          company: app.company,
          jobTitle: app.jobTitle,
          appliedDate: appliedDate.toISOString(),
          daysSinceApplied,
          status: app.status,
          priority,
          needsFollowUp
        }
      })
      .filter(r => r.needsFollowUp)
      .sort((a, b) => {
        // Sort by priority (high first) then by days
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return b.daysSinceApplied - a.daysSinceApplied
      })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error('[FOLLOW_UP_REMINDERS] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch follow-up reminders' },
      { status: 500 }
    )
  }
}
