import { NextRequest, NextResponse } from 'next/server'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-debug-secret') || ''
  if (!process.env.DEBUG_SECRET || secret !== process.env.DEBUG_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(()=>({})) as any
    const prefix = typeof body.prefix === 'string' ? body.prefix : undefined
    const cleared = PerplexityIntelligenceService.clearCache(prefix)
    return NextResponse.json({ success: true, cleared })
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 })
  }
}


