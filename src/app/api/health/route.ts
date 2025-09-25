import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const payload = {
      success: true,
      ts: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      commit: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null,
    }
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'health failed' }, { status: 500 })
  }
}

// Note: single GET handler only; keep response minimal and cache-free.


