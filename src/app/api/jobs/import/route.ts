import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobUrl } = await request.json()
    if (!jobUrl || typeof jobUrl !== 'string') return NextResponse.json({ error: 'jobUrl required' }, { status: 400 })
    const detail = await webScraper.scrapeJobDetailFromUrl(jobUrl)
    return NextResponse.json({ success: true, ...detail })
  } catch (e) {
    console.error('Job import error:', e)
    return NextResponse.json({ 
      error: 'Failed to import job', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 })
  }
}


