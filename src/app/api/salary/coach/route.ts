import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { salaryNegotiationSchema } from '@/lib/validators'
import { AIService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = await await isRateLimited(session.user.id as unknown as string, 'salary:coach')
    if (rl) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const json = await request.json()
    const parsed = salaryNegotiationSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const plan = await AIService.generateSalaryNegotiationPlan(parsed.data)
    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('Salary coach error:', error)
    return NextResponse.json({ error: 'Failed to generate negotiation plan' }, { status: 500 })
  }
}


