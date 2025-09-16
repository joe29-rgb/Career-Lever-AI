import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import { authOptions } from '@/lib/auth'
export const dynamic = 'force-dynamic'

interface DashboardStats {
  totalApplications: number
  appliedThisWeek: number
  interviewRate: number
  averageResponseTime: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    // Get user's applications
    const applications = await JobApplication.find({ userId: session.user.id })

    // Calculate total applications
    const totalApplications = applications.length

    // Calculate applications this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const appliedThisWeek = applications.filter(app =>
      new Date(app.createdAt) > oneWeekAgo
    ).length

    // Calculate interview rate (applications that reached interview stage)
    const interviewApplications = applications.filter(app =>
      app.applicationStatus === 'interviewing' || app.applicationStatus === 'offer'
    ).length
    const interviewRate = totalApplications > 0 ? Math.round((interviewApplications / totalApplications) * 100) : 0

    // Calculate average response time (simplified - in days)
    const applicationsWithResponses = applications.filter(app =>
      app.applicationStatus !== 'saved' && app.applicationStatus !== 'applied'
    )

    let averageResponseTime = 0
    if (applicationsWithResponses.length > 0) {
      const totalResponseTime = applicationsWithResponses.reduce((total, app) => {
        const appliedDate = new Date(app.createdAt)
        const responseDate = app.updatedAt ? new Date(app.updatedAt) : new Date()
        const daysDiff = Math.ceil((responseDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))
        return total + daysDiff
      }, 0)
      averageResponseTime = Math.round(totalResponseTime / applicationsWithResponses.length)
    }

    const stats: DashboardStats = {
      totalApplications,
      appliedThisWeek,
      interviewRate,
      averageResponseTime
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard stats' },
      { status: 500 }
    )
  }
}

