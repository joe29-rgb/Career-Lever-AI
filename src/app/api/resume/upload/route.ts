import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { promises as fs } from 'fs';
import path from 'path';
import connectToDatabase from '@/lib/mongodb';
import Resume from '@/models/Resume';
import Profile from '@/models/Profile';
import Counter from '@/models/Counter';
import { authOptions } from '@/lib/auth';
import { isRateLimited } from '@/lib/rate-limit';
import { isSameOrigin } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Basic CSRF/same-origin check for browser requests
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 400 })
    }

    const limiter = isRateLimited((session.user as any).id, 'resume:upload')
    if (limiter.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })

    // Connect to database
    await connectToDatabase();

    // Handle file upload or pasted text
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    const pastedText = (formData.get('pastedText') as string) || ''
    const clientText = (formData.get('clientText') as string) || ''

    if (!file && !pastedText) {
      return NextResponse.json({ error: 'No file or text provided' }, { status: 400 })
    }

    if (file) {
      // Validate file type (server-side MIME is not fully trustworthy; enforce extension + size too)
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json(
          { error: 'Only PDF files are allowed' },
          { status: 400 }
        );
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size too large. Maximum 10MB allowed.' },
          { status: 400 }
        );
      }
    }

    let extractedText: string = ''
    let extractionMethod: 'server_pdf_parse' | 'client_pdfjs' | 'pasted_text' | 'ascii_fallback' | '' = ''
    let extractionError: string | undefined
    if (file) {
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Extract text from PDF
      try {
        const pdfParse = (await import('pdf-parse')).default
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text?.trim() || ''
        if (extractedText) extractionMethod = 'server_pdf_parse'
      } catch (error) {
        // Quiet noisy environment errors; rely on clientText/paste when available
        console.warn('PDF parsing failed on server; will rely on client text if provided')
        extractedText = ''
        extractionError = 'server_pdf_parse_failed'
      }

      // If pdf-parse yields no text (likely image-only PDF), rely on pasted text path instead of OCR on server
    } else if (pastedText) {
      extractedText = pastedText.trim()
      if (extractedText) extractionMethod = 'pasted_text'
    }

    // Prefer client-extracted text when supplied
    if (clientText && clientText.trim().length >= 50) {
      extractedText = clientText.trim()
      extractionMethod = 'client_pdfjs'
    }

    const tooShort = !extractedText || extractedText.trim().length < 50
    if (tooShort && !pastedText) {
      // Attempt a super-lightweight fallback by reading first 2KB as text (best effort)
      try {
        if (file) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const ascii = buffer.toString('utf8').replace(/\s+/g, ' ').slice(0, 2000)
          if (ascii && ascii.length >= 50) {
            extractedText = ascii
            extractionMethod = 'ascii_fallback'
          }
        }
      } catch {}
    }

    // Save file if present
    let fileUrl: string | undefined
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
      await fs.mkdir(uploadsDir, { recursive: true });
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(uploadsDir, fileName);
      await fs.writeFile(filePath, buffer);
      fileUrl = `/uploads/resumes/${fileName}`
    }

    // Compute rough years of experience from work history timelines (best-effort)
    let yearsExperience: number | undefined = undefined
    try {
      const years = Array.from(new Set((extractedText.match(/\b(19\d{2}|20\d{2})\b/g) || []).map(y => parseInt(y, 10)).filter(y => y >= 1970 && y <= new Date().getFullYear())))
      if (years.length >= 2) {
        const minY = Math.min(...years)
        const maxY = Math.max(...years)
        const span = Math.max(0, Math.min(50, (maxY - minY) + 1))
        yearsExperience = span >= 1 ? span : undefined
      }
    } catch {}

    // Create resume record in database
    const emailFromText = (extractedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0]
    const phoneFromText = (extractedText.match(/(\+?\d[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/) || [])[0]
    const resume = new Resume({
      userId: session.user.id,
      originalFileName: file ? file.name : 'pasted-text.txt',
      fileUrl: fileUrl,
      extractedText,
      customizedVersions: [],
      userName: session.user.name || undefined,
      contactEmail: emailFromText || session.user.email || undefined,
      contactPhone: phoneFromText || undefined,
      yearsExperience,
    });

    await resume.save();

    // Derive profile fields from resume and persist to Profile (upsert)
    try {
      const userId = (session.user as any).id
      // Ensure profile exists with userNo
      let prof: any = await Profile.findOne({ userId })
      if (!prof) {
        const ctr = await Counter.findOneAndUpdate({ key: 'userNo' }, { $inc: { value: 1 } }, { upsert: true, new: true })
        prof = await Profile.create({ userId, userNo: ctr.value, plan: 'free' })
      }

      // Extract fields
      const text = extractedText || ''
      const titleMatch = (text.match(/(Senior|Lead|Principal|Staff|Junior)?\s*(Software|Sales|Account|Marketing|Data|Operations|Project|Product)\s(Engineer|Developer|Manager|Analyst|Specialist)/i) || [])[0]
      const skills = Array.from(new Set((text.match(/[A-Za-z][A-Za-z0-9+.#-]{2,}/g) || [])
        .filter(w => w.length <= 30)
        .slice(0, 200)))
      const locationMatch = (text.match(/([A-Z][a-zA-Z]+),\s*([A-Z]{2,3})/) || [])[0]
      const industries: string[] = []
      if (/healthcare|hospital|clinic/i.test(text)) industries.push('healthcare')
      if (/fintech|bank|finance|insurance/i.test(text)) industries.push('finance')
      if (/e-?commerce|retail/i.test(text)) industries.push('commerce')
      if (/automotive|manufactur/i.test(text)) industries.push('automotive')

      const targetTitles: string[] = []
      if (titleMatch) targetTitles.push(titleMatch)
      // Guess seniority from keywords
      const seniority = /principal|staff|lead|senior/i.test(text) ? 'senior' : /junior|entry/i.test(text) ? 'entry' : 'mid'

      await Profile.findOneAndUpdate(
        { userId },
        {
          $set: {
            title: titleMatch || undefined,
            location: locationMatch || undefined,
            yearsExperience: yearsExperience,
            seniority,
            skills: skills.slice(0, 100),
            targetTitles: Array.from(new Set(targetTitles.map(t => t.replace(/\s+/g,' ').trim()))).slice(0, 5),
            industries,
          }
        },
        { new: true }
      )
    } catch {}

    // Kick off Autopilot public search in background (best-effort)
    try {
      const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const keywords = (extractedText || '').split(/\n|\r/).slice(0, 10).join(' ').split(/[^A-Za-z0-9+.#-]+/).slice(0, 12).join(', ')
      const locations = ((extractedText.match(/([A-Z][a-zA-Z]+),\s*([A-Z]{2,3})/) || [])[0]) || ''
      fetch(`${origin}/api/job-boards/autopilot/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords, locations, radiusKm: 25, days: 14, limit: 20 }) }).catch(()=>{})
    } catch {}

    return NextResponse.json({
      success: true,
      resume: {
        _id: resume._id,
        originalFileName: resume.originalFileName,
        fileUrl: resume.fileUrl,
        extractedText: (extractedText || '').substring(0, 500) + ((extractedText || '').length > 500 ? '...' : ''),
        yearsExperience: resume.yearsExperience,
        customizedVersions: resume.customizedVersions,
        createdAt: resume.createdAt,
      },
      message: tooShort ? 'Uploaded, but text extraction was limited.' : 'Resume uploaded successfully',
      extractionWarning: tooShort || extractionMethod !== 'server_pdf_parse',
      extractionMethod,
      extractionError,
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

