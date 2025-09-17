import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'
import { AIService } from '@/lib/ai-service'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
  } catch (error) {
    console.error('Resume optimization error:', error)
  }

  // Fallback: return original data with basic enhancements
  return enhanceResumeFallback(resumeData, targetJob, industry)
}

function enhanceResumeFallback(resumeData: any, targetJob?: string, industry?: string) {
  // Basic enhancement without AI
  const enhanced = { ...resumeData }

  // Enhance summary
  if (!enhanced.personalInfo.summary || enhanced.personalInfo.summary.length < 50) {
    enhanced.personalInfo.summary = `Mid-level ${targetJob || 'professional'} with ${enhanced.experience?.length || 0} years of experience in ${industry || 'technology'}. Proven track record of delivering results and driving success.`
  }

  // Add keywords to experience descriptions
  if (enhanced.experience) {
    enhanced.experience = enhanced.experience.map((exp: any) => ({
      ...exp,
      description: exp.description || `Led key initiatives and delivered measurable results in ${exp.position} role.`,
      achievements: exp.achievements || [
        'Led cross-functional team initiatives',
        'Implemented process improvements',
        'Received recognition for outstanding contributions'
      ]
    }))
  }

  // Add relevant skills if missing
  if (!enhanced.skills) {
    enhanced.skills = {
      technical: ['Problem Solving', 'Communication', 'Leadership'],
      soft: ['Team Collaboration', 'Project Management', 'Adaptability'],
      languages: [{ language: 'English', proficiency: 'Native' }],
      certifications: []
    }
  }

  return enhanced
}

async function generateResumeOutput(resume: ResumeData, template: string) {
  // Generate HTML/CSS for the resume
  const html = generateResumeHTML(resume, template)
  const css = generateResumeCSS(template)

  return {
    html,
    css,
    pdfOptions: {
      format: 'A4',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    }
  }
}

