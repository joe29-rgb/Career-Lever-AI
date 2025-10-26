import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function styleScore(original: string, generated: string) {
  // Simple stylistic similarity using token overlap and sentence length variance
  const a = original.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const b = generated.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const setA = new Set(a)
  const setB = new Set(b)
  let overlap = 0
  setA.forEach(t => { if (setB.has(t)) overlap++ })
  const overlapScore = Math.min(100, Math.round((overlap / Math.max(setA.size, 1)) * 100))
  const avgLen = (s: string) => s.split(/[.!?]/).map(x=>x.trim()).filter(Boolean).reduce((p,c)=>p+c.length,0) / Math.max(1, s.split(/[.!?]/).filter(Boolean).length)
  const varPenalty = Math.min(30, Math.abs(avgLen(original) - avgLen(generated)) / 2)
  return Math.max(0, Math.min(100, overlapScore - varPenalty))
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { originalText, generatedText } = await request.json()
    if (!originalText || !generatedText) return NextResponse.json({ error: 'originalText and generatedText required' }, { status: 400 })
    const score = styleScore(originalText, generatedText)
    const suggestions: string[] = []
    if (score < 70) suggestions.push('Rewrite using your typical sentence length and phrasing')
    if (score < 50) suggestions.push('Swap generic buzzwords for concrete verbs from your resume')
    if (score < 40) suggestions.push('Reduce formality or add personal context consistent with your resume')
    return NextResponse.json({ success: true, authenticity: { score, suggestions } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute authenticity' }, { status: 500 })
  }
}


