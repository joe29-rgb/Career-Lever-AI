import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import { webScraper } from '@/lib/web-scraper'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const limiter = isRateLimited((session.user as any).id, 'jobs:import:url')
    if (limiter.limited) {
      return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })
    }
    const schema = z.object({ jobUrl: z.string().url() })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { jobUrl } = parsed.data

    // Try scraping the job detail page for title/company/description
    let scraped: any = null
    try { scraped = await webScraper.scrapeJobDetailFromUrl(jobUrl) } catch {}

    // Basic extraction heuristics (fallback)
    await connectToDatabase()
    const urlObj = new URL(jobUrl)
    const host = urlObj.hostname.replace('www.', '')
    const jobTitleGuess = scraped?.title || (host.includes('linkedin') ? 'Imported Role (LinkedIn)' : host.includes('indeed') ? 'Imported Role (Indeed)' : 'Imported Role')
    const companyGuess = scraped?.companyName || host.split('.')[0].replace(/\W+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    const app = new JobApplication({
      userId: (session.user as any).id,
      jobTitle: jobTitleGuess,
      companyName: companyGuess || 'Unknown Company',
      jobDescription: scraped?.description || 'Imported via URL. Analyze to tailor your resume.',
      jobUrl,
      applicationStatus: 'saved',
      followUpDates: []
    })
    await app.save()
    return NextResponse.json({ success: true, applicationId: app._id })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to import job' }, { status: 500 })
  }
}


