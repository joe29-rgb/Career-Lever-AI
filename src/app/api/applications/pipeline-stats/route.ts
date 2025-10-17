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

    // Get application counts by status
    await connectToDatabase()
    const applications = await JobApplication.find(
      { userId: session.user.id },
      { status: 1 }
    )

    // Count by status
    const stats = {
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      rejected: 0
    }

    applications.forEach(app => {
      const status = app.status?.toLowerCase() || 'applied'
      
      if (status.includes('reject') || status.includes('declined')) {
        stats.rejected++
      } else if (status.includes('offer')) {
        stats.offer++
      } else if (status.includes('interview')) {
        stats.interview++
      } else if (status.includes('screen') || status.includes('review')) {
        stats.screening++
      } else {
        stats.applied++
      }
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[PIPELINE_STATS] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stats' },
      { status: 500 }
    )
  }
}
