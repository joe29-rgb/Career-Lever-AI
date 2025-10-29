import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { logger } from '@/lib/logger'
import GlobalJobsCache from '@/models/GlobalJobsCache'
import { scoreJobRelevance } from '@/lib/keyword-extractor'

export const dynamic = 'force-dynamic'

/**
 * USER JOB SEARCH - Searches cached jobs
 * 
 * Fast keyword search in GlobalJobsCache (< 100ms)
 * Falls back to live search if no results
 * 
 * Query params:
 * - keywords: comma-separated keywords
 * - location: city, province
 * - limit: max results (default: 50)
 * - minScore: minimum relevance score (default: 5)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const keywordsParam = searchParams.get('keywords') || ''
    const location = searchParams.get('location') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const minScore = parseInt(searchParams.get('minScore') || '5')

    if (!keywordsParam) {
      return NextResponse.json(
        { error: 'Keywords required' },
        { status: 400 }
      )
    }

    const keywords = keywordsParam.split(',').map(k => k.trim().toLowerCase())
    
    logger.info(`[CACHE SEARCH] Searching for: ${keywords.join(', ')} in ${location || 'all locations'}`)

    const startTime = Date.now()
    await dbService.connect()

    // Build query
    const query: Record<string, unknown> = {
      // Search in keywords array
      keywords: { $in: keywords },
      // Not expired
      expiresAt: { $gt: new Date() }
    }

    // Add location filter if provided
    if (location) {
      query.$or = [
        { location: { $regex: location, $options: 'i' } },
        { city: { $regex: location, $options: 'i' } },
        { province: { $regex: location, $options: 'i' } }
      ]
    }

    // Find matching jobs
    const jobs = await GlobalJobsCache
      .find(query)
      .limit(limit * 2) // Get more for scoring
      .sort({ downloadedAt: -1 }) // Newest first
      .lean()

    logger.info(`[CACHE SEARCH] Found ${jobs.length} matching jobs in ${Date.now() - startTime}ms`)

    // Score and rank jobs
    const scoredJobs = jobs.map(job => ({
      ...job,
      relevanceScore: scoreJobRelevance(
        {
          id: job.jobId,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          url: job.url,
          source: job.source,
          salary: job.salary,
          postedDate: job.postedDate?.toISOString()
        },
        keywords
      )
    }))

    // Filter by minimum score and sort
    const rankedJobs = scoredJobs
      .filter(job => job.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    const duration = Date.now() - startTime

    logger.info(`[CACHE SEARCH] Returning ${rankedJobs.length} jobs (scored >= ${minScore}) in ${duration}ms`)

    return NextResponse.json({
      success: true,
      source: 'cache',
      jobs: rankedJobs.map(job => ({
        id: job.jobId,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        salary: job.salary,
        url: job.url,
        source: job.source,
        postedDate: job.postedDate,
        relevanceScore: job.relevanceScore,
        keywords: job.keywords
      })),
      metadata: {
        totalFound: jobs.length,
        returned: rankedJobs.length,
        duration,
        searchKeywords: keywords,
        location: location || 'all',
        minScore
      }
    })

  } catch (error) {
    logger.error('[CACHE SEARCH] Search failed:', error)
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
