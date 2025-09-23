import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { webScraper } from '@/lib/web-scraper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { companyName, jobTitle, website, location } = await req.json()
    if (!companyName || companyName.trim().length < 2) return NextResponse.json({ error: 'companyName required' }, { status: 400 })

    // Core scrape (aggregates multiple sources internally)
    const companyData = await webScraper.scrapeCompanyData(companyName, website)

    // Hiring contacts best-effort
    let contacts: Array<{ name: string; title: string; profileUrl?: string; source: string }> = []
    try {
      contacts = await webScraper.searchHiringContacts(companyName, ['recruiter','talent acquisition','hiring manager', jobTitle || ''], location || undefined)
    } catch {}

    // Glassdoor pros/cons enrichment
    let gd: any = null
    try { gd = await webScraper.scrapeGlassdoorReviewsSummary(companyName) } catch {}

    // Supplement with OSINT bundles for richer output
    let osint: any = null
    try { osint = await webScraper.searchCompanyIntelByGoogle(companyName, { after: '2025-01-01' }) } catch {}
    // Supplement socials via Google when direct scrape sparse
    try {
      if (!companyData.socialMedia?.facebook) {
        const fb = await webScraper.searchTwitterMentions(companyName, 3)
        if (fb?.length) {
          ;(companyData as any).socialMedia = (companyData as any).socialMedia || {}
          ;(companyData as any).socialMedia.twitter = { handle: '', followers: 0, recentTweets: fb.map(f=>({ text: f.title || f.snippet, createdAt: new Date(), likes: 0, retweets: 0 })) }
        }
      }
    } catch {}

    const out = {
      companyProfile: {
        name: companyData.companyName || companyName,
        industry: companyData.industry || null,
        size: companyData.size || null,
        description: companyData.description || null,
        website: companyData.website || null,
        locations: location ? [location] : [],
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
        })).concat((osint?.news || []).map((n: any) => ({
          title: n.title, date: undefined, summary: n.snippet, relevance: 'Press/coverage', url: n.url
        }))).slice(0, 12),
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

    // Also return a normalized CompanyData shape so existing UI can consume it directly
    const companyDataNormalized = {
      companyName: out.companyProfile.name,
      website: out.companyProfile.website,
      industry: out.companyProfile.industry || undefined,
      size: out.companyProfile.size || undefined,
      description: out.companyProfile.description || undefined,
      culture: companyData.culture || [],
      benefits: companyData.benefits || [],
      recentNews: (companyData.recentNews || []).map((n: any) => ({
        title: n.title,
        url: n.url,
        publishedAt: n.publishedAt,
        summary: n.summary
      })),
      glassdoorRating: companyData.glassdoorRating,
      glassdoorReviews: companyData.glassdoorReviews,
      linkedinData: companyData.linkedinData || undefined,
      socialMedia: companyData.socialMedia || undefined,
      hiringContacts: contacts,
      contactInfo: (companyData as any).contactInfo || undefined,
      googleReviewsRating: (companyData as any).googleReviewsRating,
      googleReviewsCount: (companyData as any).googleReviewsCount,
      sources: companyData.sources || [],
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 24*60*60*1000)
    }

    return NextResponse.json({ success: true, research: out, companyData: companyDataNormalized })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to run deep research' }, { status: 500 })
  }
}


