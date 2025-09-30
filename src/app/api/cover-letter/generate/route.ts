import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import Resume from '@/models/Resume';
import CompanyData from '@/models/CompanyData';
import { authOptions } from '@/lib/auth';
import { PerplexityService } from '@/lib/perplexity-service';
import { ENHANCED_COVER_LETTER_SYSTEM_PROMPT, buildEnhancedCoverLetterUserPrompt } from '@/lib/prompts/perplexity'
import { validateAuthenticityLetter, sanitizeCoverLetter } from '@/lib/authenticity'
import CoverLetter from '@/models/CoverLetter';
import { isRateLimited } from '@/lib/rate-limit';
import { coverLetterRawSchema } from '@/lib/validators';
import { getOrCreateRequestId, logRequestStart, logRequestEnd, now, durationMs } from '@/lib/observability'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.PERPLEXITY_API_KEY) return NextResponse.json({ error: 'AI temporarily unavailable (missing PERPLEXITY_API_KEY)' }, { status: 503 })
    const requestId = getOrCreateRequestId(request.headers as any)
    const startedAt = now()
    const routeKey = 'cover-letter:generate'
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
    const { jobApplicationId, resumeId, tone = 'professional', length = 'medium', raw, save, psychology } = body;

    const rl = isRateLimited((session.user as any).id, 'cover-letter');
    if (rl.limited) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // RAW INPUT MODE: allow direct inputs without DB lookups
    if (!jobApplicationId && !resumeId && raw === true) {
      const parsed = coverLetterRawSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
      }
      const { jobTitle, companyName, jobDescription, resumeText } = parsed.data as any;
      if (!jobTitle || !companyName || !jobDescription || !resumeText) {
        return NextResponse.json(
          { error: 'Missing required fields: jobTitle, companyName, jobDescription, resumeText' },
          { status: 400 }
        );
      }

      // personalize with candidate + hiring contact if saved in context
      let candidateName = session.user.name || ''
      const candidateEmail = session.user.email || ''
      const candidatePhone = ''
      let hiringContact = ''
      try {
        const ja = (await import('@/models/JobApplication')).default
        const recent = await ja.findOne({ userId: session.user.id }).sort({ createdAt: -1 })
        if (recent?.context?.hiringContactName) hiringContact = recent.context.hiringContactName
      } catch {}

      // Try to include yearsExperience from the latest resume
      let yearsExperience: number | undefined = undefined
      try {
        await connectToDatabase()
        const latest = await Resume.findOne({ userId: session.user.id }).sort({ createdAt: -1 }).lean()
        if (typeof (latest as any)?.yearsExperience === 'number') yearsExperience = (latest as any).yearsExperience
      } catch {}

      const ppx = new PerplexityService()
      const companyPayload = { ...(psychology ? { psychology } : {}), ...(yearsExperience ? { yearsExperience } : {}) }
      const userPrompt = buildEnhancedCoverLetterUserPrompt({
        candidateName,
        jobTitle,
        companyName,
        location: '',
        jobDescription,
        candidateHighlights: resumeText.slice(0, 2000),
        companyData: companyPayload
      })
      const out = await ppx.chat(`${ENHANCED_COVER_LETTER_SYSTEM_PROMPT}\n\n${userPrompt}`, { model: 'sonar-pro', maxTokens: 1800, temperature: 0.35 })
      let coverLetter = (out.content || '').trim()
      // Authenticity validation & sanitization
      const report = validateAuthenticityLetter(resumeText, coverLetter)
      if (!report.isValid) {
        coverLetter = sanitizeCoverLetter(resumeText, coverLetter)
      }
      const keyPoints: string[] = []
      const wordCount = coverLetter.split(/\s+/).filter(Boolean).length

      if (save === true) {
        await connectToDatabase();
        await CoverLetter.create({
          userId: session.user.id,
          jobTitle,
          companyName,
          jobDescription,
          resumeSnapshot: (resumeText as string).slice(0, 4000),
          content: coverLetter,
          tone,
          length,
        })
      }
      const resp = NextResponse.json({
        success: true,
        coverLetter,
        keyPoints,
        authenticity: report,
        wordCount,
        preview: { html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cover Letter</title><style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#333;max-width:8.5in;margin:0 auto;padding:0.5in;white-space:pre-wrap}</style></head><body>${coverLetter.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>` }
      });
      resp.headers.set('x-request-id', requestId)
      logRequestEnd(routeKey, requestId, 200, durationMs(startedAt))
      return resp
    }

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
    // Merge stored context (psychology) if present
    if (!companyData && jobApplication.context?.companyData) {
      companyData = { ...(jobApplication.context.companyData || {}) } as any
    }

    // Generate cover letter using Perplexity
    let candidateName = session.user.name || ''
    const candidateEmail = session.user.email || ''
    const candidatePhone = ''
    const hiringContact = ''
    const ppx = new PerplexityService()
    const companyPayload = { ...(companyData ? companyData.toObject() : {}), ...(typeof (resume as any).yearsExperience === 'number' ? { yearsExperience: (resume as any).yearsExperience } : {}) }
    const userPrompt = buildEnhancedCoverLetterUserPrompt({
      candidateName,
      jobTitle: jobApplication.jobTitle,
      companyName: jobApplication.companyName,
      location: '',
      jobDescription: jobApplication.jobDescription,
      candidateHighlights: (resume.extractedText || '').slice(0, 2000),
      companyData: companyPayload
    })
    const result = await ppx.chat(`${ENHANCED_COVER_LETTER_SYSTEM_PROMPT}\n\n${userPrompt}`, { model: 'sonar-pro', maxTokens: 1800, temperature: 0.35 })
    let coverLetter = (result.content || '').trim()
    const report = validateAuthenticityLetter(resume.extractedText || '', coverLetter)
    if (!report.isValid) coverLetter = sanitizeCoverLetter(resume.extractedText || '', coverLetter)
    const keyPoints: string[] = []
    const wordCount = coverLetter.split(/\s+/).filter(Boolean).length

    if (save === true) {
      await CoverLetter.create({
        userId: session.user.id,
        applicationId: jobApplication._id,
        jobTitle: jobApplication.jobTitle,
        companyName: jobApplication.companyName,
        jobDescription: jobApplication.jobDescription,
        resumeSnapshot: (resume.extractedText || '').slice(0, 4000),
      content: coverLetter,
        tone,
        length,
      })
    }

    const resp2 = NextResponse.json({
      success: true,
      coverLetter,
      keyPoints,
      authenticity: report,
      wordCount,
      preview: raw ? { html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cover Letter</title><style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#333;max-width:8.5in;margin:0 auto;padding:0.5in;white-space:pre-wrap}</style></head><body>${coverLetter.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>` } : undefined
    });
    resp2.headers.set('x-request-id', requestId)
    logRequestEnd(routeKey, requestId, 200, durationMs(startedAt))
    return resp2

  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}
