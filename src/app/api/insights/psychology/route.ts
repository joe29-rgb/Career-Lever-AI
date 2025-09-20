import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { jobDescription, companySignals } = await request.json()
    if (!jobDescription || typeof jobDescription !== 'string') return NextResponse.json({ error: 'jobDescription required' }, { status: 400 })

    // Reuse AI to derive tone, formality, values, and suggested send times
    const text = await AIService.generateText(`Analyze job and company signals to infer:
Return JSON with keys: tone: "formal|neutral|casual", formality: 0-100, values: string[3-6], languageGuidance: string[2-4], bestSendWindows: string[2-4].
Job Description:\n${jobDescription}\n\nCompany Signals (optional):\n${companySignals ? JSON.stringify(companySignals) : 'N/A'}`)
    let parsed: any = {}
    try { parsed = JSON.parse(text) } catch { parsed = { tone: 'neutral', formality: 50, values: [], languageGuidance: [], bestSendWindows: [] } }
    return NextResponse.json({ success: true, psychology: parsed })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute psychology' }, { status: 500 })
  }
}


