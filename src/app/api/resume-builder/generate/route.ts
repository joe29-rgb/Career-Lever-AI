import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'
import { AIService } from '@/lib/ai-service'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required')
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface ResumeData {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin?: string
    website?: string
    summary: string
  }
  experience: Array<{
    id: string
    company: string
    position: string
    location: string
    startDate: string
    endDate: string
    current: boolean
    description: string
    achievements: string[]
    technologies: string[]
  }>
  education: Array<{
    id: string
    institution: string
    degree: string
    field: string
    location: string
    graduationDate: string
    gpa?: string
    honors?: string[]
  }>
  skills: {
    technical: string[]
    soft: string[]
    languages: Array<{ language: string; proficiency: string }>
    certifications: Array<{ name: string; issuer: string; date: string; expiry?: string }>
  }
  projects: Array<{
    id: string
    name: string
    description: string
    technologies: string[]
    url?: string
    github?: string
    startDate: string
    endDate: string
  }>
  template: string
  customization: {
    fontSize: string
    fontFamily: string
    colorScheme: string
    layout: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limiter = isRateLimited((session.user as any).id, 'resume-builder:generate')
    if (limiter.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })

    const schema = z.object({
      resumeData: z.any(),
      template: z.string().min(2).max(40).default('modern'),
      targetJob: z.string().max(100).optional(),
      industry: z.string().max(100).optional(),
      experienceLevel: z.enum(['entry','mid','senior']).default('mid'),
      jobDescription: z.string().max(20000).optional(),
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const {
      resumeData,
      template = 'modern',
      targetJob,
      industry,
      experienceLevel = 'mid',
      jobDescription
    } = parsed.data

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const useAssistant = Boolean(process.env.OPENAI_ASSISTANT_RESUME_TAILOR && jobDescription && typeof jobDescription === 'string' && jobDescription.length > 20)

    if (useAssistant) {
      // Serialize current builder data to plain text resume
      const resumeText = serializeResumeToPlainText(resumeData)
      const tailored = await AIService.customizeResume(
        resumeText,
        jobDescription as string,
        targetJob || '',
        '',
        'professional',
        'same'
      )

      const tailoredHtml = wrapTailoredTextAsHtml(tailored.customizedResume, resumeData.personalInfo.fullName)
      return NextResponse.json({
        success: true,
        resumeText: tailored.customizedResume,
        matchScore: tailored.matchScore,
        suggestions: tailored.suggestions,
        output: {
          html: tailoredHtml,
          css: '',
          pdfOptions: { format: 'A4' }
        },
        preview: { thumbnail: null, summary: null }
      })
    } else {
      // Generate optimized resume content via classic flow
      const optimizedResume = await generateOptimizedResume(
        resumeData,
        template,
        targetJob,
        industry,
        experienceLevel
      )

      const resumeOutput = await generateResumeOutput(optimizedResume, template)

      return NextResponse.json({
        success: true,
        resume: optimizedResume,
        output: resumeOutput,
        preview: generateResumePreview(optimizedResume, template)
      })
    }

  } catch (error) {
    console.error('Resume builder error:', error)
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    )
  }
}

async function generateOptimizedResume(
  resumeData: any,
  template: string,
  targetJob?: string,
  industry?: string,
  experienceLevel?: string
): Promise<ResumeData> {
  // Use AI to optimize and enhance resume content
  const optimizedContent = await optimizeResumeContent(resumeData, targetJob, industry, experienceLevel)

  // Structure the resume data
  const structuredResume: ResumeData = {
    personalInfo: {
      fullName: optimizedContent.personalInfo.fullName,
      email: resumeData.personalInfo.email,
      phone: resumeData.personalInfo.phone,
      location: resumeData.personalInfo.location,
      linkedin: resumeData.personalInfo.linkedin,
      website: resumeData.personalInfo.website,
      summary: optimizedContent.personalInfo.summary
    },
    experience: optimizedContent.experience,
    education: optimizedContent.education,
    skills: optimizedContent.skills,
    projects: optimizedContent.projects || [],
    template,
    customization: {
      fontSize: '11pt',
      fontFamily: 'Arial',
      colorScheme: 'professional',
      layout: 'single-column'
    }
  }

  return structuredResume
}

async function optimizeResumeContent(
  resumeData: any,
  targetJob?: string,
  industry?: string,
  experienceLevel?: string
) {
  const prompt = `Optimize this resume for a ${experienceLevel || 'mid-level'} ${targetJob || 'professional'} position in the ${industry || 'technology'} industry. Focus on:

1. Professional summary that highlights key strengths and career goals
2. Experience descriptions with quantifiable achievements
3. Skills prioritization based on industry relevance
4. Education and certifications optimization
5. Overall ATS compatibility and keyword integration

Original Resume Data:
${JSON.stringify(resumeData, null, 2)}

Return optimized JSON with the same structure but enhanced content.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'You are an expert resume writer and career counselor. Optimize resumes for maximum impact and ATS compatibility.'
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 2000
    })

    const response = completion.choices[0]?.message?.content?.trim()
    if (response) {
      const optimized = JSON.parse(response)
      return optimized
    }
  } catch (e) {
    // Fall-through to return original data
  }

  return resumeData
}

function wrapTailoredTextAsHtml(text: string, name: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#111;max-width:8.5in;margin:0 auto;padding:0.5in;white-space:pre-wrap}</style></head><body><div style="font-weight:700;font-size:16pt;margin-bottom:8px">${name}</div>${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`
}

function serializeResumeToPlainText(data: any): string {
  try {
    const sections: string[] = []
    sections.push(`${data.personalInfo.fullName}\n${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}`)
    if (data.personalInfo.summary) sections.push(`\nSummary\n${data.personalInfo.summary}`)
    if (Array.isArray(data.skills?.technical) || Array.isArray(data.skills?.soft)) {
      sections.push(`\nSkills\n${[...(data.skills.technical||[]), ...(data.skills.soft||[])].join(', ')}`)
    }
    if (Array.isArray(data.experience)) {
      sections.push(`\nExperience`)
      for (const exp of data.experience) {
        sections.push(`${exp.position} — ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})\n- ${exp.description}`)
      }
    }
    return sections.join('\n')
  } catch {
    return ''
  }
}

async function generateResumeOutput(resume: ResumeData, template: string) {
  // Stubbed: formatting is handled on client; return basic HTML container for now
  return { html: wrapTailoredTextAsHtml(JSON.stringify(resume, null, 2), resume.personalInfo.fullName) }
}

function generateResumePreview(resume: ResumeData, template: string) {
  return { thumbnail: null, summary: `${resume.personalInfo.fullName} — ${resume.experience?.[0]?.position || ''}` }
}
