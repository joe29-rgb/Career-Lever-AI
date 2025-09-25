import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { resumeText, targetRole, targetIndustry, geo } = await req.json()
    if (!resumeText || !targetRole) return NextResponse.json({ error: 'resumeText and targetRole required' }, { status: 400 })
    const plan = await AIService.careerTrajectoryPredictor({ resumeText, targetRole, targetIndustry, geo })
    return NextResponse.json({ success: true, trajectory: plan })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate trajectory' }, { status: 500 })
  }
}


