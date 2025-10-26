import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityService } from '@/lib/perplexity-service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json({ error: 'AI temporarily unavailable (missing PERPLEXITY_API_KEY)' }, { status: 503 })
    }
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { messages, context } = await req.json()
    const ppx = new PerplexityService()
    const system = 'You are an empathetic career coach. Provide concise, actionable guidance (max 8 bullets).' 
    const user = `Context: ${JSON.stringify(context || {})}\nConversation:\n${JSON.stringify(messages || [])}`
    const out = await ppx.makeRequest(system, user, { maxTokens: 700, temperature: 0.4 })
    return NextResponse.json({ success: true, coach: (out.content || '').trim() })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate coaching' }, { status: 500 })
  }
}


