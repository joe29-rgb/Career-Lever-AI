/**
 * Job Search by Resume Keywords API
 * 
 * Uses multi-layer caching and aggregation:
 * 1. Redis cache (instant)
 * 2. MongoDB cache (fast, shared across users)
 * 3. Perplexity sonar-pro (costs money)
 * 4. Puppeteer scrapers (free, slower)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Resume from '@/models/Resume'
import { dbService } from '@/lib/database'
import { JobAggregator } from '@/lib/job-aggregator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for scraping

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    await dbService.connect()

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resumeId, radiusKm = 70, maxResults = 100 } = body

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID required' }, { status: 400 })
    }

    console.log('[JOB_SEARCH_API] Starting search:', {
      userId: session.user.id,
      resumeId,
      radiusKm,
      maxResults
    })

    // Get resume with keywords and location
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: session.user.id
    })

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // Check if resume has been analyzed
    if (!resume.resumeSignals?.keywords || !resume.resumeSignals?.location) {
      return NextResponse.json({
        error: 'Resume not analyzed',
        details: 'Please upload your resume first to extract keywords and location'
      }, { status: 400 })
    }

    const { keywords, location } = resume.resumeSignals

    console.log('[JOB_SEARCH_API] Resume data:', {
      keywords: keywords.slice(0, 10),
      location,
      totalKeywords: keywords.length
    })

    // Search jobs using aggregator
    const aggregator = JobAggregator.getInstance()
    const result = await aggregator.searchByResumeKeywords(
      keywords,
      location,
      radiusKm,
      maxResults
    )

    const duration = Date.now() - startTime

    console.log('[JOB_SEARCH_API] Search complete:', {
      jobsFound: result.jobs.length,
      source: result.source,
      cached: result.cached,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      success: true,
      jobs: result.jobs,
      metadata: {
        source: result.source,
        cached: result.cached,
        timestamp: result.timestamp,
        searchCount: result.searchCount,
        duration,
        keywords: keywords.slice(0, 10),
        location,
        radiusKm
      }
    })

  } catch (error) {
    console.error('[JOB_SEARCH_API] Error:', error)
    return NextResponse.json({
      error: 'Job search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get cache statistics
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const aggregator = JobAggregator.getInstance()
    const stats = await aggregator.getCacheStats()

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('[JOB_SEARCH_API] Stats error:', error)
    return NextResponse.json({
      error: 'Failed to get stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
