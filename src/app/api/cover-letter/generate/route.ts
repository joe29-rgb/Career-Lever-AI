import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import Resume from '@/models/Resume';
import CompanyData from '@/models/CompanyData';
import { authOptions } from '@/lib/auth';
import { AIService } from '@/lib/ai-service';

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
    const { jobApplicationId, resumeId, tone = 'professional', length = 'medium', raw } = body;

    if (!jobApplicationId || !resumeId) {
      return NextResponse.json(
        { error: 'Missing required fields: jobApplicationId, resumeId' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find the resume
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: session.user.id
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Find the job application
    const JobApplication = (await import('@/models/JobApplication')).default;
    const jobApplication = await JobApplication.findOne({
      _id: jobApplicationId,
      userId: session.user.id
    });

    if (!jobApplication) {
      return NextResponse.json(
        { error: 'Job application not found' },
        { status: 404 }
      );
    }

    // Get company research data
    let companyData = null;
    if (jobApplication.companyResearch) {
      companyData = await CompanyData.findById(jobApplication.companyResearch);
    }

    // Generate cover letter using AI service
    const coverLetterResult = await AIService.generateCoverLetter(
      jobApplication.jobTitle,
      jobApplication.companyName,
      jobApplication.jobDescription,
      resume.extractedText,
      companyData?.toObject(),
      tone,
      length
    );

    const { coverLetter, keyPoints, wordCount } = coverLetterResult;

    return NextResponse.json({
      success: true,
      coverLetter,
      keyPoints,
      wordCount,
      preview: raw ? { html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cover Letter</title><style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#333;max-width:8.5in;margin:0 auto;padding:0.5in;white-space:pre-wrap}</style></head><body>${coverLetter.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>` } : undefined
    });

  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}
