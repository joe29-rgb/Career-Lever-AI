import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Resume from '@/models/Resume'
import { webScraper } from '@/lib/web-scraper'
import { extractKeywords, calculateMatchScore } from '@/lib/utils'
import crypto from 'crypto'
import { PerplexityService } from '@/lib/perplexity-service'
import { getOrCreateRequestId, logRequestStart, logRequestEnd, now, durationMs } from '@/lib/observability'

export const dynamic = 'force-dynamic'
let redis: any = null
if (process.env.REDIS_URL) {
  try {
    const { createClient } = require('redis')
    redis = createClient({ url: process.env.REDIS_URL })
    redis.on('error', () => {})
    redis.connect().catch(()=>{})
  } catch {}
}

async function embed(_text: string): Promise<number[] | null> { return null }

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i=0; i<Math.min(a.length,b.length); i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i] }
  if (!na || !nb) return 0
  return dot / (Math.sqrt(na)*Math.sqrt(nb))
}

async function cacheGet(key: string): Promise<any|undefined> {
  try { if (!redis) return undefined; const raw = await redis.get(key); return raw ? JSON.parse(raw) : undefined } catch { return undefined }
}
async function cacheSet(key: string, value: any, ttlSec = 600) {
  try { if (!redis) return; await redis.setEx(key, ttlSec, JSON.stringify(value)) } catch {}
}

function makeResponseKey(resumeText: string, jobs: any[]): string {
  const urls = jobs.map((j:any)=> j.url || '').filter(Boolean).sort().join('|')
  const h = crypto.createHash('sha256').update((resumeText || '').slice(0, 2000) + '||' + urls.slice(0, 8000)).digest('hex')
  return 'rank:resp:' + h
}

