import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import connectToDatabase from '@/lib/mongodb'
import Resume from '@/models/Resume'
import { z } from 'zod'
import { calculateMatchScore } from '@/lib/utils'
import { webScraper } from '@/lib/web-scraper'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rl = isRateLimited((session.user as any).id, 'jobs:recommend')
    if (rl.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: rl.reset }, { status: 429 })

    const schema = z.object({
      searchUrls: z.array(z.string().url()).min(1).max(5),
      limitPerSource: z.number().min(1).max(30).default(10)
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { searchUrls, limitPerSource } = parsed.data as any

    await connectToDatabase()
    const resume = await Resume.findOne({ userId: (session.user as any).id }).sort({ createdAt: -1 })
    const resumeText: string = resume?.extractedText || ''

    // Scrape each search page and combine
    const jobsArrays = await Promise.all(searchUrls.map((u: string) => webScraper.scrapeJobsFromSearchUrl(u, limitPerSource)))
    const allJobs = jobsArrays.flat().slice(0, limitPerSource * searchUrls.length)

    // Score and rank
    const ranked = allJobs.map(j => ({
      ...j,
      score: calculateMatchScore(`${j.title || ''} ${j.companyName || ''} ${j.snippet || ''}`, resumeText)
    })).sort((a,b)=> (b.score||0) - (a.score||0))

    return NextResponse.json({ success: true, recommendations: ranked })
  } catch (e) {
    console.error('Recommend error:', e)
    return NextResponse.json({ error: 'Failed to recommend jobs' }, { status: 500 })
  }
}


