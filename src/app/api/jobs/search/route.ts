/**
 * Unified Job Search API - Enhanced with JobAggregator
 * 
 * NOW USES: JobAggregator with Supabase-first search strategy
 * 
 * Search Order:
 * 1. Redis Cache (instant)
 * 2. MongoDB Cache (fast)
 * 3. Supabase (1,249 jobs, <100ms)
 * 4. Cheerio/Puppeteer scrapers (if < 10 jobs, TOP 3 keywords)
 * 5. Perplexity (last resort, if still < 10 jobs)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { JobAggregator } from '@/lib/job-aggregator'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { isRateLimited } from '@/lib/rate-limit'
import Resume from '@/models/Resume'
import { jobSearchCacheService } from '@/services/job-search-cache.service'
import { validateJob } from '@/lib/validators/job-validator'
import { DataSanitizer } from '@/lib/validators/data-sanitizer'
import { deduplicateJobs } from '@/lib/job-deduplication'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60 // Increased to handle Perplexity API calls which can take longer

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
    // CRITICAL FIX: Parse body and validate location BEFORE authentication
    // This allows testing location validation without auth
    const body: JobSearchRequest = await request.json()
    let { 
      keywords, 
      location, 
      sources, 
      limit = 25, 
      remote,
      salaryMin,
      experienceLevel,
      workType,
      targetIndustry,
      disableIndustryWeighting
    } = body
    
    console.log('═══════════════════════════════════════════════════════')
    console.log('[JOB_SEARCH] NEW SEARCH REQUEST')
    console.log('═══════════════════════════════════════════════════════')
    console.log('[JOB_SEARCH] Job Title:', keywords)
    console.log('[JOB_SEARCH] Location:', location || 'UNDEFINED')
    console.log('[JOB_SEARCH] Max Results:', limit)
    console.log('[JOB_SEARCH] Work Type:', workType || 'any')
    console.log('─────────────────────────────────────────────────────────')

    // CRITICAL: Validate location BEFORE authentication check
    if (!location || location.trim().length < 2) {
      console.error('[JOB_SEARCH] ❌ MISSING LOCATION')
      return NextResponse.json({
        success: false,
        error: 'Location is required for job search',
        suggestion: 'Upload your resume to extract location, or manually enter city and state/province',
        errorCode: 'LOCATION_REQUIRED'
      }, { status: 400 })
    }

    // Reject "Canada" or "United States" (too broad)
    const normalizedLocation = location.toLowerCase().trim()
    if (['canada', 'united states', 'usa', 'us'].includes(normalizedLocation)) {
      console.error('[JOB_SEARCH] ❌ LOCATION TOO BROAD:', location)
      return NextResponse.json({
        success: false,
        error: 'Location is too broad. Please specify a city and state/province.',
        example: 'Examples: Seattle, WA or Toronto, ON or Vancouver, BC',
        errorCode: 'LOCATION_TOO_BROAD'
      }, { status: 400 })
    }

    console.log('[JOB_SEARCH] ✅ Location valid, proceeding with authentication...')

    // NOW check authentication after location validation passes
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
            keywords: effectivePrimaryIndustry.keywords?.join(', ') || 'none',
            isSwitching: !!targetIndustry
          })
          
          // Boost keywords from target/primary industry (if available)
          if (effectivePrimaryIndustry.keywords && Array.isArray(effectivePrimaryIndustry.keywords) && effectivePrimaryIndustry.keywords.length > 0) {
            const industryKeywords = effectivePrimaryIndustry.keywords.slice(0, 5).join(', ')
            keywords = `${industryKeywords}, ${keywords}`.trim()
          }
        }

        // Use JobAggregator (Supabase → Scrapers → Perplexity fallback)
        console.log('[JOB_SEARCH] Using JobAggregator (Supabase first):', {
          keywords: Array.isArray(keywords) ? keywords : [keywords],
          location,
          workType: workType || 'any',
          maxResults: limit
        })
        
        const aggregator = JobAggregator.getInstance()
        const aggregatorResult = await aggregator.searchJobs({
          keywords: Array.isArray(keywords) ? keywords : keywords.split(',').map((k: string) => k.trim()),
          location,
          workType: workType || 'any',
          maxResults: limit
        })

        console.log('[JOB_SEARCH] 🎯 JobAggregator result:', {
          jobsFound: aggregatorResult.jobs.length,
          source: aggregatorResult.source,
          cached: aggregatorResult.cached
        })

        // Convert JobListing format to expected format with validation
        jobs = aggregatorResult.jobs
          .filter(job => {
            // Validate required fields
            if (!job.title || !job.company || !job.url) {
              console.warn('[JOB_SEARCH] ⚠️ Skipping job with missing fields')
              return false
            }
            return true
          })
          .map(job => ({
            title: job.title,
            company: job.company,
            location: job.location || 'Location not specified',
            url: job.url,
            description: job.description || '',
            summary: job.description?.substring(0, 200) || 'No description available',
            salary: job.salary || null,
            postedDate: job.postedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            source: job.source || 'unknown',
            skillMatchPercent: job.skillMatchScore || 0,
            skills: job.skills || [],
            workType: job.workType || 'onsite'
          }))

        result = {
          success: true,
          data: jobs,
          cached: aggregatorResult.cached,
          metadata: {
            source: aggregatorResult.source,
            timestamp: aggregatorResult.timestamp
          }
        }
        
        // POST-PROCESSING: Re-rank jobs by industry tenure (respects user preferences)
        if (effectivePrimaryIndustry && !disableIndustryWeighting && effectivePrimaryIndustry.keywords && Array.isArray(effectivePrimaryIndustry.keywords)) {
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

    // Option 2: Standard job listing search (JobAggregator with Supabase)
    if (!useResumeMatching || jobs.length === 0) {
      console.log(`[JOB_SEARCH] Using JobAggregator for standard search (Supabase first)`, {
        keywords,
        location,
        limit,
        workType: workType || (remote ? 'remote' : undefined)
      })

      const aggregator = JobAggregator.getInstance()
      const aggregatorResult = await aggregator.searchJobs({
        keywords: Array.isArray(keywords) ? keywords : keywords.split(',').map((k: string) => k.trim()),
        location,
        workType: workType || 'any',
        maxResults: limit
      })

      console.log(`[JOB_SEARCH] JobAggregator returned:`, {
        source: aggregatorResult.source,
        cached: aggregatorResult.cached,
        jobCount: aggregatorResult.jobs.length,
        sample: aggregatorResult.jobs[0] ? {
          title: aggregatorResult.jobs[0].title,
          company: aggregatorResult.jobs[0].company,
          hasUrl: !!aggregatorResult.jobs[0].url
        } : null
      })

      // Convert JobListing format to expected format with validation
      const jobsResult = aggregatorResult.jobs
        .filter(job => {
          // Validate required fields
          if (!job.title || !job.company || !job.url) {
            console.warn('[JOB_SEARCH] ⚠️ Skipping job with missing fields')
            return false
          }
          return true
        })
        .map(job => ({
          title: job.title,
          company: job.company,
          location: job.location || 'Location not specified',
          url: job.url,
          description: job.description || '',
          summary: job.description?.substring(0, 200) || 'No description available',
          salary: job.salary || null,
          postedDate: job.postedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          source: job.source || 'unknown',
          skillMatchPercent: job.skillMatchScore || 0,
          skills: job.skills || [],
          workType: job.workType || 'onsite'
        }))

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
    let processedJobs = jobs.map((job: any) => {
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

    // 🚫 CRITICAL: REMOVE ALL CONFIDENTIAL JOBS - DO NOT SHOW THEM AT ALL
    const confidentialCount = processedJobs.filter((j: any) => j.isConfidential).length
    processedJobs = processedJobs.filter((j: any) => {
      const isConfidential = j.isConfidential || 
        j.title?.toLowerCase().includes('confidential') ||
        j.company?.toLowerCase().includes('confidential') ||
        j.company?.toLowerCase() === 'confidential'
      
      if (isConfidential) {
        console.log(`[JOB_SEARCH] 🚫 REJECTED CONFIDENTIAL JOB: "${j.title}" at "${j.company}"`)
      }
      
      return !isConfidential
    })
    
    console.log(`[JOB_SEARCH] Processed ${jobs.length} jobs, REJECTED ${confidentialCount} confidential jobs, ${processedJobs.length} valid jobs kept`)

    // CRITICAL FIX: Merge cached jobs with new results (remove duplicates by URL)
    let finalJobs = [...processedJobs]
    if (cachedJobs && cachedJobs.length > 0) {
      const newJobUrls = new Set(processedJobs.map((j: any) => j.url).filter(Boolean))
      // Also filter confidential from cached jobs
      const uniqueCachedJobs = cachedJobs.filter((cj: any) => {
        const isConfidential = cj.isConfidential || 
          cj.title?.toLowerCase().includes('confidential') ||
          cj.company?.toLowerCase().includes('confidential') ||
          cj.company?.toLowerCase() === 'confidential'
        return !newJobUrls.has(cj.url) && !isConfidential
      })
      finalJobs = [...processedJobs, ...uniqueCachedJobs]
      console.log(`[JOB_CACHE] Merged ${uniqueCachedJobs.length} unique cached jobs with ${processedJobs.length} new jobs = ${finalJobs.length} total`)
    }

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

    // ✅ FIX #4: VALIDATE each job
    console.log(`[JOB_SEARCH] Validating ${finalJobs.length} jobs...`)
    console.log('[JOB_SEARCH] Sample job data:', finalJobs[0] ? {
      title: finalJobs[0].title,
      company: finalJobs[0].company,
      descLength: finalJobs[0].description?.length || 0,
      url: finalJobs[0].url
    } : 'No jobs to sample')
    
    const validatedJobs = finalJobs.filter((job: any) => {
      const validation = validateJob(job)
      if (!validation.valid) {
        console.log('[VALIDATOR] ❌ Rejected:', job.title, 'at', job.company)
        if (validation.issues && validation.issues.length > 0) {
          console.log('[VALIDATOR] Reasons:', validation.issues.join(', '))
        }
        console.log('[VALIDATOR] Job data:', {
          descLength: job.description?.length || 0,
          url: job.url,
          location: job.location
        })
        return false
      }
      return true
    })
    console.log(`[JOB_SEARCH] Validation: ${finalJobs.length} → ${validatedJobs.length}`)

    // ✅ FIX #5: DEDUPLICATE jobs
    const uniqueJobs = deduplicateJobs(validatedJobs)
    console.log(`[JOB_SEARCH] Deduplication: ${validatedJobs.length} → ${uniqueJobs.length}`)

    // ✅ FIX #4: SANITIZE output
    const sanitizedJobs = uniqueJobs.map((job: any) => DataSanitizer.sanitizeJobData(job))
    console.log(`[JOB_SEARCH] ✅ Final jobs: ${sanitizedJobs.length}`)

    // Get recommended boards for this location
    const recommendedBoards = PerplexityIntelligenceService.getRecommendedBoards(location)

    return NextResponse.json({
      success: true,
      query: { keywords, location, sources },
      totalResults: sanitizedJobs.length,
      returnedResults: Math.min(sanitizedJobs.length, limit),
      jobs: sanitizedJobs.slice(0, limit),
      metadata: {
        ...metadata,
        searchedAt: new Date().toISOString(),
        cachedResults: cachedJobs ? cachedJobs.length : 0,
        newResults: processedJobs.length,
        totalMerged: finalJobs.length,
        validated: validatedJobs.length,
        unique: uniqueJobs.length,
        final: sanitizedJobs.length
      },
      recommendations: {
        priorityBoards: recommendedBoards.slice(0, 5),
        reasoning: `Recommended job boards for ${location || 'your location'}`
      },
      sources: [...new Set(sanitizedJobs.map((j: any) => j.source || 'Unknown'))]
    })

  } catch (error: any) {
    console.error('❌❌❌ [JOB_SEARCH] CRITICAL ERROR ❌❌❌')
    console.error('[JOB_SEARCH] Error type:', error?.constructor?.name)
    console.error('[JOB_SEARCH] Error message:', error?.message)
    console.error('[JOB_SEARCH] Error stack:', error?.stack)
    
    // Get session for error logging
    const session = await getServerSession(authOptions)
    console.error('[JOB_SEARCH] User ID:', session?.user?.id)
    
    return NextResponse.json({ 
      error: 'Job search failed', 
      details: error?.message || 'Unknown error',
      errorType: error?.constructor?.name,
      timestamp: new Date().toISOString()
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
        totalBoards: boards.length
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

