import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Resume from '@/models/Resume'
import Profile, { IProfile } from '@/models/Profile'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

function guessTitlesFromText(text: string): string[] {
  const lines = text.split(/\n+/)
  const candidates: string[] = []
  const titlePatterns = [
    /([A-Z][a-z]+\s)?(Sales|Account|Business|Marketing|Finance|Project|Product|Operations|Customer|Software|Data|Security|Support)\s(Manager|Director|Lead|Specialist|Representative|Coordinator|Executive|Engineer|Developer|Analyst)/i,
    /(Sales|Account|Business|Marketing|Finance)\s(Manager|Executive)/i,
    /(Software|Data|Security)\s(Engineer|Developer|Analyst)/i,
  ]
  for (const l of lines) {
    const s = l.trim()
    for (const re of titlePatterns) {
      const m = s.match(re)
      if (m && m[0]) candidates.push(m[0].replace(/\s+/g,' ').trim())
    }
  }
  const uniq = Array.from(new Set(candidates.map(c => c.replace(/\b(Director|Lead)\b/i,'Manager'))))
  if (uniq.length) return uniq.slice(0, 3)
  // Fallback generic titles based on keywords
  const lower = text.toLowerCase()
  if (lower.includes('sales')) return ['Sales Manager','Account Manager']
  if (lower.includes('finance')) return ['Finance Manager']
  if (lower.includes('developer') || lower.includes('engineer')) return ['Software Engineer']
  if (lower.includes('marketing')) return ['Marketing Manager']
  return ['Manager']
}

function guessLocation(text: string): string | null {
  const m = text.match(/([A-Z][a-zA-Z]+),\s*([A-Z]{2,3})/) // City, ST
  if (m) return `${m[1]}, ${m[2]}`
  return null
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(()=>({}))
    const { resumeId, location: overrideLocation, radiusKm } = body || {}

    await connectToDatabase()
    let resume = null as any
    if (resumeId) {
      resume = await Resume.findOne({ _id: resumeId, userId: (session.user as any).id }).lean()
    }
    if (!resume) {
      resume = await Resume.findOne({ userId: (session.user as any).id }).sort({ createdAt: -1 }).lean()
    }
    if (!resume) return NextResponse.json({ error: 'No resume found' }, { status: 404 })

    // Titles
    const titles = guessTitlesFromText(resume.extractedText || '')

    // Location
    let location = typeof overrideLocation === 'string' && overrideLocation.trim().length > 2 ? overrideLocation.trim() : null
    if (!location) {
      const prof = await Profile.findOne({ userId: (session.user as any).id }).lean<IProfile>().exec()
      location = (prof?.location as any) || guessLocation(resume.extractedText || '') || null
    }

    const afterDate = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10)
    const resultsAll: Array<{ title?: string; url: string; snippet?: string; source: string }> = []
    for (const t of titles.slice(0,2)) {
      const res = await webScraper.searchJobsByGoogle({
        jobTitle: t,
        location: location || undefined,
        after: afterDate,
        excludeSenior: true,
        limit: 20,
        radiusKm: typeof radiusKm === 'number' ? Math.max(1, Math.min(500, radiusKm)) : 25,
      })
      resultsAll.push(...res)
      if (resultsAll.length >= 40) break
    }
    // De-dupe by URL
    const seen = new Set<string>()
    const results = resultsAll.filter(r => {
      const key = r.url.split('#')[0]
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 40)

    return NextResponse.json({ success: true, titles: titles.slice(0,2), location: location || null, results })
  } catch (e) {
    // Do not hard-fail; return empty suggestions to avoid client protocol errors
    return NextResponse.json({ success: true, titles: [], location: null, results: [] })
  }
}


