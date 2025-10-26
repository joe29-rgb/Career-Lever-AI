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
    const { companyName } = await req.json()
    if (!companyName || String(companyName).trim().length < 2) return NextResponse.json({ error: 'companyName required' }, { status: 400 })
    const rl = await isRateLimited((session.user as any).id, 'company:financials')
    if (rl) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    const fin = await webScraper.searchFinancials(String(companyName))
    return NextResponse.json({ success: true, financials: fin })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch financials' }, { status: 500 })
  }
}


