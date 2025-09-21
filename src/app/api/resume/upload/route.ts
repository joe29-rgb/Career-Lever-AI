import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { promises as fs } from 'fs';
import path from 'path';
import connectToDatabase from '@/lib/mongodb';
import Resume from '@/models/Resume';
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
    if (file) {
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Extract text from PDF
      try {
        const pdfParse = (await import('pdf-parse')).default
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text?.trim() || ''
      } catch (error) {
        // Quiet noisy environment errors; rely on clientText/paste when available
        console.warn('PDF parsing failed on server; will rely on client text if provided')
        extractedText = ''
      }

      // If pdf-parse yields no text (likely image-only PDF), rely on pasted text path instead of OCR on server
    } else if (pastedText) {
      extractedText = pastedText.trim()
    }

    // Prefer client-extracted text when supplied
    if (clientText && clientText.trim().length >= 50) {
      extractedText = clientText.trim()
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

    // Create resume record in database
    const resume = new Resume({
      userId: session.user.id,
      originalFileName: file ? file.name : 'pasted-text.txt',
      fileUrl: fileUrl,
      extractedText,
      customizedVersions: [],
    });

    await resume.save();

    return NextResponse.json({
      success: true,
      resume: {
        _id: resume._id,
        originalFileName: resume.originalFileName,
        fileUrl: resume.fileUrl,
        extractedText: (extractedText || '').substring(0, 500) + ((extractedText || '').length > 500 ? '...' : ''),
        customizedVersions: resume.customizedVersions,
        createdAt: resume.createdAt,
      },
      message: tooShort ? 'Uploaded, but text extraction was limited.' : 'Resume uploaded successfully',
      extractionWarning: tooShort,
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

