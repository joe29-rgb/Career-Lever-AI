import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { EnhancedCanadianJobScraper } from '@/lib/enhanced-canadian-scraper'
import Resume from '@/models/Resume'
import Profile from '@/models/Profile'
import connectToDatabase from '@/lib/mongodb' // Default import

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { keywords = '', locations = 'Edmonton, AB', radiusKm = 75, days = 10, limit = 20 } = body

    if (!keywords || !locations) {
      return NextResponse.json({ error: 'Missing keywords or location' }, { status: 400 })
    }

    console.log('[AUTOPILOT] Search params:', { keywords, locations, radiusKm, days, limit })

    const scraper = new EnhancedCanadianJobScraper()
    const scrapedJobs = await scraper.combineAllSources(keywords, locations)

    // Perplexity quick search for additional results
    const perplexityJobs = await PerplexityIntelligenceService.jobQuickSearch(
      `${keywords} ${locations}`,
      ['jobbank.gc.ca', 'ca.indeed.com'],
      Math.max(0, limit - scrapedJobs.length),
      `${days}d`
    )

    const allJobs = [...scrapedJobs, ...perplexityJobs]

    // Dedupe by title + company (case-insensitive)
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j =>
        j.title.toLowerCase().includes(job.title.toLowerCase()) &&
        j.company.toLowerCase().includes(job.company.toLowerCase())
      )
    )

    // Filter recent jobs (< days old)
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
    const recentJobs = uniqueJobs.filter(job => {
      const postedDate = new Date(job.postedDate || job.date || Date.now()).getTime()
      return postedDate >= cutoff
    })

    // Prioritize Canadian locations
    const canadianJobs = recentJobs.filter(job =>
      (job.location || '').includes('AB') || (job.location || '').includes('ON') || (job.location || '').includes('BC') || // Provinces
      (job.location || '').toLowerCase().includes('canada') || (job.location || '').toLowerCase().includes('edmonton')
    )

    console.log('[AUTOPILOT] Scraped:', scrapedJobs.length, 'Perplexity:', perplexityJobs.length, 'Unique recent Canadian:', canadianJobs.length)

    // Save search metadata to profile for analytics
    await Profile.findOneAndUpdate(
      { userId: session.user.id },
      {
        $set: {
          lastSearch: {
            keywords,
            locations,
            timestamp: new Date(),
            resultsCount: canadianJobs.length,
            sources: { scraped: scrapedJobs.length, perplexity: perplexityJobs.length }
          }
        },
        $push: { searchHistory: { keywords, locations, results: canadianJobs.length, date: new Date() } }
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      results: canadianJobs.slice(0, limit),
      metadata: {
        scraped: scrapedJobs.length,
        perplexity: perplexityJobs.length,
        unique: uniqueJobs.length,
        canadian: canadianJobs.length
      }
    })

  } catch (error) {
    console.error('[AUTOPILOT] Search failed:', error)
    // Fallback to small mock set for grace
    return NextResponse.json({
      success: true,
      results: [
        {
          title: 'Software Developer - Edmonton',
          company: 'Local Tech Firm',
          location: 'Edmonton, AB',
          url: 'https://jobbank.gc.ca/jobsearch/jobposting123',
          postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'Job Bank Fallback'
        }
      ],
      metadata: { error: (error as Error).message, fallback: true }
    }, { status: 200 }) // Graceful degradation
  }
}


