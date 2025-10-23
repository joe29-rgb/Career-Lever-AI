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
import { jobSearchCacheService } from '@/services/job-search-cache.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30 // Reduced from 60s - faster timeout for better UX

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
  targetIndustry?: string // ENTERPRISE: User wants to switch industries (e.g., "Technology", "Healthcare")
  disableIndustryWeighting?: boolean // ENTERPRISE: User wants equal weight across all industries
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    if (await isRateLimited(session.user.id, 'job-search')) {
      return NextResponse.json({ 
        error: 'Too many searches. Please wait a moment.' 
      }, { status: 429 })
    }

    await dbService.connect()

    const body: JobSearchRequest = await request.json()
    let { 
      keywords, 
      location, // CRITICAL FIX: No default - use exact value from frontend
      sources, 
      limit = 25, 
      remote,
      salaryMin,
      experienceLevel,
      workType,
      targetIndustry, // ENTERPRISE: User wants to switch industries
      disableIndustryWeighting // ENTERPRISE: Disable tenure-based weighting
    } = body
    
    // CRITICAL: Validate location is provided
    if (!location || location.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Location is required. Please ensure your resume contains your location or enter it manually.',
        hint: 'Add your city and province/state to your resume (e.g., "Edmonton, AB")'
      }, { status: 400 })
    }

    let useResumeMatching = body.useResumeMatching || false

    if (!keywords || keywords.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Please provide valid search keywords' 
      }, { status: 400 })
    }

    console.log(`[JOB_SEARCH] User ${session.user.id} searching: "${keywords}" in ${location} (Resume matching: ${useResumeMatching})`)

    // CRITICAL FIX: Get cached jobs but ALWAYS search for new ones too
    const cachedJobs = await jobSearchCacheService.getCachedJobs({
      keywords,
      location,
      workType,
      experienceLevel,
      userId: session.user.id
    });

    if (cachedJobs && cachedJobs.length > 0) {
      console.log(`[JOB_CACHE] Found ${cachedJobs.length} cached jobs - will merge with NEW search results`);
    } else {
      console.log(`[JOB_CACHE] No cached jobs found - performing fresh search`);
    }

    let result: any
    let jobs: any[] = []
    let metadata: any = {}

    // Option 1: Resume-matched search with INDUSTRY WEIGHTING (most powerful)
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

        console.log(`[JOB_SEARCH] Using resume matching with industry weighting for user ${session.user.id}`)

        // ENTERPRISE FEATURE: Analyze career timeline for industry weighting
        let careerTimeline: any = null
        let effectivePrimaryIndustry: any = null
        
        // Skip industry analysis if user explicitly disabled it
        if (!disableIndustryWeighting) {
          try {
            careerTimeline = await PerplexityIntelligenceService.extractCareerTimeline(extractedText)
            console.log('[JOB_SEARCH] Career timeline:', {
              industries: careerTimeline.industries.map((i: any) => `${i.name} (${i.percentage}%)`).join(', '),
              primaryIndustry: careerTimeline.industries[0]?.name,
              hasTransition: !!careerTimeline.careerTransition,
              userTargetIndustry: targetIndustry || 'none'
            })
            
            // ENTERPRISE: User wants to switch industries
            if (targetIndustry && targetIndustry.trim()) {
              // Find matching industry from resume, or create synthetic one
              const normalizedTarget = targetIndustry.toLowerCase()
              effectivePrimaryIndustry = careerTimeline.industries.find(
                (i: any) => i?.name?.toLowerCase()?.includes(normalizedTarget)
              )

              if (effectivePrimaryIndustry) {
                console.log(`[JOB_SEARCH] User targeting industry switch TO: ${effectivePrimaryIndustry.name}`)
              } else {
                // User wants to switch to an entirely new industry not in their history
                console.log(`[JOB_SEARCH] User switching to NEW industry: ${targetIndustry} (no prior experience)`)
                effectivePrimaryIndustry = {
                  name: targetIndustry,
                  yearsOfExperience: 0,
                  keywords: keywords
                    .split(',')
                    .map((k: string) => k.trim())
                    .filter(Boolean),
                  percentage: 100 // Give full weight to target industry
                }
              }
            } else {
              // Default: Use longest-tenure industry
              effectivePrimaryIndustry = careerTimeline.industries[0]
            }
          } catch (err) {
            console.warn('[JOB_SEARCH] Career timeline extraction failed, using standard matching:', err)
          }
        } else {
          console.log('[JOB_SEARCH] Industry weighting DISABLED by user preference')
        }

        // CRITICAL: If career timeline exists, weight job results by industry tenure
        let industryWeightedLimit = limit
        
        if (effectivePrimaryIndustry) {
          // Calculate industry-based search distribution
          const primaryPercentage = effectivePrimaryIndustry.percentage / 100
          
          // EXAMPLE: If 95% of career in Transportation, show 95% transport jobs
          // UNLESS user is switching industries, then show 100% of new industry
          industryWeightedLimit = targetIndustry ? limit : Math.ceil(limit * primaryPercentage)
          
          console.log('[JOB_SEARCH] Industry weighting:', {
            primaryIndustry: effectivePrimaryIndustry.name,
            primaryPercentage: `${effectivePrimaryIndustry.percentage}%`,
            adjustedLimit: industryWeightedLimit,
            keywords: effectivePrimaryIndustry.keywords.join(', '),
            isSwitching: !!targetIndustry
          })
          
          // Boost keywords from target/primary industry
          const industryKeywords = effectivePrimaryIndustry.keywords.slice(0, 5).join(', ')
          keywords = `${industryKeywords}, ${keywords}`.trim()
        }

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
        
        // POST-PROCESSING: Re-rank jobs by industry tenure (respects user preferences)
        if (effectivePrimaryIndustry && !disableIndustryWeighting) {
          const primaryKeywords = effectivePrimaryIndustry.keywords.map((k: string) => k.toLowerCase())
          
          jobs = jobs.map((job: any) => {
            // Calculate industry match score
            const jobTitle = (job.title || '').toLowerCase()
            const jobDescription = (job.description || '').toLowerCase()
            const jobCompany = (job.company || '').toLowerCase()
            const fullText = `${jobTitle} ${jobDescription} ${jobCompany}`
            
            let industryMatchCount = 0
            primaryKeywords.forEach((keyword: string) => {
              if (fullText.includes(keyword)) industryMatchCount++
            })
            
            const industryMatchScore = industryMatchCount / primaryKeywords.length
            
            // Boost jobs from primary/target industry
            const originalScore = job.skillMatchScore || 0.5
            // If user is switching industries, give HIGHER boost (up to 75%)
            const boostMultiplier = targetIndustry ? 0.75 : 0.5
            const boostedScore = originalScore * (1 + industryMatchScore * boostMultiplier)
            
            return {
              ...job,
              skillMatchScore: Math.min(boostedScore, 1.0), // Cap at 1.0
              industryMatchScore,
              primaryIndustry: effectivePrimaryIndustry.name,
              isSwitchingIndustries: !!targetIndustry
            }
          }).sort((a: any, b: any) => (b.skillMatchScore || 0) - (a.skillMatchScore || 0)) // Re-sort by boosted score
          
          const matchedJobs = jobs.filter((j: any) => j.industryMatchScore > 0.3).length
          console.log(`[JOB_SEARCH] Applied industry weighting boost to ${jobs.length} jobs (${matchedJobs} strong matches)`)
        }
        
        metadata = {
          ...result.metadata,
          useResumeMatching: true,
          skillMatchingEnabled: true,
          industryWeighting: effectivePrimaryIndustry ? {
            primaryIndustry: effectivePrimaryIndustry.name,
            primaryPercentage: effectivePrimaryIndustry.percentage,
            careerTransition: careerTimeline?.careerTransition,
            userTargetIndustry: targetIndustry || null,
            disabledByUser: disableIndustryWeighting || false
          } : null
        }

        console.log(`[JOB_SEARCH] Resume matching found ${jobs.length} jobs with skill scores and industry weighting`)

      } catch (error) {
        console.error('[JOB_SEARCH] Resume matching failed, falling back to standard search:', error)
        // Fall back to standard search
        useResumeMatching = false
      }
    }

    // Option 2: Standard job listing search (25+ boards)
    if (!useResumeMatching || jobs.length === 0) {
      console.log(`[JOB_SEARCH] Using standard search across 25+ boards`)

      const jobsResult = await PerplexityIntelligenceService.jobListings(
        keywords,
        location,
        {
          boards: sources,
          limit,
          includeCanadianOnly: location.toLowerCase().includes('canada')
        }
      )

      jobs = Array.isArray(jobsResult) ? jobsResult : []
      console.log(`[JOB_SEARCH] Standard search returned type: ${typeof jobsResult}, isArray: ${Array.isArray(jobsResult)}, length: ${jobs.length}`)

      metadata = {
        useResumeMatching: false,
        searchedBoards: sources?.length || 15,
        canadianPriority: location.toLowerCase().includes('canada')
      }

      console.log(`[JOB_SEARCH] Standard search found ${jobs.length} jobs`)
      if (jobs.length > 0) {
        console.log(`[JOB_SEARCH] First job sample:`, JSON.stringify(jobs[0]).substring(0, 200))
      }
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

    // IMPROVED: Mark confidential jobs instead of filtering them out
    const processedJobs = jobs.map((job: any) => {
      const company = (job.company || '').toLowerCase().trim()
      const title = (job.title || '').toLowerCase().trim()
      
      // Only filter out COMPLETELY invalid jobs (empty title/company)
      const isCompletelyInvalid = (company === '' && title === '')
      
      // Mark confidential companies but keep them
      const confidentialCompanies = ['confidential', 'confidential company', 'undisclosed', 'private']
      const isConfidential = confidentialCompanies.includes(company)
      
      return {
        ...job,
        isConfidential,
        isCompletelyInvalid,
        note: isConfidential ? 'Company name not disclosed in posting' : undefined
      }
    }).filter((job: any) => !job.isCompletelyInvalid) // Only filter completely invalid

    console.log(`[JOB_SEARCH] Processed ${jobs.length} jobs, ${processedJobs.filter((j: any) => j.isConfidential).length} marked as confidential, ${processedJobs.length} total kept`)

    // 🚀 NEW: Cache the search results for 3 weeks
    if (processedJobs.length > 0) {
      await jobSearchCacheService.cacheSearchResults(
        {
          keywords,
          location,
          workType,
          experienceLevel,
          userId: session.user.id
        },
        processedJobs
      );
      console.log(`[JOB_CACHE] ✅ Cached ${processedJobs.length} jobs for future searches`);
    }

    // Get recommended boards for this location
    const recommendations = PerplexityIntelligenceService.getRecommendedBoards(location)

    return NextResponse.json({
      success: true,
      query: { keywords, location, sources },
      totalResults: processedJobs.length,
      returnedResults: processedJobs.length,
      jobs: processedJobs.slice(0, limit),
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

