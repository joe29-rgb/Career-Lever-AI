import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { webScraper } from '@/lib/web-scraper'
import { z } from 'zod'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const schema = z.object({
      jobTitle: z.string().min(2),
      location: z.string().optional(),
      after: z.string().optional(),
      remote: z.boolean().optional(),
      excludeSenior: z.boolean().optional(),
      salaryBands: z.array(z.string()).optional(),
      limit: z.number().min(1).max(50).optional(),
      radiusKm: z.number().min(1).max(500).optional(),
      sources: z.array(z.enum(['indeed','linkedin','ziprecruiter','jobbank','workopolis','google'])).optional(),
    })
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { jobTitle, location, after, remote, excludeSenior, salaryBands, limit, radiusKm, sources } = parsed.data as any

    const results = await webScraper.searchJobsByGoogle({
      jobTitle: String(jobTitle),
      location: location ? String(location) : undefined,
      after: after ? String(after) : undefined,
      remote: Boolean(remote),
      excludeSenior: Boolean(excludeSenior),
      salaryBands: Array.isArray(salaryBands) ? salaryBands.slice(0,3).map(String) : undefined,
      limit: typeof limit === 'number' ? limit : 24,
      radiusKm: typeof radiusKm === 'number' ? radiusKm : undefined,
    })

    const filtered = Array.isArray(sources) && sources.length
      ? results.filter(r => sources.some((s:string)=> (r.source||'').includes(s)))
      : results

    return NextResponse.json({ success: true, results: filtered, location: location || null, radiusKm: typeof radiusKm === 'number' ? Math.max(1, Math.min(500, radiusKm)) : null, sources: sources || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to discover jobs' }, { status: 500 })
  }
}


