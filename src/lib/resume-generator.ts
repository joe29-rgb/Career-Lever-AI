/**
 * Shared Resume Generator
 * 
 * Consolidates resume generation logic with:
 * - Template integration
 * - Job description analysis
 * - Perplexity Agent API
 * - Experience calculation
 * - ATS optimization
 */

import { PerplexityService } from './perplexity-service'
import { getTemplateById } from './resume-templates-v2'
import { extractKeywords } from './utils'

export interface ResumeGenerationParams {
  resumeData?: ResumeData
  resumeText?: string
  template?: string
  targetJob?: string
  companyName?: string
  jobDescription?: string
  industry?: string
  experienceLevel?: 'entry' | 'mid' | 'senior'
  tone?: 'professional' | 'conversational' | 'technical'
}

export interface ResumeData {
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
}

export interface ResumeGenerationResult {
  resumeData: ResumeData
  html: string
  plainText: string
  template: string
  matchScore?: number
  suggestions: string[]
  preview?: {
    thumbnail: string | null
    summary: string | null
  }
}

/**
 * Generate optimized resume with full integration
 */
export async function generateResume(params: ResumeGenerationParams): Promise<ResumeGenerationResult> {
  const {
    resumeData,
    resumeText,
    template = 'modern',
    targetJob,
    companyName,
    jobDescription,
    industry,
    experienceLevel = 'mid',
    tone = 'professional'
  } = params

  console.log('[RESUME_GEN] Starting generation with template:', template)
  console.log('[RESUME_GEN] Has structured data:', !!resumeData)
  console.log('[RESUME_GEN] Has text input:', !!resumeText)
  console.log('[RESUME_GEN] Has job description:', !!jobDescription)

  // Get template
  const templateObj = getTemplateById(template)

  // Convert text to structured data if needed
  let structuredData = resumeData
  if (!structuredData && resumeText && resumeText.length > 100) {
    console.log('[RESUME_GEN] Converting text to structured data')
    structuredData = await convertTextToStructuredData(resumeText)
  }

  // If we have a job description, optimize for it
  if (jobDescription && jobDescription.length > 20) {
    console.log('[RESUME_GEN] Optimizing for job description')
    const optimized = await optimizeForJobDescription({
      resumeData: structuredData,
      resumeText: resumeText || serializeResumeToPlainText(structuredData),
      jobDescription,
      targetJob,
      companyName,
      template: templateObj,
      tone,
      experienceLevel
    })
    
    return optimized
  }

  // Otherwise, generate standard optimized resume
  if (!structuredData) {
    throw new Error('No resume data provided')
  }

  console.log('[RESUME_GEN] Generating standard optimized resume')
  const optimizedData = await optimizeResumeContent(
    structuredData,
    targetJob,
    industry,
    experienceLevel
  )

  const html = templateObj.generate(optimizedData)
  const fullHtml = wrapWithTemplate(html, templateObj)
  const plainText = serializeResumeToPlainText(optimizedData)

  return {
    resumeData: optimizedData,
    html: fullHtml,
    plainText,
    template: templateObj.name,
    suggestions: [],
    preview: {
      thumbnail: null,
      summary: `${optimizedData.personalInfo.fullName} — ${optimizedData.experience?.[0]?.position || ''}`
    }
  }
}

/**
 * Optimize resume for specific job description
 */
