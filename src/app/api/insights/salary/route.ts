import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobTitle, companyName, location, seniority = 'mid', offer } = await req.json()
    if (!jobTitle || !companyName || !location) return NextResponse.json({ error: 'jobTitle, companyName, location required' }, { status: 400 })
    const plan = await AIService.generateSalaryNegotiationPlan({ jobTitle, companyName, location, seniority, offer: offer || { base: 'TBD' }, candidateHighlights: '' })
    return NextResponse.json({ success: true, salary: plan })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute salary intel' }, { status: 500 })
  }
}


