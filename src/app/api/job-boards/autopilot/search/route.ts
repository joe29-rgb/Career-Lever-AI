import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { webScraper } from '@/lib/web-scraper'
import connectToDatabase from '@/lib/mongodb'
import Profile from '@/models/Profile'
import Resume from '@/models/Resume'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

const DEFAULT_AUTOPILOT_TIMEOUT_MS = Number(process.env.PPX_AUTOPILOT_TIMEOUT_MS || 120000)

export const dynamic = 'force-dynamic'

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    p.then(v => { clearTimeout(t); resolve(v) }).catch(e => { clearTimeout(t); reject(e) })
  })
}

// --- Helpers: robust keyword and location inference from full resume text ---
const STOPWORDS = new Set([
  'the','and','for','with','from','that','this','are','was','were','have','has','had','into','onto','over','under','while','during','within','without','between','among','about','your','their','our','its','his','her','they','them','you','i',
  'to','of','in','on','at','by','an','a','as','or','but','is','be','it','we','my','me','us','will','can','able','using','used','via','etc','per',
  // noise
  'https','http','www','com','linkedin','gmail','outlook','email','phone','linkedincom','httpps','joemcdonald','joe','mcdonald'
])

function inferLocationFromResumeText(text: string): string | undefined {
  try {
    const full = text.replace(/\s+/g, ' ')
    // City, Province code (Canada)
    const caCode = full.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*),\s*(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b/g)
    if (caCode && caCode.length) return caCode[0]
    // City, Province full name
    const provinces = '(Alberta|British Columbia|Ontario|Quebec|Saskatchewan|Manitoba|New Brunswick|Nova Scotia|Prince Edward Island|Newfoundland and Labrador)'
    const reFull = new RegExp(`([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)*),\\s*${provinces}`, 'g')
    const caFull = full.match(reFull)
    if (caFull && caFull.length) return caFull[0]
    // Location: City, Province
    const locLine = full.match(/Location[:\s-]+([A-Z][A-Za-z\s]+,\s*(?:[A-Z]{2}|[A-Za-z\s]+))/i)
    if (locLine && locLine[1]) return locLine[1].trim()
    // Canadian postal code hint near city
    const postal = full.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)[^\n]{0,40}\b([A-Z]\d[A-Z])\s?\d[A-Z]\d\b/)
    if (postal && postal[1]) return postal[1]
  } catch {}
  return undefined
}

