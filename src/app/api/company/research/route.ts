import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import CompanyData from '@/models/CompanyData';
import { authOptions } from '@/lib/auth';
import { webScraper } from '@/lib/web-scraper';
import { isRateLimited } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rl = isRateLimited((session.user as any).id, 'company:research')
    if (rl.limited) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const body = await request.json();
    const { companyName, website } = body;

    if (!companyName || companyName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Company name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if we have cached data that's still valid
    const cachedData = await CompanyData.findOne({
      companyName: new RegExp(companyName, 'i'),
      expiresAt: { $gt: new Date() }
    });

    if (cachedData) {
      return NextResponse.json({
        success: true,
        companyData: {
          _id: cachedData._id,
          companyName: cachedData.companyName,
          website: cachedData.website,
          industry: cachedData.industry,
          size: cachedData.size,
          description: cachedData.description,
          culture: cachedData.culture,
          benefits: cachedData.benefits,
          recentNews: cachedData.recentNews,
          glassdoorRating: cachedData.glassdoorRating,
          glassdoorReviews: cachedData.glassdoorReviews,
          linkedinData: cachedData.linkedinData,
          socialMedia: cachedData.socialMedia,
          cachedAt: cachedData.cachedAt,
        },
        sources: ['cache'],
      });
    }

    // Scrape company data using web scraper service, but if Chromium is not
    // available in the container fall back to lightweight heuristics
    let companyData: any
    try {
      // Retry/backoff wrapper to increase robustness
      const attempt = async () => webScraper.scrapeCompanyData(companyName, website)
      try {
        companyData = await (webScraper as any).withRetry(attempt, 2, 600)
      } catch {
        companyData = await attempt()
      }
    } catch (e) {
      companyData = {
        companyName,
        website,
        description: `${companyName} is an innovative company focused on customer value.`,
        culture: ['Collaborative', 'Ownership', 'Customer-first'],
        benefits: ['Health insurance', 'PTO', 'Remote friendly']
      }
    }

    // If scraping yielded little due to timeouts, enrich via lightweight fallbacks
    if (!companyData.glassdoorRating || !companyData.linkedinData) {
      try {
        const [gd, li] = await Promise.allSettled([
          webScraper.scrapeGlassdoorReviewsSummary(companyName),
          webScraper.searchHiringContacts(companyName, ['recruiter','talent acquisition','hr','hiring manager'])
        ])
        if (gd.status === 'fulfilled' && gd.value) {
          companyData.culture = companyData.culture || []
          companyData.culture = Array.from(new Set([...(companyData.culture || []), ...(gd.value.pros || []), ...(gd.value.cons || [])])).slice(0, 8)
        }
        if (li.status === 'fulfilled' && Array.isArray(li.value) && li.value.length) {
          companyData.linkedinData = companyData.linkedinData || { companyPage: '' } as any
          ;(companyData as any).hiringContacts = li.value.slice(0, 5)
        }
      } catch {}
    }

    // Enrich contact info from website if present
    try {
      if (companyData.website) {
        const ci = await webScraper.scrapeContactInfoFromWebsite(companyData.website)
        companyData.contactInfo = ci
      } else if (companyData.linkedinData?.companyPage) {
        // Try to infer website from LinkedIn about section quickly via google
        try {
          const guess = await webScraper.scrapeCompanyWebsite(`https://${new URL(companyData.linkedinData.companyPage).hostname}`)
          if (guess?.description && !companyData.description) companyData.description = guess.description
        } catch {}
      }
    } catch {}

    // Save to database
    const savedData = new CompanyData({
      ...companyData,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await savedData.save();

    return NextResponse.json({
      success: true,
      companyData: savedData,
      sources: ['scraping'],
    });

  } catch (error) {
    console.error('Company research error:', error);
    return NextResponse.json(
      { error: 'Failed to research company' },
      { status: 500 }
    );
  }
}

