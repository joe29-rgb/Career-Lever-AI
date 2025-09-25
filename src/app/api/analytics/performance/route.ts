import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import ABEvent from '@/models/ABEvent'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const url = new URL(req.url)
    const applicationId = url.searchParams.get('applicationId')
    const match: any = { userId: (session.user as any).id }
    if (applicationId) match.applicationId = applicationId
    const events = await ABEvent.find(match).lean()

    const variants: Record<string, { views: number; selects: number; downloads: number; submits: number; interviews: number; offers: number }> = { A: { views:0, selects:0, downloads:0, submits:0, interviews:0, offers:0 }, B: { views:0, selects:0, downloads:0, submits:0, interviews:0, offers:0 } }
    for (const e of events) {
      const v = (e as any).variant || 'A'
      if (!variants[v]) continue
      const a = (e as any).action
      if (a === 'view') variants[v].views++
      if (a === 'select') variants[v].selects++
      if (a === 'download') variants[v].downloads++
      if (a === 'submit') variants[v].submits++
      if (a === 'interview') variants[v].interviews++
      if (a === 'offer') variants[v].offers++
    }

    const rate = (num: number, den: number) => den > 0 ? Math.round((num / den) * 100) : 0
    const summary = {
      A: {
        viewToSelect: rate(variants.A.selects, variants.A.views),
        selectToSubmit: rate(variants.A.submits, variants.A.selects),
        submitToInterview: rate(variants.A.interviews, variants.A.submits),
        interviewToOffer: rate(variants.A.offers, variants.A.interviews),
      },
      B: {
        viewToSelect: rate(variants.B.selects, variants.B.views),
        selectToSubmit: rate(variants.B.submits, variants.B.selects),
        submitToInterview: rate(variants.B.interviews, variants.B.submits),
        interviewToOffer: rate(variants.B.offers, variants.B.interviews),
      }
    }

    return NextResponse.json({ success: true, variants, summary })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute performance' }, { status: 500 })
  }
}


