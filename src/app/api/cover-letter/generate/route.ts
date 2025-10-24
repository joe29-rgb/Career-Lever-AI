import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/mongodb';
import Resume from '@/models/Resume';
import CompanyData from '@/models/CompanyData';
import { authOptions } from '@/lib/auth';
import { generateCoverLetter } from '@/lib/cover-letter-generator';
import CoverLetter from '@/models/CoverLetter';
import { isRateLimited } from '@/lib/rate-limit';
import { coverLetterRawSchema } from '@/lib/validators';
import { getOrCreateRequestId, logRequestStart, logRequestEnd, now, durationMs } from '@/lib/observability'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// NOTE: calculateYearsFromResume moved to cover-letter-generator.ts
// This function is no longer needed here

// DEPRECATED: Keeping for reference, but not used
function calculateYearsFromResumeOLD(resumeText: string): number {
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
  
  const years = Math.round(totalMonths / 12)
  
  // CRITICAL FIX: Cap at realistic maximum
  // Assume candidate started working at age 18, max age 65
  // Most candidates are 25-45, so cap at 25 years to be safe
  const maxRealisticYears = 25
  const cappedYears = Math.min(years, maxRealisticYears)
  
  // If calculated years seem unrealistic (>25), round down to nearest 5
  if (cappedYears > 15) {
    return Math.floor(cappedYears / 5) * 5
  }
  
  return cappedYears
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
    const { jobApplicationId, resumeId, tone = 'professional', length = 'medium', raw, save, psychology: psychologyFromBody } = body;

    const rl = await isRateLimited((session.user as any).id, 'cover-letter');
    if (rl) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // RAW INPUT MODE: allow direct inputs without DB lookups
    if (!jobApplicationId && !resumeId && raw === true) {
      // Extract and validate required fields BEFORE Zod validation
      const { jobTitle, companyName, resumeText, template } = body;
      let { jobDescription } = body;
      
      // Allow empty jobDescription - use generic text (BEFORE validation)
      if (!jobDescription || jobDescription.trim() === '') {
        jobDescription = `Position at ${companyName} for ${jobTitle} role.`
        console.log('[COVER_LETTER] No job description provided, using generic text')
      }
      
      // Now validate with Zod (jobDescription is already set)
      const parsed = coverLetterRawSchema.safeParse({ ...body, jobDescription });
      if (!parsed.success) {
        console.error('[COVER_LETTER] Validation failed:', parsed.error.issues)
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
      }
      
      if (!jobTitle || !companyName || !resumeText) {
        console.error('[COVER_LETTER] Missing required fields:', { jobTitle: !!jobTitle, companyName: !!companyName, resumeText: !!resumeText })
        return NextResponse.json(
          { error: 'Missing required fields: jobTitle, companyName, resumeText' },
          { status: 400 }
        );
      }

      // Get candidate info
      const candidateName = session.user.name || ''
      const candidateEmail = session.user.email || ''
      
      // Get hiring contact if available
      let hiringContact = ''
      try {
        const ja = (await import('@/models/JobApplication')).default
        const recent = await ja.findOne({ userId: session.user.id }).sort({ createdAt: -1 })
        if (recent?.context?.hiringContactName) hiringContact = recent.context.hiringContactName
      } catch {}

      // Use shared cover letter generator
      const result = await generateCoverLetter({
        resumeText,
        jobTitle,
        companyName,
        jobDescription,
        candidateName,
        candidateEmail,
        hiringContactName: hiringContact,
        templateId: template || 'modern',
        tone,
        psychology: psychologyFromBody,
      })
      
      const { coverLetter, authenticity: report, wordCount, preview } = result
      const keyPoints: string[] = []
      
      console.log('[COVER_LETTER] Generated:', wordCount, 'words, authenticity score:', report.authenticityScore)

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
        preview
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
    let companyPsychology: Record<string, unknown> | undefined = undefined;
    if (jobApplication.companyResearch) {
      const companyData = await CompanyData.findById(jobApplication.companyResearch);
      if (companyData) companyPsychology = companyData;
    }
    // Merge stored context (psychology) if present
    if (!companyPsychology && jobApplication.context?.companyData) {
      companyPsychology = jobApplication.context.companyData;
    }

    // Get candidate info
    const candidateName = session.user.name || ''
    const hiringContactName = jobApplication.context?.hiringContactName || ''
    
    // Use shared cover letter generator (SECOND PATH - now using shared code!)
    const result2 = await generateCoverLetter({
      resumeText: resume.extractedText || '',
      jobTitle: jobApplication.jobTitle,
      companyName: jobApplication.companyName,
      jobDescription: jobApplication.jobDescription,
      candidateName,
      hiringContactName,
      templateId: (body.template as string) || 'modern',
      tone,
      psychology: companyPsychology,
    })
    
    const { coverLetter, authenticity: report, wordCount, preview: preview2 } = result2
    const keyPoints: string[] = []
    
    console.log('[COVER_LETTER] Generated (DB path):', wordCount, 'words, authenticity score:', report.authenticityScore)

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
      preview: preview2
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