function generateResumeHTML(resume: ResumeData, template: string): string {
  const { personalInfo, experience, education, skills, projects } = resume

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${personalInfo.fullName} - Resume</title>
        <style>
            body { font-family: ${resume.customization.fontFamily}, sans-serif; font-size: ${resume.customization.fontSize}; line-height: 1.5; color: #333; }
            .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #007acc; }
            .name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .contact { font-size: 12px; color: #666; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; color: #007acc; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .experience-item, .education-item { margin-bottom: 15px; }
            .job-title { font-weight: bold; }
            .company { font-style: italic; color: #666; }
            .date { float: right; font-size: 12px; color: #666; }
            .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
            .skill-category { margin-bottom: 10px; }
            .skill-category h4 { font-weight: bold; margin-bottom: 5px; }
            .skill-tag { display: inline-block; background: #f0f0f0; padding: 2px 8px; margin: 2px; border-radius: 3px; font-size: 11px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="name">${personalInfo.fullName}</div>
            <div class="contact">
                ${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}
                ${personalInfo.linkedin ? ` | ${personalInfo.linkedin}` : ''}
                ${personalInfo.website ? ` | ${personalInfo.website}` : ''}
            </div>
        </div>

        ${personalInfo.summary ? `
        <div class="section">
            <div class="section-title">Professional Summary</div>
            <p>${personalInfo.summary}</p>
        </div>
        ` : ''}

        ${experience && experience.length > 0 ? `
        <div class="section">
            <div class="section-title">Professional Experience</div>
            ${experience.map(exp => `
                <div class="experience-item">
                    <div class="job-title">${exp.position}</div>
                    <div class="company">${exp.company}, ${exp.location}</div>
                    <div class="date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
                    <div style="clear: both;"></div>
                    <p>${exp.description}</p>
                    ${exp.achievements && exp.achievements.length > 0 ? `
                        <ul>
                            ${exp.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${exp.technologies && exp.technologies.length > 0 ? `
                        <div><strong>Technologies:</strong> ${exp.technologies.join(', ')}</div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${education && education.length > 0 ? `
        <div class="section">
            <div class="section-title">Education</div>
            ${education.map(edu => `
                <div class="education-item">
                    <div class="job-title">${edu.degree} in ${edu.field}</div>
                    <div class="company">${edu.institution}, ${edu.location}</div>
                    <div class="date">${edu.graduationDate}</div>
                    <div style="clear: both;"></div>
                    ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
                    ${edu.honors && edu.honors.length > 0 ? `<div>Honors: ${edu.honors.join(', ')}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${skills ? `
        <div class="section">
            <div class="section-title">Skills & Certifications</div>
            <div class="skills-grid">
                ${skills.technical && skills.technical.length > 0 ? `
                    <div class="skill-category">
                        <h4>Technical Skills</h4>
                        ${skills.technical.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                ` : ''}

                ${skills.soft && skills.soft.length > 0 ? `
                    <div class="skill-category">
                        <h4>Soft Skills</h4>
                        ${skills.soft.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                ` : ''}

                ${skills.languages && skills.languages.length > 0 ? `
                    <div class="skill-category">
                        <h4>Languages</h4>
                        ${skills.languages.map(lang => `<span class="skill-tag">${lang.language} (${lang.proficiency})</span>`).join('')}
                    </div>
                ` : ''}
            </div>

            ${skills.certifications && skills.certifications.length > 0 ? `
                <div class="skill-category" style="margin-top: 15px;">
                    <h4>Certifications</h4>
                    ${skills.certifications.map(cert => `<div>${cert.name} - ${cert.issuer} (${cert.date})</div>`).join('')}
                </div>
            ` : ''}
        </div>
        ` : ''}

        ${projects && projects.length > 0 ? `
        <div class="section">
            <div class="section-title">Projects</div>
            ${projects.map(project => `
                <div class="experience-item">
                    <div class="job-title">${project.name}</div>
                    <div class="date">${project.startDate} - ${project.endDate}</div>
                    <div style="clear: both;"></div>
                    <p>${project.description}</p>
                    ${project.technologies && project.technologies.length > 0 ? `
                        <div><strong>Technologies:</strong> ${project.technologies.join(', ')}</div>
                    ` : ''}
                    ${project.url || project.github ? `
                        <div>
                            ${project.url ? `<a href="${project.url}">Live Demo</a>` : ''}
                            ${project.github ? ` | <a href="${project.github}">GitHub</a>` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
    </body>
    </html>
  `
}

function generateResumeCSS(template: string): string {
  const baseCSS = `
    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #007acc;
    }

    .name {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .contact {
      font-size: 10pt;
      color: #666;
    }

    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 8px;
      color: #007acc;
      border-bottom: 1px solid #ddd;
      padding-bottom: 3px;
    }

    .experience-item, .education-item {
      margin-bottom: 12px;
    }

    .job-title {
      font-weight: bold;
      font-size: 12pt;
    }

    .company {
      font-style: italic;
      color: #666;
      font-size: 11pt;
    }

    .date {
      float: right;
      font-size: 10pt;
      color: #666;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }

    .skill-category h4 {
      font-weight: bold;
      margin-bottom: 4px;
      font-size: 11pt;
    }

    .skill-tag {
      display: inline-block;
      background: #f5f5f5;
      padding: 2px 6px;
      margin: 1px;
      border-radius: 2px;
      font-size: 9pt;
      border: 1px solid #ddd;
    }
  `

  // Add template-specific styles
  const templateCSS = getTemplateCSS(template)

  return baseCSS + templateCSS
}

function getTemplateCSS(template: string): string {
  switch (template) {
    case 'modern':
      return `
        body { font-family: 'Helvetica', sans-serif; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 5px; }
        .name { color: white; }
        .contact { color: rgba(255,255,255,0.8); }
        .section-title { color: #667eea; border-color: #667eea; }
      `
    case 'professional':
      return `
        .section-title { color: #2c3e50; border-color: #2c3e50; }
        .skill-tag { background: #ecf0f1; border-color: #bdc3c7; }
      `
    case 'creative':
      return `
        .header { background: #e74c3c; color: white; }
        .section-title { color: #e74c3c; }
        .skill-tag { background: #fadbd8; border-color: #e74c3c; color: #e74c3c; }
      `
    default:
      return ''
  }
}

function generateResumePreview(resume: ResumeData, template: string) {
  // Generate a simplified preview
  return {
    thumbnail: `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="200" height="280" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="280" fill="white" stroke="#ddd"/>
        <text x="100" y="30" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">${resume.personalInfo.fullName}</text>
        <text x="100" y="50" text-anchor="middle" font-family="Arial" font-size="10" fill="#666">${resume.personalInfo.email}</text>
        <rect x="20" y="70" width="160" height="4" fill="#007acc"/>
        <text x="20" y="90" font-family="Arial" font-size="12" font-weight="bold">EXPERIENCE</text>
        <text x="20" y="110" font-family="Arial" font-size="10">${resume.experience?.[0]?.position || 'Position'}</text>
        <text x="20" y="125" font-family="Arial" font-size="9" fill="#666">${resume.experience?.[0]?.company || 'Company'}</text>
        <rect x="20" y="140" width="160" height="4" fill="#007acc"/>
        <text x="20" y="160" font-family="Arial" font-size="12" font-weight="bold">SKILLS</text>
        <text x="20" y="180" font-family="Arial" font-size="9">${resume.skills?.technical?.slice(0, 3).join(', ') || 'Skills'}</text>
      </svg>
    `).toString('base64')}`,
    summary: {
      sections: Object.keys(resume).filter(key => key !== 'template' && key !== 'customization'),
      wordCount: JSON.stringify(resume).split(' ').length,
      completeness: calculateCompletenessScore(resume)
    }
  }
}

function calculateCompletenessScore(resume: ResumeData): number {
  let score = 0
  let total = 0

  // Personal info (30%)
  total += 30
  if (resume.personalInfo.fullName) score += 10
  if (resume.personalInfo.email) score += 10
  if (resume.personalInfo.summary) score += 10

  // Experience (30%)
  total += 30
  if (resume.experience && resume.experience.length > 0) {
    score += 30
  }

  // Education (15%)
  total += 15
  if (resume.education && resume.education.length > 0) {
    score += 15
  }

  // Skills (15%)
  total += 15
  if (resume.skills && (resume.skills.technical.length > 0 || resume.skills.soft.length > 0)) {
    score += 15
  }

  // Projects (10%)
  total += 10
  if (resume.projects && resume.projects.length > 0) {
    score += 10
  }

  return Math.round((score / total) * 100)
}

function serializeResumeToPlainText(resumeData: any): string {
  const lines: string[] = []
  const pi = resumeData.personalInfo || {}
  lines.push(`${pi.fullName || ''}`)
  lines.push(`${pi.email || ''} | ${pi.phone || ''} | ${pi.location || ''}`)
  if (pi.linkedin) lines.push(`LinkedIn: ${pi.linkedin}`)
  if (pi.website) lines.push(`Website: ${pi.website}`)
  if (pi.summary) {
    lines.push('Summary:')
    lines.push(pi.summary)
  }
  if (Array.isArray(resumeData.experience)) {
    lines.push('Experience:')
    for (const exp of resumeData.experience) {
      lines.push(`- ${exp.position || ''} at ${exp.company || ''} (${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''})`) 
      if (exp.description) lines.push(`  ${exp.description}`)
      if (Array.isArray(exp.achievements) && exp.achievements.length) {
        for (const a of exp.achievements) lines.push(`  * ${a}`)
      }
      if (Array.isArray(exp.technologies) && exp.technologies.length) {
        lines.push(`  Tech: ${exp.technologies.join(', ')}`)
      }
    }
  }
  if (Array.isArray(resumeData.education)) {
    lines.push('Education:')
    for (const edu of resumeData.education) {
      lines.push(`- ${edu.degree || ''} in ${edu.field || ''} @ ${edu.institution || ''} (${edu.graduationDate || ''})`)
    }
  }
  if (resumeData.skills) {
    const s = resumeData.skills
    if (Array.isArray(s.technical) && s.technical.length) lines.push(`Technical: ${s.technical.join(', ')}`)
    if (Array.isArray(s.soft) && s.soft.length) lines.push(`Soft: ${s.soft.join(', ')}`)
    if (Array.isArray(s.languages) && s.languages.length) lines.push(`Languages: ${s.languages.map((l: any)=>`${l.language}(${l.proficiency})`).join(', ')}`)
    if (Array.isArray(s.certifications) && s.certifications.length) lines.push(`Certs: ${s.certifications.map((c:any)=>c.name).join(', ')}`)
  }
  if (Array.isArray(resumeData.projects) && resumeData.projects.length) {
    lines.push('Projects:')
    for (const p of resumeData.projects) {
      lines.push(`- ${p.name || ''}: ${p.description || ''}`)
    }
  }
  return lines.filter(Boolean).join('\n')
}

function wrapTailoredTextAsHtml(text: string, fullName: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fullName} - Tailored Resume</title>
  <style>body{font-family:Arial, sans-serif; font-size:11pt; line-height:1.5; color:#333; max-width:8.5in; margin:0 auto; padding:0.5in; white-space:pre-wrap}</style>
  </head><body>${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`
}
