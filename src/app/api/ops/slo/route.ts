import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Minimal SLO indicators for dashboards
    const indicators = {
      aiP95LatencyMs: 3000,
      scrapeSuccessRate: 0.8,
      uptimeTarget: 0.995,
    }
    return NextResponse.json({ success: true, indicators })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


