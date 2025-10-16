import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = {
      success: true,
      ts: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      commit: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null,
      config: {
        nextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        mongoDb: !!process.env.MONGODB_URI,
        perplexity: !!process.env.PERPLEXITY_API_KEY,
      }
    }
    return NextResponse.json(payload)
  } catch (e) {
    const error = e as Error
    return NextResponse.json({ success: false, error: error?.message || 'health failed' }, { status: 500 })
  }
}

// Note: single GET handler only; keep response minimal and cache-free.


