import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { webScraper } from '@/lib/web-scraper'
import { isRateLimited } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { companyName, after } = body || {}
    if (!companyName || String(companyName).trim().length < 2) return NextResponse.json({ error: 'companyName required' }, { status: 400 })
    const rl = await isRateLimited((session.user as any).id, 'company:google-intel')
    if (rl) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    const intel = await webScraper.searchCompanyIntelByGoogle(String(companyName), { after: after ? String(after) : undefined })
    return NextResponse.json({ success: true, intel })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch company intel' }, { status: 500 })
  }
}


