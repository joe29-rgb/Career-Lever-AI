import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required')
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { jobTitle, companyName, location } = await request.json()
    if (!jobTitle || !companyName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const prompt = `Provide a concise salary analysis for ${jobTitle} at ${companyName} in ${location || 'N/A'}.`;
    const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] })
    return NextResponse.json({ success: true, analysis: completion.choices[0]?.message?.content || '' })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to analyze salary' }, { status: 500 })
  }
}
