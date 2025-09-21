import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import Resume from '@/models/Resume';
import JobApplication from '@/models/JobApplication';
import { authOptions } from '@/lib/auth';
import { AIService } from '@/lib/ai-service';
import { isRateLimited } from '@/lib/rate-limit';
import { resumeCustomizeSchema } from '@/lib/validators';
import { getOrCreateRequestId, logRequestStart, logRequestEnd, now, durationMs } from '@/lib/observability'

export async function POST(request: NextRequest) {
  try {
    const requestId = getOrCreateRequestId(request.headers as any)
    const startedAt = now()
    const routeKey = 'resume:customize'
    logRequestStart(routeKey, requestId)
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = resumeCustomizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }
    const { resumeId, jobDescription, jobTitle, companyName, tone, overrideResumeText, psychology, companyData } = parsed.data;

    const rl = isRateLimited((session.user as any).id, 'resume-customize');
    if (rl.limited) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    if (!resumeId || !jobDescription || !jobTitle || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeId, jobDescription, jobTitle, companyName' },
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

    // Guard: ensure we have sufficient resume text unless override is provided
    const resumeTextForTailoring = (overrideResumeText && overrideResumeText.length > 50 ? overrideResumeText : (resume.extractedText || ''))
    if (!resumeTextForTailoring || resumeTextForTailoring.trim().length < 80) {
      return NextResponse.json({ error: 'Your resume text could not be read. Please paste clean text in the override box and retry.' }, { status: 400 })
    }

    // Create job application record
    const jobApplication = new JobApplication({
      userId: session.user.id,
      jobTitle,
      companyName,
      jobDescription,
      applicationStatus: 'saved',
      appliedDate: new Date(),
      followUpDates: [],
    });

    await jobApplication.save();

    // Use AI service to customize the resume with graceful fallback
    let customizationResult: { customizedResume: string; matchScore: number; improvements: string[]; suggestions: string[] };
    try {
      customizationResult = await AIService.customizeResume(
        resumeTextForTailoring,
        jobDescription,
        jobTitle,
        companyName,
        tone || 'professional',
        'same',
        psychology,
        companyData
      );
    } catch (e) {
      const fallbackText = `Professional Summary\n\nTarget Role: ${jobTitle} at ${companyName}\n\nHighlights:\n- Relevant experience aligned to the job description\n- Skills matched to key requirements\n- Results-focused achievements\n\nResume\n\n${(resume.extractedText || '').slice(0, 8000)}`
      customizationResult = {
        customizedResume: fallbackText,
        matchScore: 50,
        improvements: ['Add quantified achievements', 'Strengthen keywords from job description'],
        suggestions: ['Tailor summary to company values', 'Emphasize most relevant projects first']
      }
    }

    const { customizedResume: customizedText, matchScore, improvements, suggestions } = customizationResult;

    // Create customized version
    const customizedVersion = {
      jobApplicationId: jobApplication._id,
      customizedText,
      jobTitle,
      companyName,
      matchScore,
      createdAt: new Date(),
    };

    // Add to resume
    resume.customizedVersions.push(customizedVersion);
    const savedResume = await resume.save();

    // Find the newly added version
    const newVersion = savedResume.customizedVersions[savedResume.customizedVersions.length - 1];

    const resp = NextResponse.json({
      success: true,
      customizedResume: {
        _id: newVersion._id,
        jobApplicationId: customizedVersion.jobApplicationId,
        customizedText,
        jobTitle,
        companyName,
        matchScore,
        createdAt: customizedVersion.createdAt,
      },
      jobApplication: {
        _id: jobApplication._id,
        jobTitle: jobApplication.jobTitle,
        companyName: jobApplication.companyName,
        applicationStatus: jobApplication.applicationStatus,
        appliedDate: jobApplication.appliedDate,
      },
      matchScore,
      improvements,
      suggestions,
      originalResumeText: resume.extractedText,
    });
    resp.headers.set('x-request-id', requestId)
    logRequestEnd(routeKey, requestId, 200, durationMs(startedAt))
    return resp

  } catch (error) {
    console.error('Resume customization error:', error);
    return NextResponse.json(
      { error: 'Failed to customize resume' },
      { status: 500 }
    );
  }
}
