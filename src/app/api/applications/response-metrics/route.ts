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

    // Get applications with response dates
    await connectToDatabase()
    const applications = await JobApplication.find(
      {
        userId: session.user.id,
        status: { $ne: 'Applied' }
      },
      { createdAt: 1, updatedAt: 1, status: 1 }
    ).sort({ updatedAt: -1 })

    if (applications.length === 0) {
      return NextResponse.json({
        averageResponseTime: 0,
        fastestResponse: 0,
        slowestResponse: 0,
        totalResponses: 0,
        trend: 'stable'
      })
    }

    // Calculate response times in days
    const responseTimes = applications.map(app => {
      const created = new Date(app.createdAt)
      const updated = new Date(app.updatedAt)
      const diffMs = updated.getTime() - created.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      return diffDays
    })

    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    const fastestResponse = Math.min(...responseTimes)
    const slowestResponse = Math.max(...responseTimes)

    // Calculate trend (compare last 5 vs previous 5)
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (responseTimes.length >= 10) {
      const recent = responseTimes.slice(0, 5).reduce((a, b) => a + b, 0) / 5
      const previous = responseTimes.slice(5, 10).reduce((a, b) => a + b, 0) / 5
      if (recent < previous * 0.9) trend = 'down' // Improving (faster)
      else if (recent > previous * 1.1) trend = 'up' // Slowing
    }

    return NextResponse.json({
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
      fastestResponse: Math.round(fastestResponse * 10) / 10,
      slowestResponse: Math.round(slowestResponse * 10) / 10,
      totalResponses: applications.length,
      trend
    })
  } catch (error) {
    console.error('[RESPONSE_METRICS] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch response metrics' },
      { status: 500 }
    )
  }
}
