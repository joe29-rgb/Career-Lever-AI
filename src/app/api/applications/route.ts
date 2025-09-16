import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import CompanyData from '@/models/CompanyData';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId: session.user.id };
    if (status && status !== 'all') {
      query.applicationStatus = status;
    }

    // Get applications with pagination
    const applications = await JobApplication.find(query)
      .populate('companyResearch')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await JobApplication.countDocuments(query);

    // Format response
    const formattedApplications = applications.map(app => ({
      _id: app._id,
      jobTitle: app.jobTitle,
      companyName: app.companyName,
      applicationStatus: app.applicationStatus,
      appliedDate: app.appliedDate,
      followUpDates: app.followUpDates,
      notes: app.notes,
      jobUrl: app.jobUrl,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      companyResearch: app.companyResearch ? {
        industry: app.companyResearch.industry,
        size: app.companyResearch.size,
        glassdoorRating: app.companyResearch.glassdoorRating,
        culture: app.companyResearch.culture,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      applications: formattedApplications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

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
    const {
      jobTitle,
      companyName,
      jobDescription,
      jobUrl,
      applicationStatus = 'saved',
      notes
    } = body;

    if (!jobTitle || !companyName || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: jobTitle, companyName, jobDescription' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Create job application
    const jobApplication = new JobApplication({
      userId: session.user.id,
      jobTitle,
      companyName,
      jobDescription,
      jobUrl,
      applicationStatus,
      appliedDate: applicationStatus === 'applied' ? new Date() : null,
      followUpDates: [],
      notes,
    });

    await jobApplication.save();

    return NextResponse.json({
      success: true,
      application: {
        _id: jobApplication._id,
        jobTitle: jobApplication.jobTitle,
        companyName: jobApplication.companyName,
        applicationStatus: jobApplication.applicationStatus,
        appliedDate: jobApplication.appliedDate,
        notes: jobApplication.notes,
        createdAt: jobApplication.createdAt,
      },
    });

  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}

