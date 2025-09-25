import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { extractKeywords } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { postingsHistory = [], jobDescription } = await req.json()
    const kws = extractKeywords(jobDescription || '')
    // Heuristic: recent cadence -> faster timeline
    const cadence = Array.isArray(postingsHistory) ? postingsHistory.length : 0
    const score = Math.max(0, Math.min(100, 40 + Math.min(40, cadence * 8) + Math.min(20, Math.floor(kws.length/4))))
    const expectedWeeks = Math.max(2, Math.round(14 - (score/10)))
    const notes = [
      cadence >= 3 ? 'Frequent postings: active hiring cycle' : 'Few postings: slower cycles likely',
      kws.length > 15 ? 'Highly specific JD: longer screening' : 'Broad JD: faster screening'
    ]
    return NextResponse.json({ success: true, timeline: { score, expectedWeeks, notes } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to predict timeline' }, { status: 500 })
  }
}


