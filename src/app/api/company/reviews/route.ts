import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { webScraper } from '@/lib/web-scraper'
import { z } from 'zod'
import { getOrCreateRequestId, logRequestStart, logRequestEnd, now, durationMs } from '@/lib/observability'
import { redisGetJSON, redisSetJSON } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const requestId = getOrCreateRequestId(request.headers as any)
    const startedAt = now()
    const routeKey = 'company:reviews'
    logRequestStart(routeKey, requestId)
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rl = await isRateLimited((session.user as any).id, 'company:reviews')
    if (rl) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const schema = z.object({ companyName: z.string().min(2) })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { companyName } = parsed.data as any
    const cacheKey = `company:reviews:${companyName}`
    const cached = await redisGetJSON<any>(cacheKey)
    if (cached) {
      logRequestEnd(routeKey, requestId, 200, durationMs(startedAt), { cache: 'hit' })
      const resp = NextResponse.json({ success: true, summary: cached, cache: 'hit' })
      resp.headers.set('x-request-id', requestId)
      return resp
    }
    const summary = await webScraper.scrapeGlassdoorReviewsSummary(companyName)
    await redisSetJSON(cacheKey, summary, 60 * 60)
    logRequestEnd(routeKey, requestId, 200, durationMs(startedAt), { cache: 'miss' })
    const resp2 = NextResponse.json({ success: true, summary })
    resp2.headers.set('x-request-id', requestId)
    return resp2
  } catch (e) {
    console.error('Company reviews error:', e)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}


