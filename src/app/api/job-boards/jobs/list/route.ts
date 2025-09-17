import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import JobBoardIntegration from '@/models/JobBoardIntegration'
import { createJobBoardService } from '@/lib/job-board-service'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const limiter = isRateLimited((session.user as any).id, 'jobboards:jobs:list')
    if (limiter.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })

    const schema = z.object({ boardName: z.string().min(2).max(50) })
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { boardName } = parsed.data

    await connectToDatabase()
    const integration: any = await JobBoardIntegration.findOne({ userId: (session.user as any).id, boardName })
    if (!integration || !integration.accessToken) return NextResponse.json({ error: 'Not connected' }, { status: 400 })

    const svc = createJobBoardService(boardName)
    const endpoint = svc.getConfig().endpoints.jobs
    let jobs: any
    try {
      jobs = await svc.makeAuthenticatedRequest(endpoint, 'GET', integration.accessToken)
    } catch (e: any) {
      if (e && typeof e.message === 'string' && e.message.includes('TOKEN_EXPIRED') && integration.refreshToken) {
        try {
          const refreshed = await svc.refreshToken(integration.refreshToken)
          integration.accessToken = refreshed.access_token
          if (refreshed.refresh_token) integration.refreshToken = refreshed.refresh_token
          if (refreshed.expires_in) integration.tokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000)
          await integration.save()
          jobs = await svc.makeAuthenticatedRequest(endpoint, 'GET', integration.accessToken)
        } catch {
          return NextResponse.json({ error: 'Re-authentication required' }, { status: 401 })
        }
      } else {
        throw e
      }
    }
    return NextResponse.json({ success: true, jobs })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to list jobs' }, { status: 500 })
  }
}


