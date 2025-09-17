import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getToken } from 'next-auth/jwt'
import { z } from 'zod'

async function getGoogleAccessToken(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) as any
  if (!token?.googleAccessToken) return null
  // Refresh logic would go here if expired; for now assume valid
  return token.googleAccessToken as string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const accessToken = await getGoogleAccessToken(request)
    if (!accessToken) return NextResponse.json({ error: 'Google not linked' }, { status: 400 })
    const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=20&singleEvents=true&orderBy=startTime', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const json = await resp.json()
    return NextResponse.json({ success: true, events: json.items || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to list events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const accessToken = await getGoogleAccessToken(request)
    if (!accessToken) return NextResponse.json({ error: 'Google not linked' }, { status: 400 })
    const schema = z.object({
      summary: z.string().min(2),
      description: z.string().optional(),
      start: z.string(), // ISO
      end: z.string(),   // ISO
      location: z.string().optional()
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const body = parsed.data
    const gBody = {
      summary: body.summary,
      description: body.description,
      location: body.location,
      start: { dateTime: body.start },
      end: { dateTime: body.end }
    }
    const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(gBody)
    })
    const json = await resp.json()
    if (!resp.ok) return NextResponse.json({ error: 'Google Calendar error', details: json }, { status: 400 })
    return NextResponse.json({ success: true, event: json })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}


