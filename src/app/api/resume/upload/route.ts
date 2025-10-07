import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Resume from '@/models/Resume'
import { dbService } from '@/lib/database'
import { isRateLimited } from '@/lib/rate-limit'
import { isSameOrigin } from '@/lib/security'
import { promises as fs } from 'fs'
import path from 'path'

function cleanExtractedText(text: string): string {
  return text
    .replace(/\b(obj|endobj|stream|endstream|xref|trailer|startxref)\b/gi, '') // PDF artifacts
    .replace(/https?:\/\/[^\s]+/gi, '') // URLs
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '') // Emails (during parsing)
    .replace(/\s+/g, ' ') // Whitespace
    .trim()
}

async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; method: string; confidence?: number }> {
  try {
    // Use dynamic import to avoid build-time issues
    const pdfParse = await import('pdf-parse')
    const data = await pdfParse.default(buffer)
    
    const cleanedText = cleanExtractedText(data.text)
    
    return {
      text: cleanedText,
      method: 'pdf-parse',
      confidence: cleanedText.length > 100 ? 0.9 : 0.5
    }
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF. Please try pasting your resume text instead.')
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await dbService.connect()

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isRateLimited(session.user.id, 'resume:upload')) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const data = await request.formData()
    const file = data.get('file') as File
    const pastedText = data.get('pastedText') as string

    if (!file && !pastedText) {
      return NextResponse.json({ error: 'No file or text provided' }, { status: 400 })
    }

    let extractedText = ''
    let extractionMethod = ''
    let extractionError = ''
    let extractionConfidence = 0.95

    if (file && file.size > 0) {
      // Validate file size and type
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const filename = file.name || 'resume.pdf'

      if (path.extname(filename).toLowerCase() === '.pdf') {
        const { text, method, confidence } = await extractTextFromPDF(buffer)
        extractedText = text
        extractionMethod = method
        extractionConfidence = confidence || 0.95
        if (!text || text.length < 50) {
          extractionError = 'PDF could not be processed. Please paste your resume text instead.'
        }
      } else {
        extractedText = await file.text()
        extractionMethod = 'direct_text'
        extractionConfidence = 1.0
      }
    } else if (pastedText) {
      extractedText = pastedText
      extractionMethod = 'pasted_text'
    }

    extractedText = cleanExtractedText(extractedText)

    if (!extractedText || extractedText.length < 20) {
      return NextResponse.json({ error: 'No readable content' }, { status: 400 })
    }

    const resume = new Resume({
      userId: session.user.id,
      filename: file?.name || 'pasted-resume.txt',
      extractedText,
      extractionMethod,
      extractionError: extractionError || undefined,
      uploadedAt: new Date(),
    })

    await resume.save()

    return NextResponse.json({
      success: true,
      resumeId: resume._id,
      extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
      extractionMethod,
      extractionError,
      confidence: extractionConfidence,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

