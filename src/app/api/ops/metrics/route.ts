import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

let counters: Record<string, number> = {}

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
    counters[key] = (counters[key] || 0) + 1
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    return NextResponse.json({ success: true, counters })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


