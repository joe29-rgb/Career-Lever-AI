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

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// CRITICAL FIX: Calculate years of experience from resume text
// Prevents double-counting overlapping periods and filters out education dates
function calculateYearsFromResume(resumeText: string): number {
  // Extract only the work experience section to avoid counting education dates
  const experienceSection = extractExperienceSection(resumeText)
  
  // Match date ranges in various formats
  const dateRegex = /(\w+\s+\d{4}|(\d{1,2}\/\d{4}))\s*[-–—]\s*(\w+\s+\d{4}|Present|Current|(\d{1,2}\/\d{4}))/gi
  const matches = Array.from(experienceSection.matchAll(dateRegex))
  
  // Parse all date ranges into start/end pairs
  const periods: Array<{ start: Date; end: Date }> = []
  for (const match of matches) {
    try {
      const startStr = match[1]
      const endStr = match[3]
      
      const startDate = new Date(startStr)
      const endDate = endStr.match(/Present|Current/i) ? new Date() : new Date(endStr)
      
      // Validate dates are reasonable (not in future, not before 1970)
      if (startDate.getFullYear() < 1970 || startDate.getFullYear() > new Date().getFullYear()) continue
      if (endDate.getFullYear() < 1970 || endDate.getFullYear() > new Date().getFullYear() + 1) continue
      if (startDate > endDate) continue // Skip invalid ranges
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth())
      
      // Sanity check: skip periods longer than 50 years or negative
      if (months > 0 && months < 600) {
        periods.push({ start: startDate, end: endDate })
      }
    } catch (e) {
      // Skip invalid dates
      continue
    }
  }
  
  // If no valid periods found, return 0
  if (periods.length === 0) return 0
  
  // Sort periods by start date
  periods.sort((a, b) => a.start.getTime() - b.start.getTime())
  
  // Merge overlapping periods to avoid double-counting
  const merged: Array<{ start: Date; end: Date }> = []
  let current = periods[0]
  
  for (let i = 1; i < periods.length; i++) {
    const next = periods[i]
    
    // If periods overlap or are adjacent, merge them
    if (next.start <= current.end) {
      current.end = new Date(Math.max(current.end.getTime(), next.end.getTime()))
    } else {
      // No overlap, push current and start new period
      merged.push(current)
      current = next
    }
  }
  merged.push(current)
  
  // Calculate total months from merged periods
  let totalMonths = 0
  for (const period of merged) {
    const months = (period.end.getFullYear() - period.start.getFullYear()) * 12 + 
                  (period.end.getMonth() - period.start.getMonth())
    totalMonths += months
  }
  
  return Math.round(totalMonths / 12)
}

// Extract work experience section from resume to avoid counting education dates
function extractExperienceSection(resumeText: string): string {
  const text = resumeText.toLowerCase()
  
  // Find work experience section markers
  const experienceMarkers = [
    'work experience',
    'professional experience',
    'employment history',
    'experience',
    'work history',
    'career history'
  ]
  
  // Find education section markers to exclude
  const educationMarkers = [
    'education',
    'academic background',
    'academic history',
    'degrees'
  ]
  
  let experienceStart = -1
  let experienceMarker = ''
  
  // Find the earliest experience marker
  for (const marker of experienceMarkers) {
    const index = text.indexOf(marker)
    if (index !== -1 && (experienceStart === -1 || index < experienceStart)) {
      experienceStart = index
      experienceMarker = marker
    }
  }
  
  // If no experience section found, use entire resume (fallback)
  if (experienceStart === -1) return resumeText
  
  // Find where experience section ends (usually at education or end of document)
  let experienceEnd = resumeText.length
  for (const marker of educationMarkers) {
    const index = text.indexOf(marker, experienceStart + experienceMarker.length)
    if (index !== -1 && index < experienceEnd) {
      experienceEnd = index
    }
  }
  
  return resumeText.substring(experienceStart, experienceEnd)
}

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

    const rl = await isRateLimited((session.user as any).id, 'cover-letter');
    if (rl) {
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

      // Calculate years of experience from resume text
      const yearsExperience = calculateYearsFromResume(resumeText)
      console.log('[COVER_LETTER] Calculated experience:', yearsExperience, 'years')

      const ppx = new PerplexityService()
      const companyPayload = { 
        ...(psychology ? { psychology } : {}), 
        yearsExperience,
        experienceNote: `CRITICAL: Candidate has EXACTLY ${yearsExperience} years of experience. Do NOT say "decades" or exaggerate.`
      }
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
    const companyPayload: any = {}
    if (companyData) {
      Object.assign(companyPayload, companyData)
    }
    // Calculate years of experience from resume text
    const yearsExperience = calculateYearsFromResume(resume.extractedText || '')
    companyPayload.yearsExperience = yearsExperience
    companyPayload.experienceNote = `CRITICAL: Candidate has EXACTLY ${yearsExperience} years of experience. Do NOT say "decades" or exaggerate.`
    console.log('[COVER_LETTER] Calculated experience:', yearsExperience, 'years')
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
