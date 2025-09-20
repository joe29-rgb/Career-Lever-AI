import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const plan = await AIService.generateSalaryNegotiationPlan(body)
    return NextResponse.json({ success: true, plan })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate negotiation plan' }, { status: 500 })
  }
}


