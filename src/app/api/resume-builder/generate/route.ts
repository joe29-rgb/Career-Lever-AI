import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import { authOptions } from '@/lib/auth'
import { PerplexityService } from '@/lib/perplexity-service'
import { z } from 'zod'
import { extractKeywords } from '@/lib/utils'
import { getTemplateById, ResumeFormatter, getTemplateCss } from '@/lib/resume-templates'
import { isRateLimited } from '@/lib/rate-limit'

const ppx = new PerplexityService()

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

    const limiter = await isRateLimited((session.user as any).id, 'resume-builder:generate')
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
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
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

    // ENTERPRISE FIX: Handle both structured data and text-only input
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
    
    // If only text provided, treat it as resumeTextInput for job-targeted generation
    if (!resumeData && resumeTextInput) {
      console.log('[RESUME_BUILDER] Text-only input received, length:', resumeTextInput.length)
      // This is valid - the optimizer uses text input
      // Continue to the job description check below
    }

    await connectToDatabase()

    if (jobDescription && typeof jobDescription === 'string' && jobDescription.length > 20) {
      // Serialize current builder data to plain text resume
      const resumeText = typeof resumeTextInput === 'string' && resumeTextInput.length > 0 ? resumeTextInput : serializeResumeToPlainText(resumeData || {})
      const kws = extractKeywords(jobDescription || '')
      const tpl = getTemplateById(template || 'modern')
      const jt = targetJob || 'Role'
      const cn = ''
      const keywordsList = Array.isArray(kws) ? kws.slice(0, 20) : []
      const toneStr = tone || 'professional'
      const basePrompt = (() => {
        if (tpl.id === 'professional') {
          return `You are a seasoned executive resume writer for traditional, corporate-focused resumes.\n\nTEMPLATE: Professional\nTARGET: ${jt} at ${cn}\nTONE: ${toneStr}\n\nFORMATTING: Traditional, ATS-safe, quantified achievements, leadership emphasis.\nKEYWORDS: ${keywordsList.join(', ')}\nSTRUCTURE: Executive Summary; Core Competencies; Experience; Education; Affiliations; Achievements.\n\nSTRICT OUTPUT: Return ONLY an HTML fragment using classes: .section, .section-header, .job-entry, .job-title, .company-info, .job-description (UL of LIs). No markdown; no <html>/<head>/<body>.`
        } else if (tpl.id === 'creative') {
          return `You are a creative industry resume specialist for marketing/design roles.\n\nTEMPLATE: Creative\nTARGET: ${jt} at ${cn}\nTONE: ${toneStr}\n\nFORMATTING: Balanced creativity + ATS compatibility, project outcomes, metrics.\nKEYWORDS: ${keywordsList.join(', ')}\nSTRUCTURE: Creative Profile; Core Creative Competencies; Experience; Projects; Education; Proficiencies.\n\nSTRICT OUTPUT: Return ONLY an HTML fragment using classes: .section, .section-header, .job-entry, .job-title, .company-info, .job-description. No markdown; no wrapper HTML.`
        } else if (tpl.id === 'tech') {
          return `You are a technical resume specialist for engineering roles.\n\nTEMPLATE: Tech-Focused\nTARGET: ${jt} at ${cn}\nTONE: ${toneStr}\n\nFORMATTING: Precise technical terminology, system metrics, architecture decisions.\nKEYWORDS: ${keywordsList.join(', ')}\nSTRUCTURE: Technical Summary; Technical Skills; Experience; Projects; Education; Achievements.\n\nSTRICT OUTPUT: Return ONLY an HTML fragment using classes: .section, .section-header, .job-entry, .job-title, .company-info, .job-description. No markdown; no wrapper HTML.`
        }
        return `You are an expert resume writer for modern, ATS-optimized resumes.\n\nTEMPLATE: Modern\nTARGET: ${jt} at ${cn}\nTONE: ${toneStr}\n\nFORMATTING: Clean, scannable, quantified achievements, standard headings.\nKEYWORDS: ${keywordsList.join(', ')}\nSTRUCTURE: Summary; Core Competencies; Experience; Education; Technical Skills; Achievements.\n\nSTRICT OUTPUT: Return ONLY an HTML fragment using classes: .section, .section-header, .job-entry, .job-title, .company-info, .job-description. No markdown; no wrapper HTML.`
      })()
      const system = basePrompt + `\n\n🚨 CRITICAL RULES:\n1. NEVER fabricate job descriptions, achievements, or responsibilities\n2. NEVER add details not explicitly stated in the original resume\n3. ONLY reformat existing content to highlight relevant experience\n4. ONLY reorder sections to emphasize skills matching the job description\n5. Use exact wording from original resume for all accomplishments\n6. You may only: rearrange bullet points, emphasize matching keywords, improve formatting`
      const user = `Original resume (plain text):\n${resumeText}\n\nTarget job description:\n${jobDescription}\n\nRETURN: HTML fragment with EXACT content from original resume, reformatted to emphasize relevant experience. DO NOT invent new achievements or responsibilities.`
      const out = await ppx.makeRequest(system, user, { maxTokens: 3000, temperature: 0.35 })
      const fragment = (out.content || '').trim()
      const tailoredHtml = wrapHtmlFragmentWithTemplateCss(fragment, tpl)
      return NextResponse.json({
        success: true,
        resumeText: fragment.replace(/<[^>]+>/g, '').trim(),
        matchScore: 0,
        suggestions: [] as string[],
        output: {
          html: tailoredHtml,
          css: '',
          pdfOptions: { format: 'A4' }
        },
        preview: { thumbnail: null, summary: null }
      })
    } else {
      // PERPLEXITY AUDIT FIX: Handle text-only input by converting to structured data first
      let structuredData = resumeData
      
      if (!structuredData && resumeTextInput && resumeTextInput.length > 100) {
        console.log('[RESUME_BUILDER] Converting text to structured data, length:', resumeTextInput.length)
        try {
          structuredData = await convertTextToStructuredData(resumeTextInput)
          console.log('[RESUME_BUILDER] Conversion successful, sections found:', Object.keys(structuredData || {}).length)
        } catch (err) {
          console.error('[RESUME_BUILDER] Text conversion failed:', err)
          return NextResponse.json(
            { 
              error: 'Failed to process resume text',
              details: 'Could not extract structured data from the provided text. Please try uploading your resume or provide more complete information.',
              hint: 'Ensure your resume includes: contact info, work experience, education, and skills'
            },
            { status: 400 }
          )
        }
      }
      
      // Generate optimized resume content via classic flow
      const optimizedResume = await generateOptimizedResume(
        structuredData,
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
  // ENTERPRISE FIX: Handle null/undefined resumeData gracefully
  if (!resumeData) {
    console.warn('[RESUME_BUILDER] No resumeData provided, returning minimal structure')
    return {
      personalInfo: {
        fullName: 'User',
        email: '',
        phone: '',
        location: '',
        summary: 'Professional Summary'
      },
      experience: [],
      education: [],
      skills: { 
        technical: [], 
        soft: [], 
        languages: [], 
        certifications: [] 
      },
      projects: [],
      template,
      customization: {
        fontSize: '11pt',
        fontFamily: 'Arial',
        colorScheme: 'professional',
        layout: 'single-column'
      }
    }
  }

  // Use AI to optimize and enhance resume content
  const optimizedContent = await optimizeResumeContent(resumeData, targetJob, industry, experienceLevel)

  // ENTERPRISE FIX: Safely access nested properties with fallbacks
  const personalInfo = optimizedContent?.personalInfo || resumeData?.personalInfo || {}
  const originalInfo = resumeData?.personalInfo || {}

  // Structure the resume data
  const structuredResume: ResumeData = {
    personalInfo: {
      fullName: personalInfo.fullName || originalInfo.fullName || 'User',
      email: personalInfo.email || originalInfo.email || '',
      phone: personalInfo.phone || originalInfo.phone || '',
      location: personalInfo.location || originalInfo.location || '',
      linkedin: personalInfo.linkedin || originalInfo.linkedin,
      website: personalInfo.website || originalInfo.website,
      summary: personalInfo.summary || originalInfo.summary || ''
    },
    experience: optimizedContent?.experience || resumeData?.experience || [],
    education: optimizedContent?.education || resumeData?.education || [],
    skills: optimizedContent?.skills || resumeData?.skills || { 
      technical: [], 
      soft: [], 
      languages: [], 
      certifications: [] 
    },
    projects: optimizedContent?.projects || resumeData?.projects || [],
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
    const system = 'You are an expert resume writer and career counselor. Optimize resumes for maximum impact and ATS compatibility. Return strict JSON with the same structure as input.'
    const out = await ppx.makeRequest(system, prompt, { temperature: 0.4, maxTokens: 2000 })
    let text = (out.content || '').trim()
    
    // ENTERPRISE FIX: Strip markdown code blocks from AI response
    text = text.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
    
    // Extract JSON if wrapped in explanatory text
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      text = jsonMatch[0]
    }
    
    if (text) {
      console.log('[RESUME_BUILDER] Parsing optimized content:', text.slice(0, 200))
      const optimized = JSON.parse(text)
      return optimized
    }
  } catch (e) {
    console.error('[RESUME_BUILDER] Optimization failed:', e)
    // Fall-through to return original data
  }

  return resumeData
}

