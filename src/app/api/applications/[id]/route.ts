import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      applicationStatus,
      notes
    } = body;

    // Connect to database
    await connectToDatabase();

    // Find and update application
    const application = await JobApplication.findOneAndUpdate(
      {
        _id: params.id,
        userId: session.user.id
      },
      {
        ...(jobTitle && { jobTitle }),
        ...(companyName && { companyName }),
        ...(jobDescription && { jobDescription }),
        ...(jobUrl !== undefined && { jobUrl }),
        ...(applicationStatus && { applicationStatus }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      },
      { new: true }
    ).populate('companyResearch');

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application: {
        _id: application._id,
        jobTitle: application.jobTitle,
        companyName: application.companyName,
        applicationStatus: application.applicationStatus,
        appliedDate: application.appliedDate,
        followUpDates: application.followUpDates,
        notes: application.notes,
        jobUrl: application.jobUrl,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        companyResearch: application.companyResearch ? {
          industry: application.companyResearch.industry,
          size: application.companyResearch.size,
          glassdoorRating: application.companyResearch.glassdoorRating,
          culture: application.companyResearch.culture,
        } : null,
      },
    });

  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Find and delete application
    const application = await JobApplication.findOneAndDelete({
      _id: params.id,
      userId: session.user.id
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    });

  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}

