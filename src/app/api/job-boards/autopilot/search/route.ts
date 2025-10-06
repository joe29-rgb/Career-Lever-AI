import { PerplexityJobSearchService } from '@/lib/perplexity-job-search'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import Resume from '@/models/Resume'
import Profile from '@/models/Profile'
import { dbService } from '@/lib/database'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbService.connect()

  try {
    const { keywords, location, experienceLevel, remote, salaryMin, limit = 25 } = await request.json()

    // Use enhanced Perplexity job search
    const jobs = await PerplexityJobSearchService.searchCanadianJobs(
      keywords, 
      location, 
      { experienceLevel, remote: remote || false, salaryMin: salaryMin || 0, limit }
    )
    
    // Get market analysis
    const marketAnalysis = await PerplexityJobSearchService.analyzeJobMarket(keywords, location)
    
    return NextResponse.json({
      success: true,
      jobs: jobs,
      marketAnalysis: marketAnalysis,
      searchMeta: {
        query: `${keywords} in ${location}`,
        total: jobs.length,
        sources: Array.from(new Set(jobs.map(j => j.source))),
        searchedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Perplexity job search failed:', error)
    return NextResponse.json({ error: 'Job search failed' }, { status: 500 })
  }
}


