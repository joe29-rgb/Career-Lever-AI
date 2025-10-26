import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import { PerplexityService } from '@/lib/perplexity-service'
import { z } from 'zod'

const ppx = new PerplexityService()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json({ error: 'AI temporarily unavailable (missing PERPLEXITY_API_KEY)' }, { status: 503 })
    }
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const schema = z.object({ jobTitle: z.string().min(2), seniority: z.enum(['entry','mid','senior']).default('mid'), resumeHighlights: z.string().min(20), companyData: z.any().optional() })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { jobTitle, seniority, resumeHighlights, companyData } = parsed.data as any

    const system = 'You are an interview preparation specialist. Provide structured, actionable prep content.'
    const prompt = `Prepare interview material for ${jobTitle} (${seniority}).\nResume highlights:\n${resumeHighlights}\n${companyData ? `Company data: ${JSON.stringify(companyData).slice(0,1000)}` : ''}`
    try {
      const result = await ppx.makeRequest(system, prompt, { maxTokens: 1400, temperature: 0.3 })
      return NextResponse.json({ success: true, prep: (result.content || '').trim() })
    } catch (e: any) {
      const msg = (e?.message || '').toString()
      if (/PERPLEXITY_API_KEY/i.test(msg)) {
        return NextResponse.json({ error: 'AI temporarily unavailable (missing PERPLEXITY_API_KEY)' }, { status: 503 })
      }
      throw e
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to prepare interview' }, { status: 500 })
  }
}
