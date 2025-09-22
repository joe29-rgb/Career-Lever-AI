import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { jobTitle, location, after, remote, excludeSenior, salaryBands, limit, radiusKm } = body || {}
    if (!jobTitle || String(jobTitle).trim().length < 2) return NextResponse.json({ error: 'jobTitle required' }, { status: 400 })

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

    return NextResponse.json({ success: true, results, location: location || null, radiusKm: typeof radiusKm === 'number' ? Math.max(1, Math.min(500, radiusKm)) : null })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to discover jobs' }, { status: 500 })
  }
}


