import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { webScraper } from '@/lib/web-scraper'
import connectToDatabase from '@/lib/mongodb'
import Profile from '@/models/Profile'
import Resume from '@/models/Resume'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export const dynamic = 'force-dynamic'

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    p.then(v => { clearTimeout(t); resolve(v) }).catch(e => { clearTimeout(t); reject(e) })
  })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(()=>({})) as any
    const keywordsStr: string = (body.keywords || '').toString()
    const locationsStr: string = (body.locations || '').toString()
    const radiusKm: number = typeof body.radiusKm === 'number' ? Math.max(1, Math.min(500, body.radiusKm)) : 25
    const days: number = typeof body.days === 'number' ? Math.max(1, Math.min(90, body.days)) : 14
    const limitPerQuery: number = typeof body.limit === 'number' ? Math.max(5, Math.min(50, body.limit)) : 20
    const timeoutMs: number = typeof body.timeoutMs === 'number' ? Math.max(30000, Math.min(180000, body.timeoutMs)) : 120000
    const mode: 'speed'|'quality' = body.mode === 'quality' ? 'quality' : 'speed'
    const filters = body.filters || {}

    const keywords = keywordsStr.split(',').map((s: string) => s.trim()).filter(Boolean)
    const locations = locationsStr.split(',').map((s: string) => s.trim()).filter(Boolean)
    if (!keywords.length && !locations.length) {
      return NextResponse.json({ error: 'Provide at least one keyword or location' }, { status: 400 })
    }

    const afterDate = new Date(Date.now() - days*24*60*60*1000).toISOString().slice(0,10)
    const resultsAll: Array<{ title?: string; url: string; snippet?: string; source: string; company?: string; location?: string }> = []

    // Build simple cartesian of keywords x locations; if either empty, run with the other
    const kwList = keywords.length ? keywords : ['']
    const locList = locations.length ? locations : ['']

    for (const kw of kwList) {
      for (const loc of locList) {
        try {
          const opts: any = {
            jobTitle: (kw && kw.length > 0) ? kw : 'jobs',
            after: afterDate,
            excludeSenior: true,
            limit: limitPerQuery,
            radiusKm,
          }
          if (loc && loc.length > 0) opts.location = loc
          const res = await withTimeout(webScraper.searchJobsByGoogle(opts), timeoutMs)
          resultsAll.push(...res)
        } catch (err) {
          console.error('Autopilot search error for query', { kw, loc, radiusKm, afterDate }, err)
        }
        if (resultsAll.length >= 200) break
      }
      if (resultsAll.length >= 200) break
    }

    // If results are thin, try quick SEARCH API first, then resume-aware deep analysis
    try {
      if (resultsAll.length < 10) {
        // Quick domain-filtered search
        const q = `${(keywords[0] || 'jobs')} ${locations[0] || ''}`.trim()
        if (q.length > 0) {
          const quick = await withTimeout(PerplexityIntelligenceService.jobQuickSearch(q, ['indeed.ca','linkedin.com','jobbank.gc.ca','workopolis.com','eluta.ca'], 20, 'month'), Math.min(timeoutMs, 60000))
          for (const j of quick) {
            resultsAll.push({ title: j.title, url: j.url, snippet: j.snippet, source: j.source || 'perplexity', company: undefined, location: locations[0] })
            if (resultsAll.length >= 40) break
          }
        }
        await connectToDatabase()
        const resume = await Resume.findOne({ userId: (session.user as any).id }).sort({ createdAt: -1 }).lean()
        const resumeText = (resume?.extractedText || '').toString().slice(0, 8000)
        if (resumeText && locations.length && mode === 'quality') {
          const ppxV2 = await withTimeout(
            PerplexityIntelligenceService.jobMarketAnalysisV2(locations[0], resumeText, {
              roleHint: keywords[0] || undefined,
              workType: filters.workType || 'any',
              experienceLevel: filters.experienceLevel || 'any',
              salaryMin: typeof filters.salaryMin === 'number' ? filters.salaryMin : undefined,
              maxResults: typeof filters.maxResults === 'number' ? filters.maxResults : 15,
            }),
            Math.min(timeoutMs + 30000, 180000)
          )
          for (const j of ppxV2.data || []) {
            resultsAll.push({
              title: j.title,
              url: j.url,
              snippet: Array.isArray(j.skills) ? j.skills.join(', ') : '',
              source: 'perplexity',
              company: j.company,
              location: j.location
            })
          }
        }
      }
    } catch (e) {
      console.error('Autopilot PPX augmentation failed', e)
    }

    // De-dupe by normalized URL
    const seen = new Set<string>()
    const results = resultsAll.filter(r => {
      const key = (r.url || '').split('#')[0]
      if (!key) return false
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 200)

    // Update profile autopilot meta (best-effort)
    try {
      await connectToDatabase()
      await Profile.findOneAndUpdate(
        { userId: (session.user as any).id },
        { $set: { autopilotMeta: { lastRunAt: new Date(), lastFound: results.length, nextRunAt: new Date(Date.now() + 24*60*60*1000) } } },
        { new: true }
      )
    } catch {}
    return NextResponse.json({ success: true, results, meta: { queries: kwList.length * locList.length || Math.max(kwList.length, locList.length), afterDate, radiusKm } })
  } catch (e) {
    console.error('Autopilot search fatal error', e)
    return NextResponse.json({ error: 'Autopilot search failed' }, { status: 500 })
  }
}


