import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const events: Array<{ at: string; actor?: string; action: string; meta?: any }> = []

export async function POST(req: NextRequest) {
  try {
    const { action, meta } = await req.json()
    if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 })
    events.push({ at: new Date().toISOString(), action, meta })
    if (events.length > 1000) events.shift()
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    return NextResponse.json({ success: true, events: events.slice(-200) })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


