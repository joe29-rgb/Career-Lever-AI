import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Resume from '@/models/Resume'
import connectToDatabase from '@/lib/mongodb'
import { isRateLimited } from '@/lib/rate-limit'
import { isSameOrigin } from '@/lib/security'
import pdfParse from 'pdf-parse'
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
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

async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; method: string }> {
  let text = ''
  let method = 'server_pdf_parse'

  try {
    // Primary: pdf-parse (fast)
    const result = await pdfParse(buffer)
    if (result.text && result.text.trim().length > 100) {
      text = cleanExtractedText(result.text)
      console.log('[PDF] pdf-parse success, length:', text.length)
      return { text, method }
    }
  } catch (error) {
    console.log('[PDF] pdf-parse failed, trying pdfjs-dist:', (error as Error).message)
  }

  try {
    // Fallback: pdfjs-dist (more reliable)
    const doc = await pdfjsLib.getDocument({ data: buffer }).promise
    let fullText = ''
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str || '').join(' ')
      fullText += pageText + '\n'
    }
    text = cleanExtractedText(fullText)
    if (text.length > 50) {
      console.log('[PDF] pdfjs-dist success, length:', text.length)
      return { text, method }
    }
  } catch (error) {
    console.error('[PDF] pdfjs-dist failed:', (error as Error).message)
    throw new Error(`PDF extraction failed: ${(error as Error).message}`)
  }

  // ASCII fallback
  try {
    text = buffer.toString('ascii', 0, buffer.length)
      .replace(/[\x00-\x1F\x7F-\xFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    method = 'ascii_fallback'
    console.log('[PDF] ASCII fallback, length:', text.length)
  } catch {}

  return { text, method }
}

export const dynamic = 'force-static'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

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

    if (file && file.size > 0) {
      if (!isSameOrigin(request) || file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Invalid file' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const filename = file.name || 'resume.pdf'

      if (path.extname(filename).toLowerCase() === '.pdf') {
        const { text, method } = await extractTextFromPDF(buffer)
        extractedText = text
        extractionMethod = method
        if (!text || text.length < 50) {
          extractionError = 'PDF parsing failed; please paste text or upload text-based PDF'
        }
      } else {
        extractedText = await file.text()
        extractionMethod = 'direct_text'
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
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

