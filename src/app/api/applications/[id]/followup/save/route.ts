import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limiter = isRateLimited((session.user as any).id, 'applications:followup:save')
    if (limiter.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })

    const schema = z.object({
      dates: z.array(z.string().min(10)).min(1),
      notes: z.string().max(1000).optional(),
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { dates, notes } = parsed.data

    await connectToDatabase()
    const app = await JobApplication.findOne({ _id: params.id, userId: (session.user as any).id })
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    const validDates = dates
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()))
    if (validDates.length === 0) return NextResponse.json({ error: 'No valid dates' }, { status: 400 })

    const merged = Array.from(new Set([...(app.followUpDates || [] as any), ...validDates])) as any
    app.followUpDates = merged
    if (typeof notes === 'string' && notes.trim()) app.notes = notes.trim()
    await app.save()

    return NextResponse.json({ success: true, followUpDates: app.followUpDates })
  } catch (e) {
    console.error('Follow-up save error:', e)
    return NextResponse.json({ error: 'Failed to save follow-ups' }, { status: 500 })
  }
}


