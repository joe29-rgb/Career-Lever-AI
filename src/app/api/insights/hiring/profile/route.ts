import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, companyName, roleType, linkedinUrl } = await req.json()
    if (!name || !companyName) return NextResponse.json({ error: 'name and companyName required' }, { status: 400 })

    // Placeholder heuristic until deeper profile scraping is integrated
    const profile = {
      personalityType: 'Data-driven, results-focused',
      communicationStyle: 'Direct, prefers quantified achievements',
      redFlags: ['Generic outreach', 'Unclear career progression'],
      optimizedApproach: 'Lead with revenue/impact, crisp bullets; mirror company tone',
    }
    return NextResponse.json({ success: true, profile })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to build hiring profile' }, { status: 500 })
  }
}


