import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

let counters: Record<string, number> = {}
let latencies: number[] = []

export async function POST(req: NextRequest) {
  try {
    const { key, latencyMs } = await req.json()
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
    counters[key] = (counters[key] || 0) + 1
    if (typeof latencyMs === 'number') {
      latencies.push(Math.max(0, Math.min(120000, latencyMs)))
      if (latencies.length > 1000) latencies = latencies.slice(-1000)
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length) : 0
    const p95 = (()=>{ if (!latencies.length) return 0; const s=[...latencies].sort((a,b)=>a-b); return s[Math.floor(0.95*(s.length-1))] })()
    return NextResponse.json({ success: true, counters, avgLatencyMs: avgLatency, p95LatencyMs: p95 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