export async function POST(req: NextRequest) {
  try {
    const requestId = getOrCreateRequestId(req.headers as any)
    const startedAt = now()
    const routeKey = 'jobs:rank'
    logRequestStart(routeKey, requestId)
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { jobs, resumeId } = body || {}
    if (!Array.isArray(jobs) || jobs.length === 0) return NextResponse.json({ error: 'jobs array required' }, { status: 400 })

    await connectToDatabase()
    let resume = null as any
    if (resumeId) {
      resume = await Resume.findOne({ _id: resumeId, userId: (session.user as any).id }).lean()
    }
    if (!resume) {
      resume = await Resume.findOne({ userId: (session.user as any).id }).sort({ createdAt: -1 }).lean()
    }
    const resumeText = (resume?.extractedText || '').toString()
    if (!resumeText || resumeText.length < 50) return NextResponse.json({ error: 'Resume text not available' }, { status: 400 })

    // Whole-response cache
    try {
      const respKey = makeResponseKey(resumeText, jobs)
      const cached = await cacheGet(respKey)
      if (cached && Array.isArray(cached.rankings)) {
        const respCached = NextResponse.json({ success: true, rankings: cached.rankings })
        respCached.headers.set('x-request-id', requestId)
        logRequestEnd(routeKey, requestId, 200, durationMs(startedAt))
        return respCached
      }
    } catch {}

    const out: Array<{ url: string; title?: string; companyName?: string; score: number; reasons: string[] }> = []
    const resumeEmb = await embed(resumeText)
    for (const j of jobs.slice(0, 30)) {
      const url: string = j.url || ''
      let title: string | undefined = j.title
      let companyName: string | undefined = j.companyName
      let description: string | undefined = (j as any).description
      try {
        if (!description || description.length < 40) {
          const det = await webScraper.scrapeJobDetailFromUrl(url)
          title = title || det.title
          companyName = companyName || det.companyName
          description = det.description || description
        }
      } catch {}

      const jd = (description || title || '').toString()
      // Cache key
      const ck = 'rank:' + crypto.createHash('sha256').update(resumeText.slice(0,2000) + '||' + jd.slice(0,2000)).digest('hex')
      const cached = await cacheGet(ck)
      if (cached) { out.push({ url, title, companyName, score: cached.score, reasons: cached.reasons }); continue }

      // Hybrid score: keyword + embeddings (if available)
      const kwScore = calculateMatchScore(resumeText, jd) // 0..100
      let embScore = 0
      if (resumeEmb) {
        const jdEmb = await embed(jd)
        if (jdEmb) embScore = Math.round(Math.max(0, Math.min(1, cosine(resumeEmb, jdEmb))) * 100)
      }
      const score = Math.round(kwScore * 0.8 + embScore * 0.2)
      const jdKeywords = extractKeywords(jd)
      const resumeLower = resumeText.toLowerCase()
      const matched = jdKeywords.filter(k => resumeLower.includes(k.toLowerCase())).slice(0, 10)
      const missing = jdKeywords.filter(k => !resumeLower.includes(k.toLowerCase())).slice(0, 10)
      const reasons: string[] = []
      if (matched.length) reasons.push(`Matches: ${matched.join(', ')}`)
      if (missing.length) reasons.push(`Consider adding: ${missing.join(', ')}`)
      await cacheSet(ck, { score, reasons }, 600)
      out.push({ url, title, companyName, score, reasons })
    }
    // Rerank top-N with LLM scoring via Perplexity
    if (out.length > 1) {
      try {
        const topN = out.slice(0, Math.min(10, out.length))
        const payloadJobs = topN.map(j => ({ url: j.url, title: j.title || '', companyName: j.companyName || '' }))
        const resumePreview = resumeText.replace(/\s+/g,' ').slice(0, 2500)
        // Build job descriptions map for context
        const jobDetails: Record<string,string> = {}
        for (const j of jobs.slice(0, Math.min(10, jobs.length))) {
          const url: string = j.url || ''
          const desc: string = (j as any).description || ''
          if (url && desc) jobDetails[url] = desc.replace(/\s+/g,' ').slice(0, 1200)
        }
        const system = 'You return only valid JSON. No prose.'
        const userContent = `You are a senior recruiter. Score each job (0-100) for fit to the resume. Return STRICT JSON array of objects: {url, refineScore, fitReasons: string[1-3], fixSuggestions: string[1-3]}.

Resume:\n${resumePreview}

Jobs:\n${payloadJobs.map(j=>`- ${j.url} | ${j.title} @ ${j.companyName} | ${jobDetails[j.url] || ''}`).join('\n')}`
        const ppx = new PerplexityService()
        const resp = await ppx.makeRequest(system, userContent, { temperature: 0.2, maxTokens: 800 })
        const text = (resp.content || '').trim() || '[]'
        let parsed: Array<{ url: string; refineScore: number; fitReasons?: string[]; fixSuggestions?: string[] }>
        try { parsed = JSON.parse(text) } catch { parsed = [] as any }
        const map: Record<string, { refineScore: number; fitReasons?: string[]; fixSuggestions?: string[] }> = {}
        for (const it of parsed as any[]) {
          if (it && typeof it.url === 'string' && typeof it.refineScore === 'number') {
            map[it.url] = { refineScore: Math.max(0, Math.min(100, Math.round(it.refineScore))), fitReasons: Array.isArray(it.fitReasons) ? it.fitReasons.slice(0,3) : [], fixSuggestions: Array.isArray(it.fixSuggestions) ? it.fixSuggestions.slice(0,3) : [] }
          }
        }
        // Blend scores and augment reasons/suggestions
        for (const item of out) {
          const extra = map[item.url]
          if (extra) {
            const final = Math.round(item.score * 0.7 + extra.refineScore * 0.3)
            item.score = final
            if (extra.fitReasons && extra.fitReasons.length) item.reasons = [...item.reasons, ...extra.fitReasons.map(r=>`LLM: ${r}`)]
            if (extra.fixSuggestions && extra.fixSuggestions.length) item.reasons = [...item.reasons, ...extra.fixSuggestions.map(r=>`Fix: ${r}`)]
            await cacheSet('rank:llm:'+crypto.createHash('sha256').update(item.url + resumeText.slice(0,1000)).digest('hex'), { score: final, reasons: item.reasons }, 600)
          }
        }
      } catch {
        // ignore reranker failures
      }
    }
    out.sort((a,b)=> b.score - a.score)
    try { const respKey = makeResponseKey(resumeText, jobs); await cacheSet(respKey, { rankings: out }, 600) } catch {}
    const resp = NextResponse.json({ success: true, rankings: out })
    resp.headers.set('x-request-id', requestId)
    logRequestEnd(routeKey, requestId, 200, durationMs(startedAt))
    return resp
  } catch (e) {
    return NextResponse.json({ error: 'Failed to rank jobs' }, { status: 500 })
  }
}


