import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Trigger daily jobs: job suggestions and inbox sync (requires platform cron hitting this route)
export async function GET(_req: NextRequest) {
  try {
    // No auth required for platform cron; optionally add a shared secret header check if desired
    // Kick off alerts run and inbox run
    const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const [a, b, c] = await Promise.allSettled([
      fetch(`${base}/api/alerts/run`, { method: 'POST' } as any),
      fetch(`${base}/api/inbox/run`, { method: 'POST' } as any),
      fetch(`${base}/api/job-boards/autopilot/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: '', locations: '', days: 1, limit: 10 }) } as any),
    ])
    return NextResponse.json({ success: true, alerts: a.status, inbox: b.status, autopilot: c.status })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to run daily jobs' }, { status: 500 })
  }
}


