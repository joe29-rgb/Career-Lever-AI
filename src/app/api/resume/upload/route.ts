import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Resume from '@/models/Resume'
import { dbService } from '@/lib/database'
import { isRateLimited } from '@/lib/rate-limit'
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
  console.log('[PDF_PARSE] Starting extraction, buffer size:', buffer.length, 'bytes')
  
  // Try Method 1: pdf-parse-debugging-disabled
  try {
    console.log('[PDF_PARSE] Attempting Method 1: pdf-parse-debugging-disabled')
    const pdfParse = await import('pdf-parse-debugging-disabled')
    const data = await pdfParse.default(buffer, { max: 0 })
    
    console.log('[PDF_PARSE] pdf-parse result:', {
      hasData: !!data,
      hasText: !!data?.text,
      textLength: data?.text?.length || 0,
      numpages: data?.numpages
    })
    
    if (data && data.text && data.text.length > 50) {
      const cleanedText = cleanExtractedText(data.text)
      console.log('[PDF_PARSE] ✅ Method 1 SUCCESS:', {
        rawLength: data.text.length,
        cleanedLength: cleanedText.length,
        preview: cleanedText.slice(0, 200)
      })
      return {
        text: cleanedText,
        method: 'pdf-parse',
        confidence: cleanedText.length > 100 ? 0.9 : 0.5
      }
    }
    console.log('[PDF_PARSE] Method 1 text too short, trying fallback')
  } catch (error) {
    console.error('[PDF_PARSE] ❌ Method 1 failed:', error)
  }

  // Try Method 2: pdfjs-dist fallback
  try {
    console.log('[PDF_PARSE] Attempting Method 2: pdfjs-dist')
    const pdfjsLib = await import('pdfjs-dist')
    
    // Load the PDF document with proper TypeScript types
    const loadingTask = pdfjsLib.getDocument({
      data: buffer,
      verbosity: 0,
      useSystemFonts: false,
      disableFontFace: true
    })
    
    const pdfDoc = await loadingTask.promise
    console.log('[PDF_PARSE] pdfjs-dist loaded document, pages:', pdfDoc.numPages)
    
    let fullText = ''
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      const pageText = textContent.items
        .map((item: any) => {
          if ('str' in item) {
            return item.str
          }
          return ''
        })
        .join(' ')
      
      fullText += pageText + '\n'
      console.log(`[PDF_PARSE] Page ${pageNum}/${pdfDoc.numPages}: ${pageText.length} chars`)
    }
    
    const cleanedText = cleanExtractedText(fullText.trim())
    console.log('[PDF_PARSE] Method 2 cleanup:', {
      rawLength: fullText.length,
      cleanedLength: cleanedText.length,
      preview: cleanedText.slice(0, 200)
    })
    
    if (cleanedText.length > 100) {
      console.log('[PDF_PARSE] ✅ Method 2 SUCCESS')
      return {
        text: cleanedText,
        method: 'pdfjs-dist',
        confidence: 0.85
      }
    }
    console.log('[PDF_PARSE] Method 2 text too short')
  } catch (error) {
    console.error('[PDF_PARSE] ❌ Method 2 failed:', error)
  }

  // Try Method 3: ASCII extraction as last resort
  try {
    console.log('[PDF_PARSE] Attempting Method 3: ASCII fallback (DANGEROUS)')
    const asciiText = buffer
      .toString('utf8')
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    console.log('[PDF_PARSE] ASCII extraction result:', {
      length: asciiText.length,
      preview: asciiText.slice(0, 200)
    })
    
    if (asciiText.length > 100) {
      const cleanedText = cleanExtractedText(asciiText)
      console.log('[PDF_PARSE] ⚠️ Method 3 SUCCESS (ASCII fallback - LOW QUALITY):', cleanedText.length, 'chars')
      console.warn('[PDF_PARSE] WARNING: Using ASCII fallback may corrupt company names and other data')
      
      return {
        text: cleanedText,
        method: 'ascii-fallback',
        confidence: 0.6
      }
    }
    console.log('[PDF_PARSE] Method 3 text too short')
  } catch (error) {
    console.error('[PDF_PARSE] ❌ Method 3 failed:', error)
  }

  // All methods failed
  console.error('[PDF_PARSE] ❌❌❌ ALL EXTRACTION METHODS FAILED')
  return {
    text: '',
    method: 'all-methods-failed',
    confidence: 0
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[RESUME_UPLOAD] ========== NEW UPLOAD REQUEST ==========')
  
  try {
    await dbService.connect()

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('[RESUME_UPLOAD] ❌ Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[RESUME_UPLOAD] User:', session.user.id, session.user.email)

    if (await isRateLimited(session.user.id, 'resume:upload')) {
      console.log('[RESUME_UPLOAD] ❌ Rate limited')
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const data = await request.formData()
    const file = data.get('file') as File
    const pastedText = data.get('pastedText') as string
    
    console.log('[RESUME_UPLOAD] Upload type:', {
      hasFile: !!file,
      fileSize: file?.size,
      fileName: file?.name,
      hasPastedText: !!pastedText,
      pastedTextLength: pastedText?.length
    })

    if (!file && !pastedText) {
      console.log('[RESUME_UPLOAD] ❌ No file or text provided')
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
          
          // Enhanced logging
          console.log('🔍 PDF Processing Result:', {
            filename,
            method: extractionMethod,
            textLength: extractedText?.length,
            confidence: extractionConfidence,
            firstWords: extractedText?.slice(0, 100)
          })
          
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
    
    const duration = Date.now() - startTime
    console.log('[RESUME_UPLOAD] ✅ SUCCESS:', {
      resumeId: resume._id.toString(),
      textLength: extractedText.length,
      method: extractionMethod,
      confidence: extractionConfidence,
      durationMs: duration
    })

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


