import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import { authOptions } from '@/lib/auth'
import { generateResume } from '@/lib/resume-generator'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limiter = await isRateLimited((session.user as Record<string, unknown>).id as string, 'resume-builder:generate')
    if (limiter) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const schema = z.object({
      resumeData: z.any().optional(),
      resumeText: z.string().max(200000).optional(),
      template: z.string().min(2).max(40).default('modern'),
      targetJob: z.string().max(100).optional(),
      industry: z.string().max(100).optional(),
      experienceLevel: z.enum(['entry','mid','senior']).default('mid'),
      jobDescription: z.string().max(20000).optional(),
      tone: z.enum(['professional','conversational','technical']).optional()
    })
    
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: parsed.error.flatten() 
      }, { status: 400 })
    }
    
    const {
      resumeData,
      resumeText: resumeTextInput,
      template = 'modern',
      targetJob,
      industry,
      experienceLevel = 'mid',
      jobDescription,
      tone
    } = parsed.data

    // Validate input
    if (!resumeData && !resumeTextInput) {
      return NextResponse.json(
        { 
          error: 'Resume data is required',
          details: 'Please provide either resumeData object or resumeText string',
          hint: 'Use the resume upload or builder to create resume data first'
        },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Use shared resume generator
    console.log('[RESUME_API] Calling shared resume generator')
    const result = await generateResume({
      resumeData,
      resumeText: resumeTextInput,
      template,
      targetJob,
      companyName: undefined,
      jobDescription,
      industry,
      experienceLevel,
      tone
    })

    return NextResponse.json({
      success: true,
      resume: result.resumeData,
      resumeText: result.plainText,
      matchScore: result.matchScore || 0,
      suggestions: result.suggestions,
      output: {
        html: result.html,
        css: '',
        pdfOptions: { format: 'A4' }
      },
      preview: result.preview
    })

  } catch (error) {
    console.error('Resume builder error:', error)
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    )
  }
}
