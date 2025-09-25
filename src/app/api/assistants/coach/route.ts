import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { messages, context } = await req.json()
    const out = await AIService.emotionalCareerCoach(messages || [], context || {})
    return NextResponse.json({ success: true, coach: out })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate coaching' }, { status: 500 })
  }
}


