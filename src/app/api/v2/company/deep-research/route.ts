import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { companyName, jobTitle, website } = await req.json()
    if (!companyName || companyName.trim().length < 2) return NextResponse.json({ error: 'companyName required' }, { status: 400 })

    // Core scrape (aggregates multiple sources internally)
    const companyData = await webScraper.scrapeCompanyData(companyName, website)

    // Hiring contacts best-effort
    let contacts: Array<{ name: string; title: string; profileUrl?: string; source: string }> = []
    try {
      contacts = await webScraper.searchHiringContacts(companyName, ['recruiter','talent acquisition','hiring manager', jobTitle || ''])
    } catch {}

    // Glassdoor pros/cons enrichment
    let gd: any = null
    try { gd = await webScraper.scrapeGlassdoorReviewsSummary(companyName) } catch {}

    const out = {
      companyProfile: {
        name: companyData.companyName || companyName,
        industry: companyData.industry || null,
        size: companyData.size || null,
        description: companyData.description || null,
        website: companyData.website || null,
        locations: [],
      },
      financialHealth: {
        fundingStatus: null,
        revenue: null,
        growthTrend: null,
        marketPosition: null,
      },
      cultureInsights: {
        values: companyData.culture || [],
        workEnvironment: null,
        benefits: companyData.benefits || [],
        glassdoorRating: companyData.glassdoorRating || null,
        pros: gd?.pros || [],
        cons: gd?.cons || [],
        interviewProcess: null,
      },
      recentDevelopments: {
        news: (companyData.recentNews || []).map((n: any) => ({
          title: n.title,
          date: new Date(n.publishedAt).toISOString().slice(0,10),
          summary: n.summary,
          relevance: 'Potential talking point for outreach',
          url: n.url,
        })),
        socialActivity: companyData.linkedinData?.followers ? `LinkedIn followers: ${companyData.linkedinData.followers}` : null,
        hiringTrends: null,
      },
      keyContacts: contacts.slice(0, 8).map((c) => ({
        name: c.name,
        title: c.title,
        department: null,
        linkedinUrl: c.profileUrl || null,
        relevance: 'Potential recruiter/decision maker',
      })),
      applicationStrategy: {
        whyThisCompany: [],
        talkingPoints: [],
        culturalFit: null,
        riskFactors: [],
        opportunities: [],
      },
    }

    return NextResponse.json({ success: true, research: out })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to run deep research' }, { status: 500 })
  }
}


