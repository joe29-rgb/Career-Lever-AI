import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import OpenAI from 'openai'
import { z } from 'zod'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const schema = z.object({ jobTitle: z.string().min(2), seniority: z.enum(['entry','mid','senior']).default('mid'), resumeHighlights: z.string().min(20), companyData: z.any().optional() })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { jobTitle, seniority, resumeHighlights, companyData } = parsed.data as any

    const prompt = `Prepare interview material for ${jobTitle} (${seniority}). Resume highlights:\n${resumeHighlights}\n${companyData ? `Company data: ${JSON.stringify(companyData).slice(0,1000)}` : ''}`
    if (!openai) return NextResponse.json({ error: 'AI temporarily unavailable' }, { status: 503 })
    const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are an interview coach.' }, { role: 'user', content: prompt }] })
    return NextResponse.json({ success: true, prep: completion.choices[0]?.message?.content || '' })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to prepare interview' }, { status: 500 })
  }
}
