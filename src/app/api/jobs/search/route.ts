/**
 * Unified Job Search API
 * 
 * Aggregates jobs from:
 * 1. Canadian public job boards (Job Bank, Jooble, Careerjet)
 * 2. Major boards via Perplexity (LinkedIn, Indeed, Glassdoor)
 * 3. ATS platforms (Greenhouse, Lever, Workable, etc.)
 * 4. Third-party aggregators (Adzuna)
 * 
 * Then uses Perplexity AI to rank and filter results
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { PublicJobDiscoveryService } from '@/lib/public-job-discovery-service'
import { PerplexityService } from '@/lib/perplexity-service'
import { isRateLimited } from '@/lib/rate-limit'

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
  experienceLevel?: 'entry' | 'mid' | 'senior'
  refineWithAI?: boolean // Use Perplexity to rank results
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    if (isRateLimited(session.user.id, 'job-search')) {
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
      limit = 100, 
      remote,
      salaryMin,
      experienceLevel,
      refineWithAI = true
    } = body

    if (!keywords || keywords.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Please provide valid search keywords' 
      }, { status: 400 })
    }

    console.log(`[JOB_SEARCH] User ${session.user.id} searching: "${keywords}" in ${location}`)

    // Step 1: Aggregate jobs from all sources
    const discovery = new PublicJobDiscoveryService()
    
    const jobs = await discovery.discoverJobs({
      keywords,
      location,
      boards: sources,
      limit,
      remote,
      salaryMin,
      experienceLevel
    })

    console.log(`[JOB_SEARCH] Found ${jobs.length} jobs from ${sources?.length || 'all'} sources`)

    // Step 2: Optionally refine with Perplexity AI
    let rankedJobs = jobs
    let aiInsights = null

    if (refineWithAI && jobs.length > 0) {
      try {
        const refinement = await refineJobsWithPerplexity(jobs, keywords, location)
        rankedJobs = refinement.rankedJobs
        aiInsights = refinement.insights
        
        console.log(`[JOB_SEARCH] Perplexity refined ${rankedJobs.length} top matches`)
      } catch (error) {
        console.error('[JOB_SEARCH] Perplexity refinement failed:', error)
        // Continue with unrefined results
      }
    }

    // Step 3: Save search history
    try {
      const { default: SearchHistory } = await import('@/models/SearchHistory')
      await SearchHistory.create({
        userId: session.user.id,
        keywords,
        location,
        resultsCount: rankedJobs.length,
        sources: sources || ['all'],
        timestamp: new Date()
      })
    } catch (error) {
      console.error('[JOB_SEARCH] Failed to save search history:', error)
      // Non-critical, continue
    }

    return NextResponse.json({
      success: true,
      query: { keywords, location, sources },
      totalResults: jobs.length,
      returnedResults: rankedJobs.length,
      jobs: rankedJobs.slice(0, limit),
      aiInsights,
      sources: [...new Set(jobs.map(j => j.source))],
      timestamp: new Date().toISOString()
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
 * Refine and rank jobs using Perplexity AI
 */
async function refineJobsWithPerplexity(
  jobs: any[], 
  keywords: string, 
  location: string
): Promise<{ rankedJobs: any[], insights: any }> {
  const perplexity = new PerplexityService()

  // Create a concise job list for Perplexity
  const jobSummary = jobs.slice(0, 50).map((job, i) => 
    `${i + 1}. ${job.title} at ${job.company}, ${job.location}${job.salary ? ` - ${job.salary}` : ''}`
  ).join('\n')

  const systemPrompt = `You are an expert career coach and job matching specialist. 
Your role is to analyze job listings and provide intelligent ranking and insights 
based on relevance, quality, and fit for the candidate's search criteria.`

  const userPrompt = `
Analyze these ${jobs.length} job listings for a candidate searching for "${keywords}" in ${location}:

${jobSummary}

Provide a JSON response with:
1. "topMatches": Array of job indices (1-based) ranked by relevance (max 10)
2. "matchScores": Object mapping each index to a score (0-1)
3. "insights": {
   "marketTrends": Brief market observation,
   "salaryRange": Estimated range if visible,
   "recommendations": 2-3 actionable tips for this search
}
4. "rationale": Brief explanation for top 3 matches

Return ONLY valid JSON, no markdown.
`

  try {
    const result = await perplexity.makeRequest(systemPrompt, userPrompt, {
      temperature: 0.3,
      maxTokens: 1500
    })

    // Parse Perplexity response
    const aiResponse = JSON.parse(result.content)

    // Rank jobs based on AI scores
    const rankedJobs = aiResponse.topMatches
      .map((index: number) => ({
        ...jobs[index - 1],
        aiScore: aiResponse.matchScores[index],
        aiRationale: aiResponse.rationale?.[index - 1]
      }))
      .filter((job: any) => job.title) // Filter out invalid indices

    return {
      rankedJobs,
      insights: {
        marketTrends: aiResponse.insights?.marketTrends,
        salaryRange: aiResponse.insights?.salaryRange,
        recommendations: aiResponse.insights?.recommendations,
        totalAnalyzed: jobs.length,
        topMatchesCount: rankedJobs.length
      }
    }
  } catch (error) {
    console.error('[JOB_SEARCH] Perplexity parsing failed:', error)
    // Return jobs with simple scoring fallback
    return {
      rankedJobs: jobs.map(job => ({
        ...job,
        aiScore: 0.5,
        aiRationale: 'AI ranking unavailable'
      })),
      insights: {
        marketTrends: 'AI analysis unavailable',
        recommendations: ['Review job descriptions carefully', 'Apply to roles matching your experience']
      }
    }
  }
}

/**
 * GET endpoint for saved searches
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbService.connect()

    const { default: SearchHistory } = await import('@/models/SearchHistory')
    const history = await SearchHistory.find({ userId: session.user.id })
      .sort({ timestamp: -1 })
      .limit(20)

    return NextResponse.json({
      success: true,
      history
    })

  } catch (error) {
    console.error('[JOB_SEARCH] Failed to fetch search history:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch search history' 
    }, { status: 500 })
  }
}

