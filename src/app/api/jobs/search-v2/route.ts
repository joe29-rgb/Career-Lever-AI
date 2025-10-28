/**
 * Job Search API v2 - Multi-Source RapidAPI Aggregator
 * 
 * NEW ARCHITECTURE:
 * - Uses RapidAPI multi-source aggregator (Active Jobs DB, JSearch, Indeed, etc.)
 * - Weighted skill matching from Phase 1
 * - Intelligent deduplication
 * - 24-hour MongoDB caching
 * - 96% cost savings vs Perplexity
 * 
 * Cost: $0.002-0.005 per search (vs $0.10 with Perplexity)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { JobAggregatorService } from '@/lib/job-aggregator-service'
import { isRateLimited } from '@/lib/rate-limit'
import UserProfile from '@/models/UserProfile'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

interface JobSearchRequest {
  keywords: string | string[]
  location?: string
  remote?: boolean
  jobType?: string[]
  workType?: string[]
  limit?: number
  salaryMin?: number
  experienceLevel?: string
  useCache?: boolean
  includeLinkedIn?: boolean
  includeFreelance?: boolean
  includeStartups?: boolean
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse request
    const body: JobSearchRequest = await request.json()
    const { 
      keywords, 
      location, 
      remote,
      jobType,
      workType,
      limit = 100,
      salaryMin,
      useCache = true,
      includeLinkedIn = true,
      includeFreelance = false,
      includeStartups = false
    } = body
    
    console.log('═══════════════════════════════════════════════════════')
    console.log('[JOB_SEARCH_V2] NEW MULTI-SOURCE SEARCH')
    console.log('═══════════════════════════════════════════════════════')
    console.log('[JOB_SEARCH_V2] Keywords:', keywords)
    console.log('[JOB_SEARCH_V2] Location:', location || 'Any')
    console.log('[JOB_SEARCH_V2] Remote:', remote)
    console.log('[JOB_SEARCH_V2] Limit:', limit)
    console.log('─────────────────────────────────────────────────────────')
    
    // Validate keywords
    if (!keywords || (Array.isArray(keywords) && keywords.length === 0)) {
      return NextResponse.json({ 
        success: false,
        error: 'Please provide search keywords' 
      }, { status: 400 })
    }
    
    // Normalize keywords to array
    const keywordArray = Array.isArray(keywords) 
      ? keywords 
      : keywords.split(',').map(k => k.trim()).filter(Boolean)
    
    if (keywordArray.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Please provide valid search keywords' 
      }, { status: 400 })
    }
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    // Rate limiting
    if (await isRateLimited(session.user.id, 'job-search')) {
      return NextResponse.json({ 
        success: false,
        error: 'Too many searches. Please wait a moment.' 
      }, { status: 429 })
    }
    
    await dbService.connect()
    
    // Get user profile with weighted skills
    let userProfile: Awaited<ReturnType<typeof UserProfile.findOne>> = null
    try {
      userProfile = await UserProfile.findOne({ 
        $or: [
          { userId: session.user.id },
          { email: session.user.email }
        ]
      }).lean()
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = userProfile as any
      if (profile?.skills?.weighted) {
        console.log('[JOB_SEARCH_V2] Found weighted skills:', {
          primarySkills: profile.skills.weighted.primarySkills?.length || 0,
          secondarySkills: profile.skills.weighted.secondarySkills?.length || 0
        })
      } else {
        console.log('[JOB_SEARCH_V2] No weighted skills found - using basic matching')
      }
    } catch (profileError) {
      console.warn('[JOB_SEARCH_V2] Could not load user profile:', profileError)
    }
    
    // Search preferences
    const searchPreferences = {
      keywords: keywordArray,
      location,
      remote,
      workType: workType || jobType,
      includeLinkedIn,
      includeFreelance,
      includeStartups,
      maxSources: 5 // Limit to 5 sources for cost control
    }
    
    console.log('[JOB_SEARCH_V2] Starting aggregator search...')
    
    // Use JobAggregatorService
    const result = await JobAggregatorService.searchJobs({
      userId: session.user.id,
      keywords: keywordArray,
      location,
      remote,
      jobType: workType || jobType,
      salaryMin,
      userProfile: userProfile || undefined,
      searchPreferences,
      useCache
    })
    
    // Limit results
    const limitedJobs = result.jobs.slice(0, limit)
    
    const duration = Date.now() - startTime
    
    console.log('[JOB_SEARCH_V2] ✅ Search complete')
    console.log('[JOB_SEARCH_V2] Results:', limitedJobs.length)
    console.log('[JOB_SEARCH_V2] Cost: $' + result.metadata.cost.toFixed(4))
    console.log('[JOB_SEARCH_V2] Duration:', duration + 'ms')
    console.log('[JOB_SEARCH_V2] Cached:', result.metadata.caching.cached)
    console.log('═══════════════════════════════════════════════════════')
    
    return NextResponse.json({
      success: true,
      jobs: limitedJobs,
      metadata: {
        ...result.metadata,
        totalDuration: duration,
        version: 'v2-multi-source',
        sources: Object.keys(result.metadata.query.sources),
        cached: result.metadata.caching.cached
      }
    })
    
  } catch (error) {
    console.error('[JOB_SEARCH_V2] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to search jobs',
      details: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        duration: Date.now() - startTime
      }
    }, { status: 500 })
  }
}
