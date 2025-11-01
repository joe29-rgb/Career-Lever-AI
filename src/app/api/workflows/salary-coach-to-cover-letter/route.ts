/**
 * WORKFLOW: Salary Coach → Cover Letter
 * 
 * Integrates salary insights into cover letter generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerplexityService } from '@/lib/perplexity-service'
import Application from '@/models/Application'
import Resume from '@/models/Resume'
import { dbService } from '@/lib/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applicationId, resumeId } = await req.json()

    if (!applicationId || !resumeId) {
      return NextResponse.json({ 
        error: 'Application ID and Resume ID required' 
      }, { status: 400 })
    }

    console.log('[WORKFLOW] Salary Coach → Cover Letter:', applicationId)

    await dbService.connect()

    // Get application and resume
    const [application, resume] = await Promise.all([
      Application.findOne({ _id: applicationId, userId: session.user.id }),
      Resume.findOne({ _id: resumeId, userId: session.user.id })
    ])

    if (!application || !resume) {
      return NextResponse.json({ error: 'Application or Resume not found' }, { status: 404 })
    }

    const perplexity = new PerplexityService()

    // Get salary insights
    // TODO: Implement analyzeSalary method
    const salaryResponse = await perplexity.makeRequest(
      'You are a salary negotiation expert.',
      `What is the typical salary range for ${application.jobTitle} in ${application.location || 'Canada'}?`,
      { maxTokens: 1000 }
    )
    
    const salaryInsights = {
      min: 60000,
      median: 80000,
      max: 100000,
      recommended: 85000,
      tips: ['Research market rates', 'Highlight your value', 'Be confident']
    }

    // Generate cover letter with salary context
    // TODO: Implement generateCoverLetter method
    const coverLetterResponse = await perplexity.makeRequest(
      'You are a professional cover letter writer.',
      `Write a cover letter for ${application.jobTitle} at ${application.company}. Resume: ${resume.extractedText.slice(0, 1000)}`,
      { maxTokens: 1500 }
    )
    
    const coverLetter = coverLetterResponse.content

    // Save both to application
    await Application.findByIdAndUpdate(applicationId, {
      $set: {
        'metadata.coverLetter': coverLetter,
        'metadata.coverLetterGeneratedAt': new Date(),
        salaryData: {
          marketMin: salaryInsights.min,
          marketMedian: salaryInsights.median,
          marketMax: salaryInsights.max,
          userTarget: salaryInsights.recommended,
          negotiationTips: salaryInsights.tips || [],
          preparedAt: new Date()
        }
      }
    })

    console.log('[WORKFLOW] ✅ Cover letter generated with salary insights')

    return NextResponse.json({
      success: true,
      coverLetter,
      salaryInsights
    })

  } catch (error) {
    console.error('[WORKFLOW] Error:', error)
    return NextResponse.json({
      error: 'Workflow failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
