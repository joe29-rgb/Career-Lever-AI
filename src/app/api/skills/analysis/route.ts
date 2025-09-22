import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required')
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { resumeText } = await request.json()
    if (!resumeText) return NextResponse.json({ error: 'resumeText required' }, { status: 400 })
    const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: `Extract key skills from this resume:\n${resumeText}` }] })
    return NextResponse.json({ success: true, skills: completion.choices[0]?.message?.content || '' })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to analyze skills' }, { status: 500 })
  }
}



