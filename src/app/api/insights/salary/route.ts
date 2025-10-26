import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobTitle, companyName, location } = await req.json()
    if (!jobTitle || !location) return NextResponse.json({ error: 'jobTitle and location required' }, { status: 400 })
    const data = await PerplexityIntelligenceService.salaryForRole(jobTitle, companyName, location)
    return NextResponse.json({ success: true, salary: data })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute salary intel' }, { status: 500 })
  }
}


