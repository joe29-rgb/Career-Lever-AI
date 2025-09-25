import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Trigger daily jobs: job suggestions and inbox sync (requires platform cron hitting this route)
export async function GET(_req: NextRequest) {
  try {
    // No auth required for platform cron; optionally add a shared secret header check if desired
    // Kick off alerts run and inbox run
    const [a, b] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/alerts/run`, { method: 'POST' } as any),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/inbox/run`, { method: 'POST' } as any),
    ])
    return NextResponse.json({ success: true, alerts: a.status, inbox: b.status })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to run daily jobs' }, { status: 500 })
  }
}


