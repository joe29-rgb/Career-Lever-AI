import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import OAuthToken from '@/models/OAuthToken'
import JobApplication from '@/models/JobApplication'

export const dynamic = 'force-dynamic'

function parseStatusFromSubject(subject: string): 'applied'|'interviewing'|'offer'|'rejected'|'saved'|null {
  const s = subject.toLowerCase()
  if (s.includes('interview')) return 'interviewing'
  if (s.includes('offer')) return 'offer'
  if (s.includes('rejected') || s.includes('regret')) return 'rejected'
  if (s.includes('applied') || s.includes('application received')) return 'applied'
  return null
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const gmail = await OAuthToken.findOne({ userId: (session.user as any).id, provider: 'gmail' }).lean()
    const outlook = await OAuthToken.findOne({ userId: (session.user as any).id, provider: 'outlook' }).lean()

    // NOTE: For privacy & cost, we do not call providers here. Stub using existing app notes or future webhooks.
    // Hook: place mailbox polling here using gmail.accessToken / outlook.accessToken.

    const { subjects = [] } = await req.json().catch(()=>({ subjects: [] }))
    // subjects: array of email subject lines recently fetched by client or worker
    let updated = 0
    for (const subj of subjects) {
      const st = parseStatusFromSubject(subj)
      if (!st) continue
      // naive match: update most recent application
      const app = await JobApplication.findOne({ userId: (session.user as any).id }).sort({ createdAt: -1 })
      if (app) { app.applicationStatus = st; await app.save(); updated++ }
    }
    return NextResponse.json({ success: true, updated, gmailLinked: !!gmail, outlookLinked: !!outlook })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to sync inbox' }, { status: 500 })
  }
}


