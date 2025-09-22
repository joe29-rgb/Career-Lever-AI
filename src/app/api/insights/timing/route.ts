import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(()=>({})) as any
    const jobTitle: string | undefined = body?.jobTitle
    const companyName: string | undefined = body?.companyName
    const urgency: number | undefined = typeof body?.urgency === 'number' ? body.urgency : undefined // 0-100
    const applicants: number | undefined = typeof body?.applicants === 'number' ? body.applicants : undefined
    const location: string | undefined = body?.location

    // Heuristic recommendation: Tue–Thu mornings in local time; apply within 48h of posting if urgency high
    const now = new Date()
    const day = now.getUTCDay() // 0=Sun
    const weekdayScore = (day >= 2 && day <= 4) ? 1 : 0.6 // Tue-Thu best
    const baseScore = 70 * weekdayScore
    const urgencyBoost = urgency ? Math.min(20, Math.max(-10, (urgency - 50) / 2)) : 0
    const crowdPenalty = applicants ? Math.max(-15, Math.min(0, -Math.log10(Math.max(1, applicants)) * 10)) : 0
    const score = Math.round(Math.max(0, Math.min(100, baseScore + urgencyBoost + crowdPenalty)))

    const windows = [
      { window: 'Tue 9:00–11:00', reason: 'Recruiters triage early in the week' },
      { window: 'Wed 9:00–12:00', reason: 'Midweek response rates are high' },
      { window: 'Thu 9:00–11:00', reason: 'Less competition vs Mon/Fri' },
    ]

    const notes: string[] = []
    if (urgency && urgency >= 70) notes.push('High urgency: apply within 24–48 hours')
    if (applicants && applicants > 100) notes.push('Crowded posting: tailor strongly and reach out to a recruiter')
    if (location) notes.push(`Align submission time to ${location} business hours`)
    if (jobTitle) notes.push(`Emphasize must-have keywords early for ${jobTitle}`)

    return NextResponse.json({ success: true, timing: { score, bestWindows: windows, notes, meta: { jobTitle: jobTitle || null, companyName: companyName || null, location: location || null } } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute timing' }, { status: 500 })
  }
}