function extractTopKeywords(resumeText: string, limit: number = 12): string[] {
  if (!resumeText) return []
  const cleaned = resumeText.replace(/https?:\/\/\S+/g, ' ').replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, ' ')
  const tokens = cleaned.match(/[A-Za-z][A-Za-z+\-]{3,}/g) || []
  const freq = new Map<string, number>()
  for (const raw of tokens) {
    const t = raw.toLowerCase()
    if (STOPWORDS.has(t)) continue
    // skip obvious noise
    if (t.length > 24) continue
    const score = (freq.get(t) || 0) + 1
    freq.set(t, score)
  }
  // boost tokens appearing near experience/responsibilities/achievements sections
  const lines = cleaned.split(/\n|\r/)
  const boostKeys = ['experience','responsibilities','achievements','projects','work','employment']
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (boostKeys.some(k => lower.includes(k))) {
      const ls = line.match(/[A-Za-z][A-Za-z+\-]{3,}/g) || []
      for (const raw of ls) {
        const t = raw.toLowerCase()
        if (STOPWORDS.has(t)) continue
        freq.set(t, (freq.get(t) || 0) + 1)
      }
    }
  }
  // Prefer domain-relevant terms: tech, sales, marketing, operations, finance
  const domainBoost = new Set(['engineer','developer','software','react','node','typescript','python','aws','sales','account','manager','marketing','campaign','seo','sem','operations','logistics','supply','finance','accounting','advisor','service','support','design','product'])
  domainBoost.forEach((t) => {
    if (freq.has(t)) freq.set(t, (freq.get(t) || 0) + 2)
  })
  const sorted = Array.from(freq.entries()).sort((a,b) => b[1] - a[1]).map(([k]) => k)
  // de-duplicate stems roughly (keep first occurrence)
  const seen = new Set<string>()
  const out: string[] = []
  for (const k of sorted) {
    const stem = k.replace(/(ing|ed|er|ers|s)$/,'')
    if (seen.has(stem)) continue
    seen.add(stem)
    out.push(k)
    if (out.length >= limit) break
  }
  return out
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(()=>({})) as any
    let keywordsStr: string = (body.keywords || '').toString()
    let locationsStr: string = (body.locations || '').toString()
    // Load profile preferences for defaults
    await connectToDatabase()
    const prof = await Profile.findOne({ userId: (session.user as any).id }).lean().exec().catch(()=>null as any)
    const ap = (prof as any)?.preferences?.autopilot || {}
    const radiusKm: number = typeof body.radiusKm === 'number' ? Math.max(1, Math.min(500, body.radiusKm)) : (typeof ap.radiusKm === 'number' ? ap.radiusKm : 150)
    const days: number = typeof body.days === 'number' ? Math.max(1, Math.min(90, body.days)) : (typeof ap.days === 'number' ? ap.days : 30)
    const limitPerQuery: number = typeof body.limit === 'number' ? Math.max(5, Math.min(50, body.limit)) : (typeof ap.maxResults === 'number' ? Math.max(5, Math.min(50, ap.maxResults)) : 20)
    const timeoutMs: number = typeof body.timeoutMs === 'number' ? Math.max(30000, Math.min(180000, body.timeoutMs)) : DEFAULT_AUTOPILOT_TIMEOUT_MS
    const mode: 'speed'|'quality' = body.mode === 'quality' ? 'quality' : 'speed'
    const filters = body.filters || {}
    const domains: string[] = Array.isArray(body.domains) ? body.domains.filter((d: string)=> typeof d === 'string' && d.includes('.')).slice(0, 12) : []

    // Infer missing inputs from profile and resume to avoid empty searches
    if (!locationsStr && (prof as any)?.location) {
      locationsStr = String((prof as any).location)
    }
    // Try to infer keywords from resume text if not provided (via PPX NLP extraction, fallback to weighted local)
    if (!keywordsStr) {
      try {
        const resumeDoc = await Resume.findOne({ userId: (session.user as any).id }).sort({ createdAt: -1 }).lean<import('@/models/Resume').IResume>()
        const txt = (resumeDoc && typeof (resumeDoc as any).extractedText === 'string') ? (resumeDoc as any).extractedText : ''
        if (txt && txt.length > 50) {
          // Primary: ask Perplexity to extract signals from full resume
          try {
            const signals = await PerplexityIntelligenceService.extractResumeSignals(txt, 18)
            if (Array.isArray(signals.keywords) && signals.keywords.length) {
              keywordsStr = signals.keywords.join(', ')
            }
            if (!locationsStr && signals.location) {
              locationsStr = signals.location
            }
          } catch {}
          // Fallback: local extraction
          if (!keywordsStr) {
            const top = extractTopKeywords(txt, 12)
            if (top.length) keywordsStr = top.join(', ')
          }
          if (!locationsStr) {
            const loc = inferLocationFromResumeText(txt)
            if (loc) locationsStr = loc
          }
        }
      } catch {}
    }
    let keywords = keywordsStr.split(',').map((s: string) => s.trim()).filter(Boolean)
    const locations = locationsStr.split(',').map((s: string) => s.trim()).filter(Boolean)
    // Remove location tokens from keywords to avoid noise like city/province in keywords
    if (locations.length && keywords.length) {
      const locTokens = new Set<string>(locations.join(' ').toLowerCase().split(/[^a-zA-Z]+/).filter(t=>t.length>=2))
      keywords = keywords.filter(k => !locTokens.has(k.toLowerCase()))
    }
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
          // Run scraper and quick search in parallel, take both best-effort
          const scraperTimeout = Math.min(timeoutMs, 30000)
          const searchTimeout = Math.min(timeoutMs, 15000)
          const q = `${(kw || 'jobs')} ${loc || ''}`.trim()
          const tasks: Array<Promise<any>> = [
            withTimeout(webScraper.searchJobsByGoogle(opts), scraperTimeout).catch(()=>[]),
            (q ? withTimeout(PerplexityIntelligenceService.jobQuickSearch(q, (domains.length ? domains : ['indeed.ca','linkedin.com','jobbank.gc.ca','workopolis.com','eluta.ca','jobboom.com','glassdoor.ca']), 20, 'month'), searchTimeout).catch(()=>[]) : Promise.resolve([]))
          ]
          const settled = await Promise.allSettled(tasks)
          for (const s of settled) {
            if (s.status === 'fulfilled' && Array.isArray(s.value)) {
              const arr = s.value
              // Normalize quick search shape if present
              for (const j of arr) {
                if (j && typeof j === 'object') {
                  const title = (j.title as string) || (j.position as string) || (j.name as string) || undefined
                  const url = (j.url as string) || (j.link as string)
                  const company = (j.company as string) || (j.companyName as string) || undefined
                  const location = (j.location as string) || (loc || undefined)
                  if (url) resultsAll.push({ title, url, company, location, source: (j.source as string) || 'perplexity' })
                }
              }
            }
          }
        } catch (err) {
          console.warn('Autopilot search error for query', { kw, loc, radiusKm, afterDate }, err instanceof Error ? err.message : err)
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
          const quick = await withTimeout(PerplexityIntelligenceService.jobQuickSearch(q, ['indeed.ca','linkedin.com','jobbank.gc.ca','workopolis.com','eluta.ca','glassdoor.ca','jobboom.com'], 25, 'month'), Math.min(timeoutMs, 60000))
          for (const j of quick) {
            resultsAll.push({ title: j.title, url: j.url, snippet: j.snippet, source: j.source || 'perplexity', company: undefined, location: locations[0] })
            if (resultsAll.length >= 40) break
          }
          // If still thin, relax recency to year for broader coverage
          if (resultsAll.length < 10) {
            const quickYear = await withTimeout(PerplexityIntelligenceService.jobQuickSearch(q, ['indeed.ca','linkedin.com','jobbank.gc.ca','workopolis.com','eluta.ca','glassdoor.ca','jobboom.com'], 25, 'year'), Math.min(timeoutMs, 60000)).catch(()=>[] as any[])
            for (const j of quickYear) {
              resultsAll.push({ title: j.title, url: j.url, snippet: j.snippet, source: j.source || 'perplexity', company: undefined, location: locations[0] })
              if (resultsAll.length >= 50) break
            }
          }
        }
        await connectToDatabase()
        const resume = await Resume.findOne({ userId: (session.user as any).id }).sort({ createdAt: -1 }).lean<import('@/models/Resume').IResume>()
        const resumeText = ((resume && typeof (resume as any).extractedText === 'string') ? (resume as any).extractedText : '').toString().slice(0, 8000)
        // Try simple AI job listing retrieval regardless of mode when results are still thin
        if (resultsAll.length < 10 && locations.length && (keywords[0] || '')) {
          const jlRaw = await withTimeout(PerplexityIntelligenceService.jobListings((keywords[0] || 'job').toString(), locations[0]), Math.min(timeoutMs, 60000)).catch(()=>[] as any[])
          const jl = Array.isArray(jlRaw) ? jlRaw : []
          for (const j of jl) {
            resultsAll.push({ title: j.title, url: j.url, snippet: j.summary, source: 'perplexity', company: j.company, location: j.location })
            if (resultsAll.length >= 60) break
          }
        }
        // Finally, run deeper analysis even in speed mode if still insufficient
        if (resumeText && locations.length && resultsAll.length < 10) {
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
              source: j.source || 'perplexity',
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


