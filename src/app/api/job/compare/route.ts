import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Resume from '@/models/Resume'
import { extractKeywords, calculateMatchScore } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resumeId, resumeText: incomingResumeText, jobAnalysis, jobDescription } = body || {}
    if (!resumeId && !incomingResumeText) {
      return NextResponse.json({ error: 'Provide resumeId or resumeText' }, { status: 400 })
    }
    if (!jobAnalysis && !jobDescription) {
      return NextResponse.json({ error: 'Provide jobAnalysis or jobDescription' }, { status: 400 })
    }

    let resumeText = (incomingResumeText as string) || ''
    if (resumeId) {
      await connectToDatabase()
      const resume = await Resume.findOne({ _id: resumeId, userId: (session.user as any).id })
      if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
      resumeText = resume.extractedText || ''
    }

    const jdText = jobDescription || buildJobContextFromAnalysis(jobAnalysis)
    const score = calculateMatchScore(resumeText, jdText)
    const jdKeywords = extractKeywords(jdText)
    const resumeLower = resumeText.toLowerCase()
    const matched: string[] = []
    const missing: string[] = []
    for (const kw of jdKeywords) {
      if (!kw || kw.length < 2) continue
      if (resumeLower.includes(kw.toLowerCase())) matched.push(kw)
      else missing.push(kw)
    }

    const unique = (arr: string[]) => Array.from(new Set(arr))
    const topMatched = unique(matched).slice(0, 50)
    const topMissing = unique(missing).slice(0, 50)

    const suggestions: string[] = []
    if (topMissing.length) suggestions.push(`Address missing keywords: ${topMissing.slice(0, 10).join(', ')}`)
    if (score < 60) suggestions.push('Add 2-3 quantified achievements aligned to key requirements')
    suggestions.push('Mirror job title phrasing in your summary and recent role where appropriate')

    return NextResponse.json({
      success: true,
      score,
      matchedKeywords: topMatched,
      missingKeywords: topMissing,
      suggestions,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to compare resume' }, { status: 500 })
  }
}

function buildJobContextFromAnalysis(analysis: any): string {
  if (!analysis) return ''
  try {
    const a = analysis.analysis || analysis
    return `Title: ${a.jobTitle || ''}\nCompany: ${a.companyName || ''}\nRequirements: ${(a.keyRequirements||[]).join(', ')}\nSkills: ${(a.preferredSkills||[]).join(', ')}\nResponsibilities: ${(a.responsibilities||[]).join(', ')}\nCulture: ${(a.companyCulture||[]).join(', ')}`
  } catch {
    return ''
  }
}


