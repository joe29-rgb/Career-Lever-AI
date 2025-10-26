import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { resumeText, jobAnalysis } = await req.json()
    if (!resumeText || !jobAnalysis) return NextResponse.json({ error: 'resumeText and jobAnalysis required' }, { status: 400 })

    const tokens = tokenize(resumeText)
    const tokenSet = new Set(tokens)

    // Extract keywords from job analysis (supports multiple formats)
    const targets: string[] = [
      ...(jobAnalysis?.matchingSkills || []),
      ...(jobAnalysis?.missingSkills || []),
      ...(jobAnalysis?.skillsToHighlight || []),
      ...(jobAnalysis?.analysis?.keyRequirements || []),
      ...(jobAnalysis?.analysis?.preferredSkills || []),
      ...(jobAnalysis?.keywords || []),
    ]
      .map((s: string) => s.toLowerCase())
      .filter(Boolean)
    
    console.log('[ATS_SCORE] Job analysis structure:', Object.keys(jobAnalysis))
    console.log('[ATS_SCORE] Extracted targets count:', targets.length)

    // Normalize targets by splitting on separators and de-duping
    const expandedTargets = Array.from(
      new Set(
        targets.flatMap((t) => t.split(/[,;•\-]/).map((p) => p.trim()).filter((p) => p.length > 1))
      )
    )

    console.log('[ATS_SCORE] Expanded targets:', expandedTargets.slice(0, 10))
    console.log('[ATS_SCORE] Resume tokens (first 20):', Array.from(tokenSet).slice(0, 20))

    const matched: string[] = []
    const missing: string[] = []
    const density: Record<string, number> = {}

    for (const kw of expandedTargets) {
      const parts = kw.split(/\s+/)
      const present = parts.every((p) => tokenSet.has(p))
      if (present) matched.push(kw)
      else missing.push(kw)
      // density approx: count occurrences of first token
      const first = parts[0]
      density[kw] = tokens.filter((t) => t === first).length / Math.max(tokens.length, 1)
    }
    
    console.log('[ATS_SCORE] Matched keywords:', matched.length, matched.slice(0, 10))
    console.log('[ATS_SCORE] Missing keywords:', missing.length, missing.slice(0, 10))

    const coverage = matched.length / Math.max(expandedTargets.length || 1, 1)
    // Simple ATS score: 70% weight coverage, 30% weight length & repetition penalty
    const lengthPenalty = Math.min(0.15, Math.max(0, (tokens.length - 1200) / 6000))
    const repetitionPenalty = Math.min(0.15, matched.length ? 0 : 0.1)
    const score = Math.round(Math.max(0, Math.min(100, (coverage * 100) * 0.7 + 30 * (1 - lengthPenalty - repetitionPenalty))))

    const suggestions: string[] = []
    if (coverage < 0.8) suggestions.push('Add missing high-value keywords naturally in bullets')
    if (lengthPenalty > 0.1) suggestions.push('Trim low-impact content to improve ATS parsing')
    if (matched.length < 5) suggestions.push('Front-load quantified achievements that match role must-haves')

    return NextResponse.json({
      success: true,
      ats: {
        score,
        matchedKeywords: matched.slice(0, 50),
        missingKeywords: missing.slice(0, 50),
        keywordDensity: density,
        suggestions,
      }
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compute ATS score' }, { status: 500 })
  }
}


