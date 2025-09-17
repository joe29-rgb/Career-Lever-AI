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
    const routeKey = 'company:contacts'
    logRequestStart(routeKey, requestId)
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rl = isRateLimited((session.user as any).id, 'company:contacts')
    if (rl.limited) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const schema = z.object({
      companyName: z.string().min(2),
      companyWebsite: z.string().url().optional(),
      roleHints: z.array(z.string()).min(1),
      locationHint: z.string().optional()
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { companyName, companyWebsite, roleHints, locationHint } = parsed.data as any

    // Redis cache
    const cacheKey = `company:contacts:${companyName}:${(companyWebsite||'').slice(0,80)}:${(roleHints||[]).join(',').slice(0,120)}:${locationHint||''}`
    const cached = await redisGetJSON<any>(cacheKey)
    if (cached) {
      logRequestEnd(routeKey, requestId, 200, durationMs(startedAt), { cache: 'hit' })
      return NextResponse.json({ success: true, contacts: cached, cache: 'hit' })
    }

    // Scrape website contact info (best-effort)
    let siteContacts = { emails: [] as string[], phones: [] as string[], addresses: [] as string[] }
    if (companyWebsite) {
      try { siteContacts = await webScraper.scrapeContactInfoFromWebsite(companyWebsite) } catch {}
    }

    // Find likely hiring contacts via Google→LinkedIn
    const hiring = await webScraper.searchHiringContacts(companyName, roleHints, locationHint)

    const contacts = { site: siteContacts, people: hiring }
    await redisSetJSON(cacheKey, contacts, 60 * 30)
    logRequestEnd(routeKey, requestId, 200, durationMs(startedAt), { cache: 'miss' })
    return NextResponse.json({ success: true, contacts })
  } catch (e) {
    console.error('Company contacts error:', e)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}


