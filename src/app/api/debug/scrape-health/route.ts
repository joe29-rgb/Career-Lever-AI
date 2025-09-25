import { NextRequest, NextResponse } from 'next/server'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const res = await webScraper.healthCheck()
  const headers = new Headers({ 'x-scrape-mode': res.mode })
  return NextResponse.json({ success: res.ok, mode: res.mode, error: res.error }, { status: res.ok ? 200 : 503, headers })
}


