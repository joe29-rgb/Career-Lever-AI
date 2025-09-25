import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { resumeText } = await request.json()
    if (!resumeText) return NextResponse.json({ error: 'resumeText required' }, { status: 400 })
    if (!openai) return NextResponse.json({ error: 'AI temporarily unavailable' }, { status: 503 })
    const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: `Extract key skills from this resume:\n${resumeText}` }] })
    return NextResponse.json({ success: true, skills: completion.choices[0]?.message?.content || '' })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to analyze skills' }, { status: 500 })
  }
}



