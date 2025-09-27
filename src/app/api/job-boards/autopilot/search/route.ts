import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

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
          const res = await webScraper.searchJobsByGoogle({
            jobTitle: kw || undefined,
            location: loc || undefined,
            after: afterDate,
            excludeSenior: true,
            limit: limitPerQuery,
            radiusKm,
          })
          resultsAll.push(...res)
        } catch {}
        if (resultsAll.length >= 200) break
      }
      if (resultsAll.length >= 200) break
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

    return NextResponse.json({ success: true, results })
  } catch (e) {
    return NextResponse.json({ error: 'Autopilot search failed' }, { status: 500 })
  }
}


