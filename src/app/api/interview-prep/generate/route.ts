import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Application from '@/models/Application'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applicationId, resumeText, companyResearch } = await req.json()
    
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 })
    }

    await dbConnect()

    const application = await Application.findOne({ 
      _id: applicationId, 
      userId: session.user.id 
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    console.log('[INTERVIEW_PREP] 🎯 Generating prep for:', application.company, '-', application.jobTitle)

    // Generate AI interview questions
    const prompt = `Generate a comprehensive interview preparation guide for this job application:

COMPANY: ${application.company}
ROLE: ${application.jobTitle}
LOCATION: ${application.location || 'Not specified'}

${companyResearch ? `COMPANY INSIGHTS:
${JSON.stringify(companyResearch, null, 2)}` : ''}

${resumeText ? `CANDIDATE BACKGROUND:
${resumeText.slice(0, 2000)}` : ''}

Generate a JSON response with:
{
  "questions": [
    "5 role-specific technical/behavioral questions",
    "3 company-specific questions based on recent news/culture",
    "2 situational questions aligned with core competencies"
  ],
  "companyInsights": "Brief summary of company culture, values, and what they look for in candidates",
  "talkingPoints": [
    "3-5 key achievements or skills to highlight",
    "How to position your experience for this role",
    "Questions to ask the interviewer"
  ]
}

Make questions realistic and specific to the role and company.`

    const response = await PerplexityIntelligenceService.customQuery({
      systemPrompt: 'You are an expert career coach helping candidates prepare for interviews. Return valid JSON only.',
      userPrompt: prompt,
      temperature: 0.7,
      maxTokens: 2000
    })

    let prepData
    try {
      prepData = JSON.parse(response.content)
    } catch {
      // Fallback if JSON parsing fails
      prepData = {
        questions: [
          `Tell me about your experience with ${application.jobTitle}`,
          `Why do you want to work at ${application.company}?`,
          'What are your greatest strengths and weaknesses?',
          'Describe a challenging project you worked on',
          'Where do you see yourself in 5 years?'
        ],
        companyInsights: `${application.company} is looking for candidates who align with their values and can contribute to their mission.`,
        talkingPoints: [
          'Highlight relevant technical skills',
          'Emphasize cultural fit',
          'Show enthusiasm for the role'
        ]
      }
    }

    // Save to application
    application.interviewPrep = {
      questions: prepData.questions,
      companyInsights: prepData.companyInsights,
      talkingPoints: prepData.talkingPoints,
      preparedAt: new Date()
    }
    await application.save()

    console.log('[INTERVIEW_PREP] ✅ Generated', prepData.questions.length, 'questions')

    return NextResponse.json({
      success: true,
      prep: {
        questions: prepData.questions,
        companyInsights: prepData.companyInsights,
        talkingPoints: prepData.talkingPoints,
        company: application.company,
        jobTitle: application.jobTitle
      }
    })
  } catch (error) {
    console.error('[INTERVIEW_PREP] ❌ Error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate interview prep',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
