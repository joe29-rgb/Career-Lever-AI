/**
 * Unified Job Search API - Enhanced with PerplexityIntelligenceService
 * 
 * NOW USES: PerplexityIntelligenceService for comprehensive 25+ board coverage
 * 
 * Features:
 * - 10 Canadian job boards (Job Bank, Jobboom, Workopolis, etc.)
 * - 35+ Canadian ATS companies (Shopify, Wealthsimple, etc.)
 * - Global boards (LinkedIn, Indeed, Glassdoor)
 * - Resume skill matching with scoring
 * - Smart Canadian prioritization
 * - Built-in caching (24hr TTL)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { isRateLimited } from '@/lib/rate-limit'
import Resume from '@/models/Resume'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for comprehensive search

interface JobSearchRequest {
  keywords: string
  location?: string
  sources?: string[] // Specific boards to search
  limit?: number
  remote?: boolean
  salaryMin?: number
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
  workType?: 'remote' | 'hybrid' | 'onsite' | 'any'
  useResumeMatching?: boolean // Use resume for skill matching
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    if (await await isRateLimited(session.user.id, 'job-search')) {
      return NextResponse.json({ 
        error: 'Too many searches. Please wait a moment.' 
      }, { status: 429 })
    }

    await dbService.connect()

    const body: JobSearchRequest = await request.json()
    const { 
      keywords, 
      location = 'Canada', 
      sources, 
      limit = 50, 
      remote,
      salaryMin,
      experienceLevel,
      workType
    } = body

    let useResumeMatching = body.useResumeMatching || false

    if (!keywords || keywords.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Please provide valid search keywords' 
      }, { status: 400 })
    }

    console.log(`[JOB_SEARCH] User ${session.user.id} searching: "${keywords}" in ${location} (Resume matching: ${useResumeMatching})`)

    let result: any
    let jobs: any[] = []
    let metadata: any = {}

    // Option 1: Resume-matched search (most powerful)
    if (useResumeMatching) {
      try {
        // Get user's resume
        const resumeDoc = await Resume.findOne({ userId: session.user.id })
          .sort({ createdAt: -1 })
          .lean()
        
        const extractedText = (resumeDoc as any)?.extractedText
        
        if (!resumeDoc || !extractedText) {
          return NextResponse.json({ 
            error: 'Please upload a resume first to use resume matching' 
          }, { status: 400 })
        }

        console.log(`[JOB_SEARCH] Using resume matching for user ${session.user.id}`)

        // Use enhanced jobMarketAnalysisV2 with 25+ boards
        result = await PerplexityIntelligenceService.jobMarketAnalysisV2(
          location,
          extractedText,
          {
            roleHint: keywords,
            workType: workType || (remote ? 'remote' : 'any'),
            salaryMin,
            experienceLevel,
            maxResults: limit,
            boards: sources
          }
        )

        jobs = result.data
        metadata = {
          ...result.metadata,
          useResumeMatching: true,
          skillMatchingEnabled: true
        }

        console.log(`[JOB_SEARCH] Resume matching found ${jobs.length} jobs with skill scores`)

      } catch (error) {
        console.error('[JOB_SEARCH] Resume matching failed, falling back to standard search:', error)
        // Fall back to standard search
        useResumeMatching = false
      }
    }

    // Option 2: Standard job listing search (25+ boards)
    if (!useResumeMatching || jobs.length === 0) {
      console.log(`[JOB_SEARCH] Using standard search across 25+ boards`)

      jobs = await PerplexityIntelligenceService.jobListings(
        keywords,
        location,
        {
          boards: sources,
          limit,
          includeCanadianOnly: location.toLowerCase().includes('canada')
        }
      )

      metadata = {
        useResumeMatching: false,
        searchedBoards: sources?.length || 15,
        canadianPriority: location.toLowerCase().includes('canada')
      }

      console.log(`[JOB_SEARCH] Standard search found ${jobs.length} jobs`)
    }

    // Save search history
    try {
      const { default: SearchHistory } = await import('@/models/SearchHistory')
      await SearchHistory.create({
        userId: session.user.id,
        keywords,
        location,
        resultsCount: jobs.length,
        sources: sources || ['all'],
        aiUsed: useResumeMatching,
        searchDate: new Date()
      })
    } catch (error) {
      console.error('[JOB_SEARCH] Failed to save search history:', error)
      // Non-critical, continue
    }

    // Get recommended boards for this location
    const recommendations = PerplexityIntelligenceService.getRecommendedBoards(location)

    return NextResponse.json({
      success: true,
      query: { keywords, location, sources },
      totalResults: jobs.length,
      returnedResults: jobs.length,
      jobs: jobs.slice(0, limit),
      metadata: {
        ...metadata,
        searchedAt: new Date().toISOString(),
        cachedResults: result?.cached || false
      },
      recommendations: {
        priorityBoards: recommendations.priority.slice(0, 5),
        reasoning: recommendations.reasoning
      },
      sources: [...new Set(jobs.map((j: any) => j.source || 'Unknown'))]
    })

  } catch (error) {
    console.error('[JOB_SEARCH] Search failed:', error)
    return NextResponse.json({ 
      error: 'Job search failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}

/**
 * GET endpoint for search history and available job boards
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbService.connect()

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    // Get available job boards
    if (action === 'boards') {
      const boards = PerplexityIntelligenceService.getAvailableJobBoards()
      return NextResponse.json({
        success: true,
        boards,
        totalBoards: boards.totalBoards
      })
    }

    // Get search history (default)
    const { default: SearchHistory } = await import('@/models/SearchHistory')
    const history = await SearchHistory.find({ userId: session.user.id })
      .sort({ searchDate: -1 })
      .limit(20)

    return NextResponse.json({
      success: true,
      history
    })

  } catch (error) {
    console.error('[JOB_SEARCH] Failed to fetch data:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch data' 
    }, { status: 500 })
  }
}

