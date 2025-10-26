import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import Resume from '@/models/Resume'
import { dbService } from '@/lib/database'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbService.connect()

  try {
    const { keywords, location, experienceLevel, remote, salaryMin, limit = 25, useResumeMatching = false } = await request.json()

    console.log(`[AUTOPILOT_SEARCH] Starting autopilot job search for ${keywords} in ${location}`)

    let jobs: any[] = []
    let metadata: any = {}

    // Option 1: Resume-matched search (if user requests and has resume)
    if (useResumeMatching) {
      console.log(`[AUTOPILOT_SEARCH] Attempting resume-matched search for user ${session.user.id}`)
      
      const resumeDoc = await Resume.findOne({ userId: session.user.id }).sort({ createdAt: -1 }).lean()
      
      if (resumeDoc && (resumeDoc as any).extractedText) {
        console.log(`[AUTOPILOT_SEARCH] Found resume, performing AI skill matching`)
        
        const matchedJobsResponse = await PerplexityIntelligenceService.jobMarketAnalysisV2(
          location,
          (resumeDoc as any).extractedText,
          {
            roleHint: keywords,
            boards: undefined,
            maxResults: limit
          }
        )
        
        const matchedJobs = matchedJobsResponse.data || []
        
        jobs = matchedJobs.map((job: any) => ({
          ...job,
          id: job.id || `job-${Math.random().toString(36).substring(7)}`,
          skillMatchPercent: job.skillMatch,
          aiScore: job.score
        }))
        
        metadata = {
          useResumeMatching: true,
          resumeMatched: true,
          aiEnhanced: true
        }
        
        console.log(`[AUTOPILOT_SEARCH] Found ${jobs.length} matched jobs`)
      }
    }

    // Option 2: Standard job listing search (25+ boards)
    if (!useResumeMatching || jobs.length === 0) {
      console.log(`[AUTOPILOT_SEARCH] Using standard search across 25+ boards`)
      
      const locationStr = location || ''
      const isCanadian = locationStr.toLowerCase().includes('canada')
      
      jobs = (await PerplexityIntelligenceService.jobListings(
        keywords,
        locationStr,
        {
          boards: undefined,
          limit,
          includeCanadianOnly: isCanadian
        }
      )) as any[]
      
      metadata = {
        useResumeMatching: false,
        canadianPriority: isCanadian
      }
    }

    // Get recommended job boards
    const recommendations = PerplexityIntelligenceService.getRecommendedBoards(location || '')
    
    return NextResponse.json({
      success: true,
      jobs: jobs,
      recommendations,
      metadata: {
        ...metadata,
        query: `${keywords} in ${location}`,
        total: jobs.length,
        sources: Array.from(new Set(jobs.map(j => j.source || 'Perplexity'))),
        searchedAt: new Date().toISOString(),
        experienceLevel,
        remote,
        salaryMin
      }
    })
  } catch (error) {
    console.error('Autopilot job search failed:', error)
    return NextResponse.json({ 
      error: 'Job search failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


