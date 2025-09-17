import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { extractKeywords } from '@/lib/utils';
import { AIService } from '@/lib/ai-service';
import { isRateLimited } from '@/lib/rate-limit';
import { jobAnalyzeSchema } from '@/lib/validators';
import JobApplication from '@/models/JobApplication';
import { getOrCreateRequestId, logRequestStart, logRequestEnd, now, durationMs } from '@/lib/observability'

export async function POST(request: NextRequest) {
  try {
    const requestId = getOrCreateRequestId(request.headers as any)
    const startedAt = now()
    const routeKey = 'job:analyze'
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
    const parsed = jobAnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }
    const { jobDescription, jobTitle, companyName } = parsed.data;

    const rl = isRateLimited((session.user as any).id, 'job-analyze');
    if (rl.limited) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    if (!jobDescription || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: 'Job description must be at least 50 characters long' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Use AI service to analyze the job description
    const analysis = await AIService.analyzeJobDescription(jobDescription);

    // Persist analysis snapshot to the user's latest application for this company/title (or create a minimal record)
    await connectToDatabase();
    const app = await JobApplication.findOne({ userId: session.user.id, companyName: companyName || analysis.companyName, jobTitle: jobTitle || analysis.jobTitle }).sort({ createdAt: -1 })
    if (app) {
      app.analysis = analysis
      await app.save()
    }

    // Extract keywords from the job description
    const keywords = extractKeywords(jobDescription);

    const resp = NextResponse.json({
      success: true,
      analysis,
      keywords,
    });
    resp.headers.set('x-request-id', requestId)
    logRequestEnd(routeKey, requestId, 200, durationMs(startedAt))
    return resp

  } catch (error) {
    console.error('Job analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze job description' },
      { status: 500 }
    );
  }
}
