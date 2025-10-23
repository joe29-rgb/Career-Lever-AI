import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { companyName, role, geo } = await req.json()
    if (!companyName || typeof companyName !== 'string') return NextResponse.json({ error: 'companyName required' }, { status: 400 })
    const intel = await PerplexityIntelligenceService.researchCompanyV2({ company: companyName, role, geo })
    return NextResponse.json({ success: true, intel })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch market intelligence' }, { status: 500 })
  }
}


