import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { z } from 'zod'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { getOrCreateRequestId, logRequestStart, logRequestEnd, now, durationMs, logAIUsage } from '@/lib/observability'
import { redisGetJSON, redisSetJSON } from '@/lib/redis'
import { webScraper } from '@/lib/web-scraper'
import { webScraper } from '@/lib/web-scraper'

// Perplexity-only orchestrator

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const requestId = getOrCreateRequestId(request.headers)
    const startedAt = now()
    const routeKey = 'company:orchestrate'
    logRequestStart(routeKey, requestId)
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = isRateLimited((session.user as any).id, 'company:orchestrate')
    if (rl.limited) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    // Inputs validated above

    const schema = z.object({
      companyName: z.string().min(2),
      jobPostingUrl: z.string().url().optional(),
      companyWebsite: z.string().url().optional(),
      linkedinCompanyUrl: z.string().url().optional(),
      roleHints: z.array(z.string()).default(['Recruiter','Talent Acquisition','Engineering Manager','Head of People']),
      locationHint: z.string().optional(),
      jobTitle: z.string().optional(),
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { companyName, jobPostingUrl, companyWebsite, linkedinCompanyUrl, roleHints, locationHint, jobTitle } = parsed.data as any

    // Redis cache: key by companyName+jobPostingUrl
    const cacheKey = `company:orchestrate:${companyName}:${jobPostingUrl || ''}`
    const cached = await redisGetJSON<any>(cacheKey)
    if (cached) {
      logRequestEnd(routeKey, requestId, 200, durationMs(startedAt), { cache: 'hit' })
      return NextResponse.json({ success: true, result: cached, cache: 'hit' })
    }

    // Compose research
    const research = await PerplexityIntelligenceService.researchCompany({ company: companyName, role: jobTitle, geo: locationHint })
    // Optional supplementary scraping (Glassdoor summary, contacts)
    let summary = null as any
    try { summary = await webScraper.scrapeGlassdoorReviewsSummary(companyName) } catch {}
    let contacts = { site: { emails: [], phones: [], addresses: [] }, people: [] as any[] }
    try {
      let site = { emails: [] as string[], phones: [] as string[], addresses: [] as string[] }
      if (companyWebsite) { try { site = await webScraper.scrapeContactInfoFromWebsite(companyWebsite) } catch {} }
      const people = await webScraper.searchHiringContacts(companyName, roleHints, locationHint)
      contacts = { site, people }
    } catch {}
    const result = { research, summary, contacts }
    await redisSetJSON(cacheKey, result, 60 * 30)
    logRequestEnd(routeKey, requestId, 200, durationMs(startedAt), { cache: 'miss' })
    return NextResponse.json({ success: true, result })
  } catch (e) {
    console.error('Company orchestrate error:', e)
    return NextResponse.json({ error: 'Failed to orchestrate company research' }, { status: 500 })
  }
}