async function optimizeForJobDescription(params: {
  resumeData?: ResumeData
  resumeText: string
  jobDescription: string
  targetJob?: string
  companyName?: string
  template: ReturnType<typeof getTemplateById>
  tone: string
  experienceLevel: string
}): Promise<ResumeGenerationResult> {
  const {
    resumeData,
    resumeText,
    jobDescription,
    targetJob = 'Role',
    companyName = '',
    template,
    tone,
    experienceLevel
  } = params

  // Extract keywords from job description
  const keywords = extractKeywords(jobDescription)
  const keywordsList = Array.isArray(keywords) ? keywords.slice(0, 20) : []

  console.log('[RESUME_GEN] Extracted keywords:', keywordsList.length)

  // Build template-specific prompt
  const systemPrompt = buildTemplatePrompt(template, targetJob, companyName, tone, keywordsList, experienceLevel)

  const userPrompt = `Original resume (plain text):
${resumeText}

Target job description:
${jobDescription}

RETURN: HTML fragment with EXACT content from original resume, reformatted to emphasize relevant experience. DO NOT invent new achievements or responsibilities. Only reorder and emphasize existing content.`

  // Call Perplexity
  const ppx = new PerplexityService()
  const result = await ppx.makeRequest(systemPrompt, userPrompt, {
    maxTokens: 3000,
    temperature: 0.35
  })

  const htmlFragment = (result.content || '').trim()
  const fullHtml = wrapWithTemplate(htmlFragment, template)
  const plainText = htmlFragment.replace(/<[^>]+>/g, '').trim()

  // Calculate match score
  const matchScore = calculateMatchScore(plainText, keywordsList)

  // Generate suggestions
  const suggestions = generateSuggestions(plainText, keywordsList, jobDescription)

  return {
    resumeData: resumeData || ({} as ResumeData),
    html: fullHtml,
    plainText,
    template: template.name,
    matchScore,
    suggestions,
    preview: {
      thumbnail: null,
      summary: null
    }
  }
}

/**
 * Build template-specific system prompt
 */
function buildTemplatePrompt(
  template: ReturnType<typeof getTemplateById>,
  targetJob: string,
  companyName: string,
  tone: string,
  keywords: string[],
  experienceLevel: string
): string {
  const basePrompts: Record<string, string> = {
    professional: `You are a seasoned executive resume writer for traditional, corporate-focused resumes.

TEMPLATE: Professional
TARGET: ${targetJob} at ${companyName}
TONE: ${tone}
EXPERIENCE LEVEL: ${experienceLevel}

FORMATTING: Traditional, ATS-safe, quantified achievements, leadership emphasis.
KEYWORDS: ${keywords.join(', ')}
STRUCTURE: Executive Summary; Core Competencies; Experience; Education; Affiliations; Achievements.`,

    creative: `You are a creative industry resume specialist for marketing/design roles.

TEMPLATE: Creative
TARGET: ${targetJob} at ${companyName}
TONE: ${tone}
EXPERIENCE LEVEL: ${experienceLevel}

FORMATTING: Balanced creativity + ATS compatibility, project outcomes, metrics.
KEYWORDS: ${keywords.join(', ')}
STRUCTURE: Creative Profile; Core Creative Competencies; Experience; Projects; Education; Proficiencies.`,

    tech: `You are a technical resume specialist for engineering roles.

TEMPLATE: Tech-Focused
TARGET: ${targetJob} at ${companyName}
TONE: ${tone}
EXPERIENCE LEVEL: ${experienceLevel}

FORMATTING: Precise technical terminology, system metrics, architecture decisions.
KEYWORDS: ${keywords.join(', ')}
STRUCTURE: Technical Summary; Technical Skills; Experience; Projects; Education; Achievements.`,

    modern: `You are an expert resume writer for modern, ATS-optimized resumes.

TEMPLATE: Modern
TARGET: ${targetJob} at ${companyName}
TONE: ${tone}
EXPERIENCE LEVEL: ${experienceLevel}

FORMATTING: Clean, scannable, quantified achievements, standard headings.
KEYWORDS: ${keywords.join(', ')}
STRUCTURE: Summary; Core Competencies; Experience; Education; Technical Skills; Achievements.`
  }

  const basePrompt = basePrompts[template.id] || basePrompts.modern

  return `${basePrompt}

STRICT OUTPUT: Return ONLY an HTML fragment using classes: .section, .section-header, .job-entry, .job-title, .company-info, .job-description (UL of LIs). No markdown; no <html>/<head>/<body>.

🚨 CRITICAL RULES:
1. NEVER fabricate job descriptions, achievements, or responsibilities
2. NEVER add details not explicitly stated in the original resume
3. ONLY reformat existing content to highlight relevant experience
4. ONLY reorder sections to emphasize skills matching the job description
5. Use exact wording from original resume for all accomplishments
6. You may only: rearrange bullet points, emphasize matching keywords, improve formatting`
}

/**
 * Optimize resume content with AI
 */
