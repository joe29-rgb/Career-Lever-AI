import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const limiter = await isRateLimited((session.user as any).id, 'calendar:ics:create')
    if (limiter) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    const schema = z.object({
      summary: z.string().min(2),
      description: z.string().optional(),
      start: z.string(), // ISO
      end: z.string(),   // ISO
      location: z.string().optional(),
      organizer: z.string().email().optional()
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { summary, description, start, end, location, organizer } = parsed.data
    const uid = `${Date.now()}@careerlever.ai`
    const dt = (s: string) => new Date(s).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Career Lever AI//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dt(new Date().toISOString())}`,
      `DTSTART:${dt(start)}`,
      `DTEND:${dt(end)}`,
      `SUMMARY:${summary.replace(/\n/g,' ')}`,
      description ? `DESCRIPTION:${description.replace(/\n/g,' ')}` : '',
      location ? `LOCATION:${location.replace(/\n/g,' ')}` : '',
      organizer ? `ORGANIZER:MAILTO:${organizer}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n')
    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="event.ics"'
      }
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate ICS' }, { status: 500 })
  }
}


