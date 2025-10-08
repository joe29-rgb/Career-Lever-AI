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
    // Use pdf-parse-debugging-disabled to avoid test fixture issues
    const pdfParse = await import('pdf-parse-debugging-disabled')
    const data = await pdfParse.default(buffer, {
      // Disable image extraction for faster processing
      max: 0
    })
    
    if (!data || !data.text) {
      return {
        text: '',
        method: 'pdf-parse-failed',
        confidence: 0
      }
    }
    
    const cleanedText = cleanExtractedText(data.text)
    
    return {
      text: cleanedText,
      method: 'pdf-parse',
      confidence: cleanedText.length > 100 ? 0.9 : 0.5
    }
  } catch (error) {
    console.error('PDF extraction error:', error)
    // Return empty instead of throwing - let the main handler deal with it
    return {
      text: '',
      method: 'pdf-parse-error',
      confidence: 0
    }
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

    if (await isRateLimited(session.user.id, 'resume:upload')) {
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
        try {
          const { text, method, confidence } = await extractTextFromPDF(buffer)
          extractedText = text
          extractionMethod = method
          extractionConfidence = confidence || 0.95
          if (!text || text.length < 50) {
            extractionError = 'PDF could not be processed. Please paste your resume text instead.'
          }
        } catch (pdfError) {
          console.error('PDF processing failed completely:', pdfError)
          extractionError = 'PDF processing failed. Please paste your resume text or try a different file format.'
          extractionMethod = 'pdf-failed'
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

    extractedText = cleanExtractedText(extractedText || '')

    if (!extractedText || extractedText.length < 20) {
      return NextResponse.json({ 
        error: 'No readable content', 
        details: extractionError || 'Could not extract text from the file. Please paste your resume text instead.',
        extractionMethod 
      }, { status: 400 })
    }

    const resume = new Resume({
      userId: session.user.id,
      originalFileName: file?.name || 'pasted-resume.txt',
      filename: file?.name || 'pasted-resume.txt',
      extractedText,
      extractionMethod,
      extractionError: extractionError || undefined,
      uploadedAt: new Date(),
    })

    await resume.save()

    return NextResponse.json({
      success: true,
      resume: {
        _id: resume._id.toString(),
        userId: resume.userId,
        originalFileName: resume.originalFileName,
        filename: resume.filename,
        extractedText: resume.extractedText,
        extractionMethod: resume.extractionMethod,
        uploadedAt: resume.uploadedAt
      },
      resumeId: resume._id,
      extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
      extractionMethod,
      extractionError,
      confidence: extractionConfidence,
    })
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    // Provide helpful error messages based on error type
    let userMessage = 'Failed to process resume'
    let helpText = 'Please try again or paste your resume text directly.'
    
    if (errorMessage.includes('validation')) {
      userMessage = 'Invalid resume data'
      helpText = 'Please ensure your resume contains valid text.'
    } else if (errorMessage.includes('database') || errorMessage.includes('mongo')) {
      userMessage = 'Database connection error'
      helpText = 'Please try again in a moment.'
    } else if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      userMessage = 'File too complex to process'
      helpText = 'Try a simpler PDF or paste your text instead.'
    }
    
    return NextResponse.json({ 
      error: userMessage,
      details: helpText,
      technical: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}

