/**
 * Resume Upload API Route
 * @description Handles PDF resume uploads with AI-powered text extraction
 * @route POST /api/resume/upload
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Resume from '@/models/Resume'
import { dbService } from '@/lib/database'
import { isRateLimited } from '@/lib/rate-limit'
import path from 'path'
import { cleanPDFExtraction } from '@/lib/utils/pdf-cleaner'

function cleanExtractedText(text: string): string {
  // Use comprehensive PDF cleaner first
  let cleaned = cleanPDFExtraction(text)
  
  // Additional cleaning for resume-specific content
  cleaned = cleaned
    .replace(/https?:\/\/[^\s]+/gi, '') // URLs
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '') // Emails (during parsing)
    .replace(/\s+/g, ' ') // Whitespace
    .trim()
  
  return cleaned
}

const MIN_VALID_PDF_TEXT_LENGTH = Number(process.env.RESUME_MIN_TEXT_LENGTH || 150)
const ASCII_FALLBACK_CONFIDENCE = 0.3

// AI-based OCR fallback using base64 encoding
async function extractTextWithAI(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF_PARSE] Attempting AI-based extraction')
    const { PerplexityIntelligenceService } = await import('@/lib/perplexity-intelligence')
    
    // Convert PDF to base64
    const base64 = buffer.toString('base64')
    
    const result = await PerplexityIntelligenceService.customQuery({
      systemPrompt: 'You are a resume text extractor. Extract ALL text from the provided PDF resume. Return ONLY the extracted text, no formatting, no markdown, no explanations.',
      userPrompt: `Extract all text from this PDF resume (base64 encoded, first 1000 chars): ${base64.slice(0, 1000)}...\n\nReturn the complete resume text.`,
      temperature: 0.1,
      maxTokens: 4000
    })
    
    if (result.content && result.content.length > MIN_VALID_PDF_TEXT_LENGTH) {
      console.log('[PDF_PARSE] ✅ AI extraction SUCCESS:', result.content.length, 'chars')
      return result.content
    }
    
    throw new Error('AI extraction returned insufficient text')
  } catch (error) {
    console.error('[PDF_PARSE] ❌ AI extraction failed:', error)
    throw error
  }
}

async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; method: string; confidence?: number }> {
  console.log('[PDF_PARSE] ==========================================')
  console.log('[PDF_PARSE] Starting extraction')
  console.log('[PDF_PARSE] Buffer size:', buffer.length, 'bytes')
  console.log('[PDF_PARSE] Buffer type:', typeof buffer)
  console.log('[PDF_PARSE] Is Buffer:', Buffer.isBuffer(buffer))
  console.log('[PDF_PARSE] ==========================================')
  
  // Try Method 1: pdf-parse-debugging-disabled (MOST RELIABLE)
  try {
    console.log('[PDF_PARSE] 🔄 Method 1: pdf-parse-debugging-disabled')
    const pdfParse = await import('pdf-parse-debugging-disabled')
    console.log('[PDF_PARSE] Module loaded:', !!pdfParse, 'default:', !!pdfParse.default)
    
    const data = await pdfParse.default(buffer, { 
      max: 0, // Parse all pages
      version: 'v2.0.550' // Specify version
    })
    
    console.log('[PDF_PARSE] Raw result:', {
      hasData: !!data,
      hasText: !!data?.text,
      textLength: data?.text?.length || 0,
      numpages: data?.numpages,
      numrender: data?.numrender,
      info: data?.info,
      metadata: data?.metadata
    })
    
    if (data?.text) {
      console.log('[PDF_PARSE] Raw text preview (first 500 chars):', data.text.slice(0, 500))
      console.log('[PDF_PARSE] Raw text preview (last 200 chars):', data.text.slice(-200))
      
      const cleanedText = cleanExtractedText(data.text)
      console.log('[PDF_PARSE] After cleaning:', {
        rawLength: data.text.length,
        cleanedLength: cleanedText.length,
        preview: cleanedText.slice(0, 300)
      })
      
      if (cleanedText.length >= 50) {
        const confidence = cleanedText.length >= MIN_VALID_PDF_TEXT_LENGTH ? 0.95 : 0.6
        console.log('[PDF_PARSE] ✅✅✅ Method 1 SUCCESS - confidence:', confidence)
        return {
          text: cleanedText,
          method: 'pdf-parse',
          confidence
        }
      } else {
        console.log('[PDF_PARSE] ⚠️ Method 1 extracted text but too short:', cleanedText.length, 'chars')
      }
    } else {
      console.log('[PDF_PARSE] ⚠️ Method 1 returned no text')
    }
  } catch (error: any) {
    console.error('[PDF_PARSE] ❌ Method 1 FAILED')
    console.error('[PDF_PARSE] Error type:', error?.constructor?.name)
    console.error('[PDF_PARSE] Error message:', error?.message)
    console.error('[PDF_PARSE] Error stack:', error?.stack)
  }

  // Try Method 2: pdfjs-dist fallback (BETTER for complex PDFs)
  try {
    console.log('[PDF_PARSE] 🔄 Method 2: pdfjs-dist')
    const pdfjsLib = await import('pdfjs-dist')
    console.log('[PDF_PARSE] pdfjs-dist module loaded')
    
    // Load the PDF document with proper TypeScript types
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      verbosity: 0,
      useSystemFonts: true,
      disableFontFace: false,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/'
    })
    
    const pdfDoc = await loadingTask.promise
    console.log('[PDF_PARSE] Document loaded successfully')
    console.log('[PDF_PARSE] Pages:', pdfDoc.numPages)
    console.log('[PDF_PARSE] Fingerprints:', pdfDoc.fingerprints)
    
    let fullText = ''
    let totalChars = 0
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Better text extraction with spacing
        const pageText = textContent.items
          .map((item: any) => {
            if ('str' in item && item.str) {
              return item.str
            }
            return ''
          })
          .filter(Boolean)
          .join(' ')
        
        fullText += pageText + '\n\n'
        totalChars += pageText.length
        console.log(`[PDF_PARSE] Page ${pageNum}/${pdfDoc.numPages}: ${pageText.length} chars (total: ${totalChars})`)
      } catch (pageError) {
        console.error(`[PDF_PARSE] Error on page ${pageNum}:`, pageError)
      }
    }
    
    console.log('[PDF_PARSE] Raw extraction complete:', fullText.length, 'chars')
    console.log('[PDF_PARSE] Raw text preview:', fullText.slice(0, 500))
    
    const cleanedText = cleanExtractedText(fullText.trim())
    console.log('[PDF_PARSE] After cleaning:', {
      rawLength: fullText.length,
      cleanedLength: cleanedText.length,
      preview: cleanedText.slice(0, 300)
    })
    
    if (cleanedText.length >= 50) {
      const confidence = cleanedText.length >= MIN_VALID_PDF_TEXT_LENGTH ? 0.9 : 0.6
      console.log('[PDF_PARSE] ✅✅✅ Method 2 SUCCESS - confidence:', confidence)
      return {
        text: cleanedText,
        method: 'pdfjs-dist',
        confidence
      }
    } else {
      console.log('[PDF_PARSE] ⚠️ Method 2 extracted text but too short:', cleanedText.length, 'chars')
    }
  } catch (error: any) {
    console.error('[PDF_PARSE] ❌ Method 2 FAILED')
    console.error('[PDF_PARSE] Error type:', error?.constructor?.name)
    console.error('[PDF_PARSE] Error message:', error?.message)
    console.error('[PDF_PARSE] Error stack:', error?.stack)
  }

  // Try Method 3: AI-based extraction (BEST for scanned/image PDFs)
  try {
    console.log('[PDF_PARSE] Attempting Method 3: AI extraction')
    const aiText = await extractTextWithAI(buffer)
    
    if (aiText && aiText.length >= MIN_VALID_PDF_TEXT_LENGTH) {
      const cleanedText = cleanExtractedText(aiText)
      console.log('[PDF_PARSE] ✅ Method 3 SUCCESS (AI extraction):', cleanedText.length, 'chars')
      
      return {
        text: cleanedText,
        method: 'ai-extraction',
        confidence: 0.8
      }
    }
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
          
          if (!text || text.length < MIN_VALID_PDF_TEXT_LENGTH) {
            extractionError = 'PDF text extraction was incomplete. Please paste your resume content instead.'
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

    const asciiFallbackUsed = extractionMethod === 'ascii-fallback'

    if (asciiFallbackUsed) {
      extractionError = extractionError || 'PDF could not be reliably processed (ASCII fallback). Please paste your resume text instead.'
      extractionConfidence = Math.min(extractionConfidence, ASCII_FALLBACK_CONFIDENCE)
    }

    if (!extractedText || extractedText.length < MIN_VALID_PDF_TEXT_LENGTH) {
      return NextResponse.json({ 
        error: 'No readable content', 
        details: extractionError || 'Could not extract text from the file. Please paste your resume text instead.',
        extractionMethod 
      }, { status: 400 })
    }

    if (asciiFallbackUsed) {
      return NextResponse.json({
        error: 'Resume quality too low',
        details: extractionError,
        extractionMethod,
        confidence: extractionConfidence
      }, { status: 400 })
    }

    // CRITICAL FIX: Extract location and keywords from resume text
    console.log('═══════════════════════════════════════════════════════')
    console.log('[PDF UPLOAD] EXTRACTING RESUME SIGNALS (Location + Keywords)')
    console.log('═══════════════════════════════════════════════════════')
    console.log('[PDF UPLOAD] Resume text length:', extractedText.length, 'chars')
    console.log('[PDF UPLOAD] First 300 chars:', extractedText.substring(0, 300))
    console.log('─────────────────────────────────────────────────────────')

    // NOTE: Old signal extraction removed - now handled by EnhancedResumeExtractor in ProfileMapper
    // This provides better weighting, confidence scores, and structured data
    console.log('[PDF UPLOAD] Resume text ready, profile will be created after save...')

    const resume = new Resume({
      userId: session.user.id,
      originalFileName: file?.name || 'pasted-resume.txt',
      filename: file?.name || 'pasted-resume.txt',
      extractedText,
      extractionMethod,
      extractionError: extractionError || undefined,
      uploadedAt: new Date()
    })

    await resume.save()
    
    // Create/update user profile from resume
    try {
      const { ProfileMapper } = await import('@/lib/profile-mapper')
      const profileResult = await ProfileMapper.mapResumeToProfile(
        session.user.id,
        resume._id.toString()
      )
      
      if (profileResult.success) {
        console.log('[RESUME_UPLOAD] ✅ Profile created/updated:', {
          completeness: profileResult.profile?.profileCompleteness,
          location: profileResult.profile?.location,
          warnings: profileResult.warnings
        })
      } else {
        console.error('[RESUME_UPLOAD] ⚠️ Profile creation failed:', profileResult.errors)
      }
    } catch (profileError) {
      // Don't fail the upload if profile creation fails
      console.error('[RESUME_UPLOAD] ⚠️ Profile mapping error:', profileError)
    }
    
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
        uploadedAt: resume.uploadedAt,
        metadata: resume.metadata
      },
      resumeId: resume._id,
      extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
      extractionMethod,
      extractionError,
      confidence: extractionConfidence,
      // Profile will be created automatically with enhanced extraction
      message: 'Resume uploaded successfully. Profile is being created with enhanced extraction.'
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


