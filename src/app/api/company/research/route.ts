import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import CompanyData from '@/models/CompanyData';
import { authOptions } from '@/lib/auth';
import { webScraper } from '@/lib/web-scraper';

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

    // Scrape company data using web scraper service
    const companyData = await webScraper.scrapeCompanyData(companyName, website);

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