async function optimizeResumeContent(
  resumeData: ResumeData,
  targetJob?: string,
  industry?: string,
  experienceLevel?: string
): Promise<ResumeData> {
  const ppx = new PerplexityService()

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
    const result = await ppx.makeRequest(
      'You are an expert resume writer and career counselor. Optimize resumes for maximum impact and ATS compatibility. Return strict JSON with the same structure as input.',
      prompt,
      { temperature: 0.4, maxTokens: 2000 }
    )

    let text = (result.content || '').trim()

    // Strip markdown code blocks
    text = text.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')

    // Extract JSON
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (jsonMatch) {
      text = jsonMatch[0]
    }

    if (text) {
      console.log('[RESUME_GEN] Parsing optimized content')
      const optimized = JSON.parse(text)
      return optimized
    }
  } catch (e) {
    console.error('[RESUME_GEN] Optimization failed:', e)
  }

  return resumeData
}

/**
 * Convert text to structured data using Perplexity
 */
async function convertTextToStructuredData(resumeText: string): Promise<ResumeData> {
  const { extractEnterpriseJSON } = await import('./utils/enterprise-json-extractor')
  const ppx = new PerplexityService()

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
    "id": "1",
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
    "id": "1",
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
  },
  "projects": []
}`

  const response = await ppx.makeRequest(
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

/**
 * Serialize resume to plain text
 */
function serializeResumeToPlainText(data: ResumeData | undefined): string {
  if (!data) return ''

  try {
    const sections: string[] = []

    // Personal info
    sections.push(`${data.personalInfo.fullName}\n${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}`)

    // Summary
    if (data.personalInfo.summary) {
      sections.push(`\nSummary\n${data.personalInfo.summary}`)
    }

    // Skills
    if (Array.isArray(data.skills?.technical) || Array.isArray(data.skills?.soft)) {
      sections.push(`\nSkills\n${[...(data.skills.technical || []), ...(data.skills.soft || [])].join(', ')}`)
    }

    // Experience
    if (Array.isArray(data.experience)) {
      sections.push(`\nExperience`)
      for (const exp of data.experience) {
        sections.push(`${exp.position} — ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})\n- ${exp.description}`)
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach(ach => sections.push(`- ${ach}`))
        }
      }
    }

    // Education
    if (Array.isArray(data.education)) {
      sections.push(`\nEducation`)
      for (const edu of data.education) {
        sections.push(`${edu.degree} in ${edu.field} — ${edu.institution} (${edu.graduationDate})`)
      }
    }

    return sections.join('\n')
  } catch {
    return ''
  }
}

/**
 * Wrap HTML fragment with template CSS
 */
function wrapWithTemplate(htmlFragment: string, template: ReturnType<typeof getTemplateById>): string {
  const safe = (htmlFragment || '').replace(/<\/?(html|head|body|style)[^>]*>/gi, '')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${template.css}</style></head><body><div class="resume-container">${safe}</div></body></html>`
}

/**
 * Calculate match score between resume and keywords
 */
function calculateMatchScore(resumeText: string, keywords: string[]): number {
  if (!keywords || keywords.length === 0) return 0

  const lowerText = resumeText.toLowerCase()
  const matchedKeywords = keywords.filter(kw => lowerText.includes(kw.toLowerCase()))

  return Math.round((matchedKeywords.length / keywords.length) * 100)
}

/**
 * Generate suggestions for improvement
 */
function generateSuggestions(resumeText: string, keywords: string[], jobDescription: string): string[] {
  const suggestions: string[] = []
  const lowerText = resumeText.toLowerCase()

  // Check for missing keywords
  const missingKeywords = keywords.filter(kw => !lowerText.includes(kw.toLowerCase()))
  if (missingKeywords.length > 0) {
    suggestions.push(`Consider adding these keywords: ${missingKeywords.slice(0, 5).join(', ')}`)
  }

  // Check for quantifiable achievements
  const hasNumbers = /\d+%|\d+\+|\$\d+/.test(resumeText)
  if (!hasNumbers) {
    suggestions.push('Add quantifiable achievements (e.g., "Increased sales by 25%")')
  }

  // Check for action verbs
  const actionVerbs = ['led', 'managed', 'developed', 'implemented', 'designed', 'created']
  const hasActionVerbs = actionVerbs.some(verb => lowerText.includes(verb))
  if (!hasActionVerbs) {
    suggestions.push('Use strong action verbs to describe your accomplishments')
  }

  return suggestions
}
