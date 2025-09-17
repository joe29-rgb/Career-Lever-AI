import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import JobBoardIntegration from '@/models/JobBoardIntegration'
import { authOptions } from '@/lib/auth'
import { createJobBoardService } from '@/lib/job-board-service'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limiter = isRateLimited((session.user as any).id, 'jobboards:jobs:sync')
    if (limiter.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })

    const schema = z.object({ boardName: z.string().min(2).max(50) })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { boardName } = parsed.data

    await connectToDatabase()

    const integration = await JobBoardIntegration.findOne({ userId: (session.user as any).id, boardName })
    if (!integration || !integration.accessToken) return NextResponse.json({ error: 'Not connected' }, { status: 400 })

    const svc = createJobBoardService(boardName)
    let jobs: any[] = []
    try {
      jobs = await svc.makeAuthenticatedRequest(svc.getConfig().endpoints.jobs, 'GET', integration.accessToken)
    } catch (e: any) {
      if (e && typeof e.message === 'string' && e.message.includes('TOKEN_EXPIRED') && integration.refreshToken) {
        const refreshed = await svc.refreshToken(integration.refreshToken)
        integration.accessToken = refreshed.access_token
        if (refreshed.refresh_token) integration.refreshToken = refreshed.refresh_token
        if (refreshed.expires_in) integration.tokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000)
        await integration.save()
        jobs = await svc.makeAuthenticatedRequest(svc.getConfig().endpoints.jobs, 'GET', integration.accessToken)
      } else {
        throw e
      }
    }

    // Normalize and import as saved applications
    let created = 0
    let updated = 0
    const imported: any[] = []
    for (const j of (Array.isArray(jobs) ? jobs : [])) {
      const jobUrl: string = j.url || j.link || ''
      const jobTitle: string = j.title || j.position || 'Imported Role'
      const companyName: string = j.company || j.companyName || 'Unknown Company'
      const description: string = j.description || j.summary || 'Imported via job board sync.'
      const key = jobUrl || `${companyName}:${jobTitle}`
      if (!key) continue

      const existing = await JobApplication.findOne({ userId: (session.user as any).id, jobUrl: jobUrl || undefined, jobTitle, companyName })
      if (existing) {
        // Optionally update description if empty
        if (!existing.jobDescription && description) {
          existing.jobDescription = description
          await existing.save()
          updated++
        }
        imported.push({ id: existing._id, jobTitle, companyName, jobUrl })
        continue
      }
      const app = new JobApplication({
        userId: (session.user as any).id,
        jobTitle,
        companyName,
        jobDescription: description,
        jobUrl: jobUrl || undefined,
        applicationStatus: 'saved',
        followUpDates: []
      })
      await app.save()
      created++
      imported.push({ id: app._id, jobTitle, companyName, jobUrl })
    }

    return NextResponse.json({ success: true, created, updated, importedCount: imported.length, imported })
  } catch (e) {
    console.error('Jobs sync error:', e)
    return NextResponse.json({ error: 'Failed to sync jobs' }, { status: 500 })
  }
}


