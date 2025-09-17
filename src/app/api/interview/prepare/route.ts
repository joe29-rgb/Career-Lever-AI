import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import Resume from '@/models/Resume'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'
import OpenAI from 'openai'
import { isRateLimited } from '@/lib/rate-limit'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface InterviewPreparation {
  companyOverview: {
    name: string
    industry: string
    culture: string[]
    recentNews: string[]
    keyFacts: string[]
  }
  jobSpecificPrep: {
    roleRequirements: string[]
    technicalSkills: string[]
    behavioralQuestions: Array<{
      question: string
      suggestedAnswer: string
      tips: string[]
    }>
    technicalQuestions: Array<{
      question: string
      difficulty: 'beginner' | 'intermediate' | 'advanced'
      suggestedAnswer: string
      relatedSkills: string[]
    }>
  }
  candidatePreparation: {
    strengths: string[]
    potentialConcerns: string[]
    talkingPoints: string[]
    salaryExpectations: {
      range: string
      justification: string
      negotiationTips: string[]
    }
  }
  practicePlan: {
    timeline: Array<{
      day: number
      activities: string[]
      focus: string
    }>
    mockInterviewQuestions: string[]
    resources: Array<{
      type: 'article' | 'video' | 'tool'
      title: string
      url: string
      description: string
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = isRateLimited(session.user.id as unknown as string, 'interview:prepare')
    if (rl.limited) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const schema = z.object({
      jobApplicationId: z.string().min(1),
      preparationLevel: z.enum(['basic','comprehensive']).default('comprehensive')
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { jobApplicationId, preparationLevel } = parsed.data

    await connectToDatabase()

    // Get job application and related data
    const jobApplication = await JobApplication.findOne({
      _id: jobApplicationId,
      userId: session.user.id
    }).populate('companyResearch')

    if (!jobApplication) {
      return NextResponse.json(
        { error: 'Job application not found' },
        { status: 404 }
      )
    }

    // Get user's resume
    const resume = await Resume.findOne({
      userId: session.user.id
    }).sort({ createdAt: -1 }) // Get most recent resume

    if (!resume) {
      return NextResponse.json(
        { error: 'No resume found. Please upload a resume first.' },
        { status: 404 }
      )
    }

    // Use assistant-backed generator when configured; fallback to local generator
    const assistantId = process.env.OPENAI_ASSISTANT_INTERVIEW_PREP
    let preparation: InterviewPreparation
    if (assistantId) {
      const coach = await AIService.generateInterviewCoach(
        jobApplication.jobTitle,
        'mid',
        resume.extractedText.substring(0, 4000),
        jobApplication.companyResearch,
        undefined,
        6,
        6,
      )

      // Build InterviewPreparation structure from coach output + local extras
      const companyOverview = {
        name: jobApplication.companyName,
        industry: jobApplication.companyResearch?.industry || 'Technology',
        culture: jobApplication.companyResearch?.culture || ['Ownership', 'Customer-obsessed', 'Bias for action'],
        recentNews: jobApplication.companyResearch?.recentNews?.slice(0,3).map((n: any) => n.title) || [],
        keyFacts: generateCompanyKeyFacts(jobApplication.companyName, jobApplication.companyResearch)
      }
      const roleRequirements = extractRoleRequirements(jobApplication.jobDescription)
      const technicalSkills = extractTechnicalSkills(jobApplication.jobDescription)
      preparation = {
        companyOverview,
        jobSpecificPrep: {
          roleRequirements,
          technicalSkills,
          behavioralQuestions: (coach.behavioralQuestions || []).map(q => ({ question: q, suggestedAnswer: '', tips: [] })),
          technicalQuestions: (coach.technicalQuestions || []).map(q => ({ question: q, difficulty: 'intermediate', suggestedAnswer: '', relatedSkills: [] })),
        },
        candidatePreparation: await generateCandidatePreparation(jobApplication, resume),
        practicePlan: generatePracticePlan(jobApplication.jobTitle, preparationLevel),
      }
    } else {
      // Generate comprehensive interview preparation (local)
      preparation = await generateInterviewPreparation(
        jobApplication,
        resume,
        preparationLevel
      )
    }

    return NextResponse.json({
      success: true,
      preparation
    })

  } catch (error) {
    console.error('Interview preparation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate interview preparation' },
      { status: 500 }
    )
  }
}

async function generateInterviewPreparation(
  jobApplication: any,
  resume: any,
  level: string
): Promise<InterviewPreparation> {
  const companyData = jobApplication.companyResearch

  // Generate company overview
  const companyOverview = {
    name: jobApplication.companyName,
    industry: companyData?.industry || 'Technology',
    culture: companyData?.culture || [
      'Innovation-focused workplace',
      'Collaborative team environment',
      'Work-life balance emphasis'
    ],
    recentNews: companyData?.recentNews?.slice(0, 3).map((news: any) => news.title) || [
      'Company continues to grow in the industry',
      'Recent product launches receiving positive feedback'
    ],
    keyFacts: generateCompanyKeyFacts(jobApplication.companyName, companyData)
  }

  // Generate job-specific preparation
  const jobSpecificPrep = await generateJobSpecificPrep(jobApplication, resume)

  // Generate candidate preparation
  const candidatePreparation = await generateCandidatePreparation(jobApplication, resume)

  // Generate practice plan
  const practicePlan = generatePracticePlan(jobApplication.jobTitle, level)

  return {
    companyOverview,
    jobSpecificPrep,
    candidatePreparation,
    practicePlan
  }
}

function generateCompanyKeyFacts(companyName: string, companyData: any) {
  const facts = []

  if (companyData?.size) {
    facts.push(`${companyData.size} company with global presence`)
  }

  if (companyData?.glassdoorRating) {
    facts.push(`${companyData.glassdoorRating}/5 rating on Glassdoor`)
  }

  if (companyData?.industry) {
    facts.push(`Leading ${companyData.industry.toLowerCase()} company`)
  }

  // Add some default facts if we don't have specific data
  if (facts.length === 0) {
    facts.push('Well-established company with strong market position')
    facts.push('Known for innovative products and services')
    facts.push('Offers competitive compensation and benefits')
  }

  return facts
}

async function generateJobSpecificPrep(jobApplication: any, resume: any) {
  // Use AI to generate relevant interview questions and answers
  const behavioralQuestions = await generateBehavioralQuestions(jobApplication, resume)
  const technicalQuestions = await generateTechnicalQuestions(jobApplication, resume)

  return {
    roleRequirements: extractRoleRequirements(jobApplication.jobDescription),
    technicalSkills: extractTechnicalSkills(jobApplication.jobDescription),
    behavioralQuestions,
    technicalQuestions
  }
}

async function generateBehavioralQuestions(jobApplication: any, resume: any) {
  const questions = [
    'Tell me about yourself',
    'What are your greatest strengths and weaknesses?',
    'Describe a challenging situation you faced and how you handled it',
    'Tell me about a time you failed and what you learned',
    'How do you handle pressure and tight deadlines?',
    'Describe your ideal work environment',
    'Where do you see yourself in 5 years?',
    'Why are you interested in this position?'
  ]

  const questionsWithAnswers = []

  for (const question of questions.slice(0, 5)) { // Limit to 5 for performance
    try {
      const prompt = `Based on this job application and resume, provide a tailored answer to the behavioral interview question: "${question}"

Job: ${jobApplication.jobTitle} at ${jobApplication.companyName}
Job Description: ${jobApplication.jobDescription.substring(0, 500)}

Resume Experience: ${resume.extractedText.substring(0, 1000)}

Provide a concise but detailed answer (2-3 paragraphs) that highlights relevant experience and connects to the job requirements. Also provide 2-3 tips for delivering this answer effectively.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: 'You are an expert career counselor helping candidates prepare for behavioral interviews.'
        }, {
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 600
      })

      const response = completion.choices[0]?.message?.content?.trim() || ''
      const [answer, tipsSection] = response.split('\n\nTips:')
      const tips = tipsSection ? tipsSection.split('\n').filter((tip: string) => tip.trim()) : []

      questionsWithAnswers.push({
        question,
        suggestedAnswer: answer || 'Prepare a personalized answer based on your experience.',
        tips: tips.length > 0 ? tips : ['Be specific and use the STAR method', 'Connect your answer to the job requirements']
      })
    } catch (error) {
      // Fallback for individual question failure
      questionsWithAnswers.push({
        question,
        suggestedAnswer: 'Prepare a thoughtful answer based on your relevant experience and the job requirements.',
        tips: ['Use specific examples', 'Connect to why you want this job']
      })
    }
  }

  return questionsWithAnswers
}

async function generateTechnicalQuestions(jobApplication: any, resume: any) {
  // This would be more sophisticated in production
  const technicalQuestions = [
    {
      question: 'Can you walk me through your experience with our tech stack?',
      difficulty: 'intermediate' as const,
      suggestedAnswer: 'Based on your resume, highlight relevant technical skills and projects.',
      relatedSkills: ['Technical communication', 'System design']
    },
    {
      question: 'How do you approach problem-solving?',
      difficulty: 'beginner' as const,
      suggestedAnswer: 'Describe your analytical thinking and problem-solving methodology.',
      relatedSkills: ['Problem solving', 'Critical thinking']
    }
  ]

  return technicalQuestions
}

function extractRoleRequirements(jobDescription: string) {
  // Simple extraction - in production, use NLP
  const requirements = []
  const desc = jobDescription.toLowerCase()

  if (desc.includes('experience') || desc.includes('years')) {
    requirements.push('Relevant work experience in the field')
  }
  if (desc.includes('degree') || desc.includes('bachelor') || desc.includes('master')) {
    requirements.push('Educational background in relevant field')
  }
  if (desc.includes('communication') || desc.includes('team')) {
    requirements.push('Strong communication and teamwork skills')
  }
  if (desc.includes('leadership') || desc.includes('manage')) {
    requirements.push('Leadership and project management experience')
  }

  return requirements.length > 0 ? requirements : ['Domain knowledge', 'Professional experience', 'Technical skills']
}

function extractTechnicalSkills(jobDescription: string): string[] {
  // Simple keyword extraction - in production, use more sophisticated analysis
  const skills: string[] = []
  const desc = jobDescription.toLowerCase()

  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
    'Git', 'Agile', 'Scrum', 'Project Management', 'Data Analysis', 'Machine Learning'
  ]

  commonSkills.forEach(skill => {
    if (desc.includes(skill.toLowerCase())) {
      skills.push(skill)
    }
  })

  return skills.length > 0 ? skills : ['Problem solving', 'Communication', 'Adaptability']
}

async function generateCandidatePreparation(jobApplication: any, resume: any) {
  // Analyze resume and job fit
  const strengths: string[] = []
  const potentialConcerns: string[] = []

  // Simple analysis - in production, use more sophisticated matching
  if (resume.extractedText.toLowerCase().includes('team') || resume.extractedText.toLowerCase().includes('collaborate')) {
    strengths.push('Strong teamwork and collaboration experience')
  }

  if (resume.extractedText.length > 2000) {
    strengths.push('Extensive professional experience')
  }

  if (resume.customizedVersions && resume.customizedVersions.length > 0) {
    strengths.push('Proven track record of adapting to different roles')
  }

  // Generate talking points
  const talkingPoints = [
    `My experience with ${extractTechnicalSkills(jobApplication.jobDescription).slice(0, 2).join(' and ')} makes me well-suited for this role`,
    `I'm particularly drawn to ${jobApplication.companyName} because of their ${jobApplication.companyResearch?.culture?.[0] || 'innovative approach'}`,
    'I thrive in environments that value continuous learning and professional development'
  ]

  // Salary expectations (simplified)
  const salaryExpectations = {
    range: '$80,000 - $120,000',
    justification: 'Based on industry standards, your experience level, and company size',
    negotiationTips: [
      'Research industry salary ranges thoroughly',
      'Consider your total compensation package',
      'Be prepared to discuss your value proposition',
      'Have a specific number in mind, not a range'
    ]
  }

  return {
    strengths,
    potentialConcerns,
    talkingPoints,
    salaryExpectations
  }
}

function generatePracticePlan(jobTitle: string, level: string) {
  const isComprehensive = level === 'comprehensive'

  const timeline = [
    {
      day: 1,
      activities: [
        'Research the company website and recent news',
        'Review job description and requirements',
        'Prepare your 30-second elevator pitch'
      ],
      focus: 'Company and Role Research'
    },
    {
      day: 2,
      activities: [
        'Practice 3-5 behavioral interview questions',
        'Prepare stories using the STAR method',
        'Review your resume and key achievements'
      ],
      focus: 'Behavioral Questions'
    },
    {
      day: 3,
      activities: [
        'Practice technical questions related to the role',
        'Prepare questions to ask the interviewer',
        'Mock interview with a friend or mentor'
      ],
      focus: 'Technical Preparation'
    },
    {
      day: 4,
      activities: [
        'Review common interview mistakes to avoid',
        'Practice your body language and communication',
        'Prepare your references and follow-up plan'
      ],
      focus: 'Final Preparation'
    }
  ]

  const mockInterviewQuestions = [
    'Tell me about a challenging project you worked on.',
    'How do you handle conflicting priorities?',
    'What are your career goals?',
    'Describe your management style.',
    'How do you stay current with industry trends?'
  ]

  const resources = [
    {
      type: 'article' as const,
      title: 'Common Interview Questions and Answers',
      url: '#',
      description: 'Comprehensive guide to behavioral interview questions'
    },
    {
      type: 'video' as const,
      title: 'Interview Body Language Tips',
      url: '#',
      description: 'How to present confidence through non-verbal cues'
    },
    {
      type: 'tool' as const,
      title: 'STAR Method Worksheet',
      url: '#',
      description: 'Template for structuring your answers effectively'
    }
  ]

  return {
    timeline: isComprehensive ? timeline : timeline.slice(0, 2),
    mockInterviewQuestions: isComprehensive ? mockInterviewQuestions : mockInterviewQuestions.slice(0, 3),
    resources
  }
}
