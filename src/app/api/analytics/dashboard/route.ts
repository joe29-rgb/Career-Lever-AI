import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
  getUserApplicationStats,
  calculateSuccessRate,
  calculateAverageResponseTime
} from '@/lib/analytics/application-stats'
import Application from '@/models/Application'
import { dbService } from '@/lib/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DashboardStats {
  totalApplications: number
  appliedThisWeek: number
  interviewRate: number
  averageResponseTime: number
  appliedWeekChangePct?: number
  pendingFollowUps?: number
  upcomingInterviews?: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbService.connect()

    // Use new analytics functions
    const fullStats = await getUserApplicationStats(session.user.id)
    const successRate = await calculateSuccessRate(session.user.id)
    const avgResponseTime = await calculateAverageResponseTime(session.user.id)

    // Calculate applications this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const thisWeekApps = await Application.countDocuments({
      userId: session.user.id,
      appliedAt: { $gte: oneWeekAgo }
    })

    const prevWeekApps = await Application.countDocuments({
      userId: session.user.id,
      appliedAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo }
    })

    const appliedWeekChangePct = prevWeekApps > 0 
      ? Math.round(((thisWeekApps - prevWeekApps) / prevWeekApps) * 100) 
      : (thisWeekApps > 0 ? 100 : 0)

    // Count pending follow-ups
    const pendingFollowUps = await Application.countDocuments({
      userId: session.user.id,
      followUpStatus: 'pending'
    })

    // Count upcoming interviews
    const upcomingInterviews = await Application.countDocuments({
      userId: session.user.id,
      status: 'interview_scheduled',
      interviewDate: { $gte: new Date() }
    })

    const stats: DashboardStats = {
      totalApplications: fullStats.totalApplications,
      appliedThisWeek: thisWeekApps,
      interviewRate: successRate.interviewRate,
      averageResponseTime: avgResponseTime,
      appliedWeekChangePct,
      pendingFollowUps,
      upcomingInterviews
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('[DASHBOARD_ANALYTICS] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get dashboard stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

