import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { names, companyName } = await req.json()
    if (!Array.isArray(names) || !names.length || !companyName) return NextResponse.json({ error: 'names[] and companyName required' }, { status: 400 })

    // OSINT via Google: LinkedIn + Reddit + Twitter mentions heuristic
    const profiles = await Promise.all(names.slice(0,5).map(async (n: string) => {
      const qLinkedIn = `site:linkedin.com/in "${n}" "${companyName}"`
      const qTwitter = `site:twitter.com "${n}" "${companyName}"`
      const qReddit = `site:reddit.com "${n}" "${companyName}" interview`
      const [li, tw, rd] = await Promise.all([
        webScraper.googleSearch(qLinkedIn, 3),
        webScraper.googleSearch(qTwitter, 3),
        webScraper.googleSearch(qReddit, 3),
      ])
      return { name: n, linkedin: li, twitter: tw, reddit: rd }
    }))

    return NextResponse.json({ success: true, profiles })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to profile interviewers' }, { status: 500 })
  }
}


