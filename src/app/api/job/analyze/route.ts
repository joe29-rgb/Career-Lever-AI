import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { extractKeywords } from '@/lib/utils';
import { PerplexityService } from '@/lib/perplexity-service';
import { JOB_ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompts/perplexity';
import { isRateLimited } from '@/lib/rate-limit';
import { jobAnalyzeSchema } from '@/lib/validators';
import JobApplication from '@/models/JobApplication';
import { getOrCreateRequestId, logRequestStart, logRequestEnd, now, durationMs } from '@/lib/observability'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const requestId = getOrCreateRequestId(request.headers as any)
    const startedAt = now()
    const routeKey = 'job:analyze'
    logRequestStart(routeKey, requestId)
    // Check authentication
    if (!process.env.PERPLEXITY_API_KEY) {
      const resp = NextResponse.json({ error: 'AI temporarily unavailable (missing PERPLEXITY_API_KEY)' }, { status: 503 })
      resp.headers.set('x-request-id', requestId)
      return resp
    }
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

    const rl = await isRateLimited((session.user as any).id, 'job-analyze');
    if (rl) {
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

    // Analyze via Perplexity (pure implementation)
    const ppx = new PerplexityService()
    const userPrompt = `Analyze this job posting and produce strict JSON per schema.\n\n${jobDescription}`
    let analysis: any
    try {
      const result = await ppx.makeRequest(JOB_ANALYSIS_SYSTEM_PROMPT, userPrompt, { maxTokens: 1400, temperature: 0.2 })
      let content = result.content || ''
      if (/```/.test(content)) {
        const m = content.match(/```json[\s\S]*?```/i) || content.match(/```[\s\S]*?```/)
        if (m && m[0]) content = m[0].replace(/```json|```/g,'').trim()
      }
      analysis = JSON.parse(content)
    } catch {
      analysis = {
        jobTitle: jobTitle || 'Unknown Title',
        companyName: companyName || 'Unknown Company',
        keyRequirements: [], preferredSkills: [], responsibilities: [], companyCulture: [],
        experienceLevel: 'unknown', educationRequirements: [], remoteWorkPolicy: 'unknown', salaryRange: 'unknown',
        marketContext: { demandLevel: null, competitiveness: null, notes: [] },
      }
    }

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

  } catch (error: any) {
    console.error('Job analysis error:', error);
    // Final safety net: if this is quota/key related, return minimal analysis instead of 500
    const msg = (error && (error.message || error.code || '')) as string
    const quota = (error && (error.code === 'insufficient_quota' || error.status === 429 || /quota/i.test(msg) || /OPENAI_API_KEY/i.test(msg)))
    if (quota) {
      const body = await request.json().catch(()=>({})) as any
      const jd = (body && body.jobDescription) || ''
      const jobTitle = (body && body.jobTitle) || 'Unknown Title'
      const companyName = (body && body.companyName) || 'Unknown Company'
      const keywords = typeof jd === 'string' ? extractKeywords(jd) : []
      return NextResponse.json({
        success: true,
        analysis: {
          jobTitle,
          companyName,
          keyRequirements: [],
          preferredSkills: [],
          responsibilities: [],
          companyCulture: [],
          experienceLevel: 'unknown',
          educationRequirements: [],
          remoteWorkPolicy: 'unknown',
          salaryRange: 'unknown',
        },
        keywords,
      })
    }
    return NextResponse.json({ error: 'Failed to analyze job description' }, { status: 500 })
  }
}
