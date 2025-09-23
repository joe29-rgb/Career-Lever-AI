import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Resume from '@/models/Resume'
import { webScraper } from '@/lib/web-scraper'
import { extractKeywords, calculateMatchScore } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { jobs, resumeId } = body || {}
    if (!Array.isArray(jobs) || jobs.length === 0) return NextResponse.json({ error: 'jobs array required' }, { status: 400 })

    await connectToDatabase()
    let resume = null as any
    if (resumeId) {
      resume = await Resume.findOne({ _id: resumeId, userId: (session.user as any).id }).lean()
    }
    if (!resume) {
      resume = await Resume.findOne({ userId: (session.user as any).id }).sort({ createdAt: -1 }).lean()
    }
    const resumeText = (resume?.extractedText || '').toString()
    if (!resumeText || resumeText.length < 50) return NextResponse.json({ error: 'Resume text not available' }, { status: 400 })

    const out: Array<{ url: string; title?: string; companyName?: string; score: number; reasons: string[] }> = []
    for (const j of jobs.slice(0, 30)) {
      const url: string = j.url || ''
      let title: string | undefined = j.title
      let companyName: string | undefined = j.companyName
      let description: string | undefined = (j as any).description
      try {
        if (!description || description.length < 40) {
          const det = await webScraper.scrapeJobDetailFromUrl(url)
          title = title || det.title
          companyName = companyName || det.companyName
          description = det.description || description
        }
      } catch {}

      const jd = (description || title || '').toString()
      const score = calculateMatchScore(resumeText, jd)
      const jdKeywords = extractKeywords(jd)
      const resumeLower = resumeText.toLowerCase()
      const matched = jdKeywords.filter(k => resumeLower.includes(k.toLowerCase())).slice(0, 10)
      const missing = jdKeywords.filter(k => !resumeLower.includes(k.toLowerCase())).slice(0, 10)
      const reasons: string[] = []
      if (matched.length) reasons.push(`Matches: ${matched.join(', ')}`)
      if (missing.length) reasons.push(`Consider: ${missing.join(', ')}`)
      out.push({ url, title, companyName, score, reasons })
    }
    out.sort((a,b)=> b.score - a.score)
    return NextResponse.json({ success: true, rankings: out })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to rank jobs' }, { status: 500 })
  }
}


