/**
 * Shared Cover Letter Generator
 * 
 * Consolidates cover letter generation logic with:
 * - Resume template integration
 * - Job description analysis
 * - Company psychology integration
 * - Perplexity Agent API
 * - Authenticity validation
 */

import { PerplexityService } from './perplexity-service'
import { validateAuthenticityLetter, sanitizeCoverLetter } from './authenticity'
import { getTemplateById } from './resume-templates-v2'
import { ENHANCED_COVER_LETTER_SYSTEM_PROMPT, buildEnhancedCoverLetterUserPrompt } from './prompts/perplexity'

export interface CoverLetterParams {
  resumeText: string
  jobTitle: string
  companyName: string
  jobDescription: string
  candidateName?: string
  candidateEmail?: string
  hiringContactName?: string
  templateId?: string
  tone?: 'professional' | 'conversational' | 'technical'
  length?: 'short' | 'medium' | 'long'
  psychology?: Record<string, unknown> // Company psychology data
  yearsExperience?: number
}

export interface CoverLetterResult {
  coverLetter: string
  authenticity: {
    isValid: boolean
    violations: string[]
    warnings: string[]
    authenticityScore: number
  }
  wordCount: number
  template: string
  preview?: {
    html: string
  }
}

/**
 * Generate cover letter with full integration
 */
export async function generateCoverLetter(params: CoverLetterParams): Promise<CoverLetterResult> {
  const {
    resumeText,
    jobTitle,
    companyName,
    jobDescription,
    candidateName = '',
    templateId = 'modern',
    tone = 'professional',
    psychology,
    yearsExperience
  } = params

  // Get template for styling consistency
  const template = getTemplateById(templateId)
  
  // Calculate years of experience if not provided
  const calculatedYears = yearsExperience ?? extractYearsFromResume(resumeText)
  
  console.log('[COVER_LETTER_GEN] Generating with template:', template.name)
  console.log('[COVER_LETTER_GEN] Years of experience:', calculatedYears)
  console.log('[COVER_LETTER_GEN] Has psychology data:', !!psychology)

  // Build Perplexity prompt with all context
  const ppx = new PerplexityService()
  
  const companyPayload: Record<string, unknown> = {
    ...(psychology || {}),
    yearsExperience: calculatedYears,
    experienceNote: `CRITICAL: Candidate has EXACTLY ${calculatedYears} years of experience. Do NOT exaggerate.`
  }

  const userPrompt = buildEnhancedCoverLetterUserPrompt({
    candidateName,
    jobTitle,
    companyName,
    location: '',
    jobDescription: jobDescription || `Position at ${companyName} for ${jobTitle} role.`,
    candidateHighlights: resumeText.slice(0, 2000),
    companyData: companyPayload
  })

  // Build system prompt with experience constraints
  const systemPrompt = buildSystemPromptWithConstraints(
    template,
    calculatedYears,
    tone
  )

  // Call Perplexity with Agent API (function calling)
  const result = await ppx.chat(`${systemPrompt}\n\n${userPrompt}`, {
    model: 'sonar-pro',
    maxTokens: 1800,
    temperature: 0.35
  })

  let coverLetter = (result.content || '').trim()

  // Validate authenticity
  const authenticityReport = validateAuthenticityLetter(resumeText, coverLetter)
  
  if (!authenticityReport.isValid) {
    console.log('[COVER_LETTER_GEN] Authenticity issues found, sanitizing...')
    coverLetter = sanitizeCoverLetter(resumeText, coverLetter)
  }

  const wordCount = coverLetter.split(/\s+/).filter(Boolean).length

  // Generate styled preview
  const preview = generatePreview(coverLetter, template.name)

  return {
    coverLetter,
    authenticity: authenticityReport,
    wordCount,
    template: template.name,
    preview
  }
}

/**
 * Build system prompt with template and experience constraints
 */
function buildSystemPromptWithConstraints(
  template: { id: string; name: string },
  yearsExperience: number,
  tone: string
): string {
  const templateGuidance = getTemplateGuidance(template.id)
  
  return `${ENHANCED_COVER_LETTER_SYSTEM_PROMPT}

TEMPLATE ALIGNMENT:
${templateGuidance}

TONE: ${tone}
- Professional: Formal, business-appropriate language
- Conversational: Warm, personable while maintaining professionalism
- Technical: Precise, technical terminology, metrics-focused

CRITICAL EXPERIENCE CONSTRAINT:
- Candidate has EXACTLY ${yearsExperience} years of total work experience
- DO NOT say "decades", "38 years", or any number higher than ${yearsExperience}
- If ${yearsExperience} < 10, say "several years" or "${yearsExperience} years"
- If ${yearsExperience} >= 10 && ${yearsExperience} < 20, say "${yearsExperience} years" or "over a decade"
- If ${yearsExperience} >= 20, say "${yearsExperience} years" or "two decades"
- NEVER invent or exaggerate experience duration
- Use ONLY the experience data provided in the resume

FORMATTING REQUIREMENTS:
- Use proper paragraph breaks (double newline)
- Include date and contact information at top
- Professional salutation
- 3-4 body paragraphs
- Professional closing
- NO markdown formatting
- NO HTML tags
- Plain text with proper spacing`
}

/**
 * Get template-specific guidance
 */
function getTemplateGuidance(templateId: string): string {
  const guidance: Record<string, string> = {
    modern: 'Modern, forward-thinking language. Emphasize innovation and adaptability. Use active voice.',
    professional: 'Traditional, corporate language. Emphasize leadership and results. Formal tone.',
    creative: 'Engaging, personality-driven language. Show creativity while maintaining professionalism.',
    tech: 'Technical precision. Use industry terminology. Emphasize technical achievements and metrics.',
    minimal: 'Concise, direct language. Focus on key qualifications. No fluff.',
    executive: 'Strategic, high-level language. Emphasize leadership impact and business outcomes.',
    cv: 'Academic, research-focused language. Emphasize publications, research, and scholarly achievements.'
  }
  
  return guidance[templateId] || guidance.modern
}

/**
 * Extract years of experience from resume (simplified)
 */
function extractYearsFromResume(resumeText: string): number {
  // Simple extraction - look for common patterns
  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
    /experience:\s*(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*years?\s+in\s+/i
  ]
  
  for (const pattern of patterns) {
    const match = resumeText.match(pattern)
    if (match) {
      const years = parseInt(match[1])
      if (years > 0 && years <= 50) {
        return years
      }
    }
  }
  
  // Fallback: count date ranges (simplified version)
  const dateRanges = resumeText.match(/\d{4}\s*[-–—]\s*(?:\d{4}|Present|Current)/gi)
  if (dateRanges && dateRanges.length > 0) {
    // Rough estimate: 3 years per job
    return Math.min(dateRanges.length * 3, 25)
  }
  
  return 5 // Default fallback
}

/**
 * Generate HTML preview
 */
function generatePreview(coverLetter: string, templateName: string): { html: string } {
  const paragraphs = coverLetter.split('\n\n').filter(p => p.trim())
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Cover Letter Preview</title>
  <style>
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      background: #fff;
    }
    .template-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 9pt;
      color: #666;
    }
    p {
      margin: 0 0 1em 0;
      text-align: justify;
    }
    .signature {
      margin-top: 2em;
    }
  </style>
</head>
<body>
  <div class="template-badge">${templateName} Template</div>
  ${paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n  ')}
</body>
</html>`
  
  return { html }
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
