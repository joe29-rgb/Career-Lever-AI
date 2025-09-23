import { NextRequest, NextResponse } from 'next/server'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { origin, destination, mode } = await req.json()
    if (!origin || !destination) return NextResponse.json({ error: 'origin and destination required' }, { status: 400 })
    const profile = (mode === 'walking' || mode === 'cycling') ? mode : 'driving'
    const mins = await webScraper.getTravelDurationMins(origin, destination, profile as any)
    if (mins == null) return NextResponse.json({ success: false, error: 'No route' }, { status: 200 })
    return NextResponse.json({ success: true, minutes: mins })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to estimate commute' }, { status: 500 })
  }
}


