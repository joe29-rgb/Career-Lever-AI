import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { prompt, text } = await request.json()
    
    if (!prompt || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, text' },
        { status: 400 }
      )
    }
    
    // Use Perplexity to parse the resume
    const client = PerplexityIntelligenceService as any
    const response = await client.createClient().makeRequest(
      'You are a resume parser. Return only valid JSON.',
      prompt,
      { temperature: 0.2, maxTokens: 4000, model: 'sonar-pro' }
    )
    
    return NextResponse.json({ content: response.content })
  } catch (error) {
    console.error('[API] Resume parse error:', error)
    return NextResponse.json(
      { error: 'Failed to parse resume' },
      { status: 500 }
    )
  }
}
