import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import CoverLetter from '@/models/CoverLetter';
import Resume from '@/models/Resume';
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
      notes,
      coverLetterId
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
        ...(coverLetterId && { coverLetterId }),
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

export async function GET(
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

    // Load application
    const application: any = await JobApplication.findOne({
      _id: params.id,
      userId: (session.user as any).id,
    }).lean();

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Load cover letter if attached
    let coverLetter: any = null;
    if (application.coverLetterId) {
      coverLetter = await CoverLetter.findById(application.coverLetterId).select('content jobTitle companyName createdAt').lean();
    }

    // Find resume original and tailored versions for this application
    const resumes = await Resume.find({
      userId: (session.user as any).id,
      'customizedVersions.jobApplicationId': application._id,
    }).lean();

    let original: any = null;
    let versions: any[] = [];
    if (resumes && resumes.length > 0) {
      // choose the most recent as original reference
      const sorted = [...resumes].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      original = {
        fileUrl: sorted[0].fileUrl,
        originalFileName: sorted[0].originalFileName,
        extractedText: sorted[0].extractedText,
      };
      versions = resumes.flatMap((r: any) => (r.customizedVersions || [])
        .filter((v: any) => String(v.jobApplicationId) === String(application._id))
        .map((v: any) => ({
          _id: v._id,
          jobTitle: v.jobTitle,
          companyName: v.companyName,
          customizedText: v.customizedText,
          matchScore: v.matchScore,
          createdAt: v.createdAt,
        }))
      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json({
      success: true,
      application: {
        _id: application._id,
        jobTitle: application.jobTitle,
        companyName: application.companyName,
        jobDescription: application.jobDescription,
        jobUrl: application.jobUrl,
        applicationStatus: application.applicationStatus,
        appliedDate: application.appliedDate,
        followUpDates: application.followUpDates,
        notes: application.notes,
        analysis: application.analysis || null,
        coverLetterId: application.coverLetterId || null,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      },
      coverLetter,
      resume: {
        original,
        versions,
      }
    });

  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json(
      { error: 'Failed to load application' },
      { status: 500 }
    );
  }
}

