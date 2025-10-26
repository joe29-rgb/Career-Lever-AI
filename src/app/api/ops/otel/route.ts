import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Minimal OTLP passthrough placeholder (documented endpoint)
    const body = await req.arrayBuffer()
    const len = body.byteLength
    return new NextResponse(JSON.stringify({ success: true, received: len }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}


