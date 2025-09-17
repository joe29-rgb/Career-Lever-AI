import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isRateLimited } from '@/lib/rate-limit'
import { AIService } from '@/lib/ai-service'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = isRateLimited((session.user as any).id, 'company:insights')
    if (rl.limited) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const schema = z.object({
      jobTitle: z.string().min(2),
      companyData: z.any(),
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { jobTitle, companyData } = parsed.data as any

    const insights = await AIService.generateCompanyInsights(companyData, jobTitle)
    return NextResponse.json({ success: true, insights })
  } catch (e) {
    console.error('Company insights error:', e)
    return NextResponse.json({ error: 'Failed to generate company insights' }, { status: 500 })
  }
}


