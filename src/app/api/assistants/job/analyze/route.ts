import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobDescription } = await request.json()
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.length < 20) {
      return NextResponse.json({ error: 'jobDescription required' }, { status: 400 })
    }
    try {
      const analysis = await AIService.analyzeJobDescription(jobDescription)
      return NextResponse.json({ success: true, analysis })
    } catch (e: any) {
      // Graceful fallback like primary endpoint
      const minimal = {
        jobTitle: 'Unknown Position',
        companyName: 'Unknown Company',
        keyRequirements: [],
        preferredSkills: [],
        responsibilities: [],
        companyCulture: [],
        experienceLevel: 'unknown',
        educationRequirements: [],
        remoteWorkPolicy: 'unknown',
        salaryRange: 'unknown',
      }
      return NextResponse.json({ success: true, analysis: minimal })
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to analyze job' }, { status: 500 })
  }
}


