import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'
import { webScraper } from '@/lib/web-scraper'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rl = await isRateLimited((session.user as any).id, 'jobs:scrape:search')
    if (rl) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const schema = z.object({ searchUrl: z.string().url(), limit: z.number().min(1).max(50).default(20) })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { searchUrl, limit } = parsed.data as any

    const jobs = await webScraper.scrapeJobsFromSearchUrl(searchUrl, limit)
    return NextResponse.json({ success: true, jobs })
  } catch (e) {
    console.error('Scrape search error:', e)
    return NextResponse.json({ error: 'Failed to scrape search results' }, { status: 500 })
  }
}


