import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const resumeId = searchParams.get('resumeId')

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Missing resumeId' },
        { status: 400 }
      )
    }

    // Return empty analytics - variants are tracked client-side
    return NextResponse.json({
      success: true,
      variants: [],
      bestVariant: null,
      summary: {
        totalVariants: 0,
        activeVariants: 0,
        totalViews: 0,
        totalDownloads: 0,
        totalResponses: 0
      }
    })
  } catch (error) {
    console.error('[RESUME_VARIANT] Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
