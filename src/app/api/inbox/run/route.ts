import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import OAuthToken, { IOAuthToken } from '@/models/OAuthToken'
import JobApplication from '@/models/JobApplication'

export const dynamic = 'force-dynamic'

function parseStatusFromSubject(subject: string): 'applied'|'interviewing'|'offer'|'rejected'|'saved'|null {
  const s = subject.toLowerCase()
  if (s.includes('interview') || s.includes('schedule') || s.includes('invite')) return 'interviewing'
  if (s.includes('offer')) return 'offer'
  if (s.includes('rejected') || s.includes('regret') || s.includes('unfortunately')) return 'rejected'
  if (s.includes('application received') || s.includes('applied') || s.includes('thank you for applying')) return 'applied'
  return null
}

async function fetchGmailSubjects(accessToken: string): Promise<string[]> {
  try {
    const list = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=category:primary newer_than:30d&maxResults=12', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!list.ok) return []
    const json: any = await list.json()
    const ids: string[] = Array.isArray(json.messages) ? json.messages.slice(0, 10).map((m: any) => m.id) : []
    const subjects: string[] = []
    for (const id of ids) {
      try {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        if (!res.ok) continue
        const msg: any = await res.json()
        const hdr = (msg.payload?.headers || []).find((h: any) => h.name === 'Subject')
        if (hdr?.value) subjects.push(hdr.value)
      } catch {}
    }
    return subjects
  } catch {
    return []
  }
}

async function fetchOutlookSubjects(accessToken: string): Promise<string[]> {
  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/messages?$top=10&$select=subject,receivedDateTime', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!res.ok) return []
    const json: any = await res.json()
    const items: any[] = Array.isArray(json.value) ? json.value : []
    return items.map((m: any) => m.subject).filter((s: any) => typeof s === 'string')
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const gmail = await OAuthToken.findOne({
      userId: (session.user as any).id,
      provider: 'gmail'
    }).lean<IOAuthToken>().exec()
    const outlook = await OAuthToken.findOne({
      userId: (session.user as any).id,
      provider: 'outlook'
    }).lean<IOAuthToken>().exec()
    let subjects: string[] = []
    // Retry/backoff wrappers to improve resilience
    const withRetry = async <T,>(fn: () => Promise<T>, attempts = 3, base = 500): Promise<T> => {
      let last: any
      for (let i=0;i<attempts;i++) {
        try { return await fn() } catch (e) { last = e; await new Promise(r=>setTimeout(r, base * Math.pow(2, i))) }
      }
      throw last
    }
    if (gmail?.accessToken) {
      try {
        const s = await withRetry(() => fetchGmailSubjects(gmail.accessToken), 3, 500)
        subjects.push(...s)
      } catch {}
    }
    if (outlook?.accessToken) {
      try {
        const s = await withRetry(() => fetchOutlookSubjects(outlook.accessToken), 3, 500)
        subjects.push(...s)
      } catch {}
    }
    subjects = Array.from(new Set(subjects)).slice(0, 20)

    // Update statuses based on latest subjects
    let updated = 0
    for (const subj of subjects) {
      const st = parseStatusFromSubject(subj)
      if (!st) continue
      const app = await JobApplication.findOne({ userId: (session.user as any).id }).sort({ createdAt: -1 })
      if (app) { app.applicationStatus = st; await app.save(); updated++ }
    }
    return NextResponse.json({ success: true, updated, subjectsCount: subjects.length, gmailLinked: !!gmail, outlookLinked: !!outlook })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to run inbox poller' }, { status: 500 })
  }
}