function wrapHtmlFragmentWithTemplateCss(fragmentHtml: string, tpl: ReturnType<typeof getTemplateById>) {
  const safe = (fragmentHtml || '').replace(/<\/?(html|head|body|style)[^>]*>/gi, '')
  const css = getTemplateCss(tpl)
  return `<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>${css}</style></head><body><div class=\"resume-container\">${safe}</div></body></html>`
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
  const tpl = getTemplateById(template || 'modern')
  const content = mapResumeDataToContent(resume)
  const html = ResumeFormatter.formatResume(content, tpl)
  return { html }
}

function generateResumePreview(resume: ResumeData, template: string) {
  return { thumbnail: null, summary: `${resume.personalInfo.fullName} — ${resume.experience?.[0]?.position || ''}` }
}

/**
 * PERPLEXITY AUDIT FIX: Convert raw resume text to structured data
 * Uses Perplexity AI to extract sections from unstructured text
 */
async function convertTextToStructuredData(resumeText: string): Promise<ResumeData> {
  const { PerplexityService } = await import('@/lib/perplexity-service')
  const { extractEnterpriseJSON } = await import('@/lib/utils/enterprise-json-extractor')
  
  const client = new PerplexityService()
  
  const prompt = `Extract structured resume data from this text:

${resumeText}

Return ONLY JSON (no markdown, no explanations):
{
  "personalInfo": {
    "fullName": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "City, State/Province",
    "summary": "Professional summary"
  },
  "experience": [{
    "company": "Company Name",
    "position": "Job Title",
    "location": "Location",
    "startDate": "YYYY-MM",
    "endDate": "YYYY-MM or Present",
    "current": false,
    "description": "Role description",
    "achievements": ["Achievement 1", "Achievement 2"],
    "technologies": ["Tech 1", "Tech 2"]
  }],
  "education": [{
    "institution": "School Name",
    "degree": "Degree Type",
    "field": "Field of Study",
    "location": "Location",
    "graduationDate": "YYYY-MM"
  }],
  "skills": {
    "technical": ["Skill 1", "Skill 2"],
    "soft": ["Skill 1", "Skill 2"],
    "languages": [],
    "certifications": []
  }
}`
  
  const response = await client.makeRequest(
    'You extract structured resume data from unstructured text. Return only valid JSON.',
    prompt,
    { temperature: 0.2, maxTokens: 2000 }
  )
  
  const extractionResult = extractEnterpriseJSON(response.content)
  
  if (!extractionResult.success) {
    throw new Error(`Failed to extract structured data: ${extractionResult.error}`)
  }
  
  return extractionResult.data as ResumeData
}

function mapResumeDataToContent(resume: ResumeData) {
  return {
    personalInfo: {
      fullName: resume.personalInfo.fullName,
      email: resume.personalInfo.email,
      phone: resume.personalInfo.phone,
      location: resume.personalInfo.location,
      linkedin: resume.personalInfo.linkedin
    },
    summary: resume.personalInfo.summary,
    coreCompetencies: (resume.skills?.technical || []).slice(0, 10),
    experience: (resume.experience || []).map(e => ({
      title: e.position,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.current ? 'Present' : e.endDate,
      responsibilities: e.description ? e.description.split(/\n+/).filter(Boolean) : []
    })),
    education: (resume.education || []).map(e => `${e.degree}, ${e.institution} (${e.graduationDate})`),
    skills: [...(resume.skills?.technical || []), ...(resume.skills?.soft || [])],
    achievements: [] as string[]
  }
}
