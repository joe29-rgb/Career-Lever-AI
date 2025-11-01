/**
 * WORKFLOW: Company Research → Interview Prep
 * 
 * Automatically generates interview prep from company research
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerplexityService } from '@/lib/perplexity-service'
import Application from '@/models/Application'
import { dbService } from '@/lib/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applicationId } = await req.json()

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 })
    }

    console.log('[WORKFLOW] Company Research → Interview Prep:', applicationId)

    await dbService.connect()

    // Get application
    const application = await Application.findOne({
      _id: applicationId,
      userId: session.user.id
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Generate interview prep using Perplexity
    const perplexity = new PerplexityService()
    
    // TODO: Implement generateInterviewPrep method
    const response = await perplexity.makeRequest(
      'You are an interview preparation expert.',
      `Generate interview prep for ${application.jobTitle} at ${application.company}. Include: 1) Common interview questions, 2) Company insights, 3) Talking points.`,
      { maxTokens: 2000 }
    )
    
    const interviewPrep = {
      questions: ['Tell me about yourself', 'Why do you want to work here?', 'What are your strengths?'],
      companyInsights: response.content,
      talkingPoints: ['Highlight relevant experience', 'Show enthusiasm', 'Ask thoughtful questions']
    }

    // Save to application
    await Application.findByIdAndUpdate(applicationId, {
      $set: {
        interviewPrep: {
          questions: interviewPrep.questions,
          companyInsights: interviewPrep.companyInsights,
          talkingPoints: interviewPrep.talkingPoints,
          preparedAt: new Date()
        }
      }
    })

    console.log('[WORKFLOW] ✅ Interview prep generated')

    return NextResponse.json({
      success: true,
      interviewPrep
    })

  } catch (error) {
    console.error('[WORKFLOW] Error:', error)
    return NextResponse.json({
      error: 'Workflow failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
