import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { RapidAPIClient } from '@/lib/rapidapi-client'

export const dynamic = 'force-dynamic'

/**
 * TEST: Google Jobs API only
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer dev-secret') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('[TEST] Testing Google Jobs API...')

    const rapidAPI = new RapidAPIClient()

    const { jobs, metadata } = await rapidAPI.queryMultipleSources(
      ['google-jobs'],
      {
        keywords: ['jobs'],
        location: 'Edmonton, AB',
        limit: 50
      }
    )

    logger.info(`[TEST] Found ${jobs.length} jobs`)

    return NextResponse.json({
      success: true,
      jobCount: jobs.length,
      metadata,
      sampleJobs: jobs.slice(0, 3).map(j => ({
        title: j.title,
        company: j.company,
        location: j.location
      }))
    })

  } catch (error) {
    logger.error('[TEST] Failed:', error)
    return NextResponse.json(
      {
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
