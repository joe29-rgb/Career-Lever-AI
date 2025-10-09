import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { z } from 'zod'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { getOrCreateRequestId, logRequestStart, logRequestEnd, now, durationMs, logAIUsage } from '@/lib/observability'
import { redisGetJSON, redisSetJSON } from '@/lib/redis'
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

    const rl = await isRateLimited((session.user as any).id, 'company:orchestrate')
    if (rl) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

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
    let { companyName, jobPostingUrl, companyWebsite, linkedinCompanyUrl, roleHints, locationHint, jobTitle } = parsed.data as any
    
    // CRITICAL FIX: Sanitize company name (remove noise from PDF extraction)
    const originalCompanyName = companyName
    companyName = companyName
      .replace(/\s*\(.*?\)\s*/g, '') // Remove text in parentheses
      .replace(/\s*-.*$/g, '') // Remove everything after dash
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .split(/\s+/)
      .slice(0, 5) // Max 5 words
      .join(' ')
    
    console.log('[COMPANY_ORCHESTRATE] Sanitized:', {
      original: originalCompanyName,
      sanitized: companyName,
      changed: originalCompanyName !== companyName
    })

    // Redis cache: key by companyName+jobPostingUrl
    const cacheKey = `company:orchestrate:${companyName}:${jobPostingUrl || ''}`
    const cached = await redisGetJSON<any>(cacheKey)
    if (cached) {
      logRequestEnd(routeKey, requestId, 200, durationMs(startedAt), { cache: 'hit' })
      return NextResponse.json({ success: true, result: cached, cache: 'hit' })
    }

    // Compose research and OSINT (V2)
    const researchV2 = await PerplexityIntelligenceService.researchCompanyV2({ company: companyName, role: jobTitle, geo: locationHint })
    const research = researchV2.data
    // Try comprehensive scrape (will attempt website discovery internally)
    let scraped: any = null
    try { scraped = await webScraper.scrapeCompanyData(companyName, companyWebsite) } catch {}
    // Supplemental: Glassdoor summary and contacts
    let summary = null as any
    try { summary = await webScraper.scrapeGlassdoorReviewsSummary(companyName) } catch {}
    let contacts: { site: { emails: string[]; phones: string[]; addresses: string[] }; people: any[] } = { site: { emails: [], phones: [], addresses: [] }, people: [] as any[] }
    try {
      let site = { emails: [] as string[], phones: [] as string[], addresses: [] as string[] }
      if (scraped?.contactInfo) {
        site = scraped.contactInfo
      } else if (companyWebsite) {
        try { site = await webScraper.scrapeContactInfoFromWebsite(companyWebsite) } catch {}
      }
      const peopleWeb = await webScraper.searchHiringContacts(companyName, roleHints, locationHint)
      const peoplePpxV2 = await PerplexityIntelligenceService.hiringContactsV2(companyName)
      const peoplePpx = peoplePpxV2.data || []
      const mergedPeople = [...(peopleWeb || []), ...(peoplePpx || [])]
      contacts = { site, people: mergedPeople }
    } catch {}
    // Infer company domain for email pattern if missing
    try {
      const domain = (scraped?.website || companyWebsite || '').replace(/^https?:\/\//,'').replace(/\/$/,'')
      if (domain && contacts.people?.length) {
        contacts.people = contacts.people.map((p: any) => {
          if (!p.email && p.name && /\s/.test(p.name)) {
            const parts = p.name.toLowerCase().split(/\s+/)
            const inferred = `${parts[0]}.${parts[parts.length-1]}@${domain}`
            return { ...p, email: inferred, emailType: 'inferred' }
          }
          return p
        })
      }
    } catch {}
    const result = { ...(scraped || {}), ...research, summary, contacts }
    await redisSetJSON(cacheKey, result, 60 * 30)
    logRequestEnd(routeKey, requestId, 200, durationMs(startedAt), { cache: 'miss' })
    return NextResponse.json({ success: true, result })
  } catch (e) {
    console.error('Company orchestrate error:', e)
    return NextResponse.json({ error: 'Failed to orchestrate company research' }, { status: 500 })
  }
}


