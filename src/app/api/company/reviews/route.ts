import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { webScraper } from '@/lib/web-scraper'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rl = isRateLimited((session.user as any).id, 'company:reviews')
    if (rl.limited) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const schema = z.object({ companyName: z.string().min(2) })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { companyName } = parsed.data as any
    const summary = await webScraper.scrapeGlassdoorReviewsSummary(companyName)
    return NextResponse.json({ success: true, summary })
  } catch (e) {
    console.error('Company reviews error:', e)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}


