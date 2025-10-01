export interface TemplateSection { section: string; required?: boolean; order: number }

export interface FormattingRules {
  margins: { top: number; bottom: number; left: number; right: number };
  fontSize: { body: number; headings: number; name: number };
  lineSpacing: { body: number; sections: number };
  fontFamily: string;
  colors: { primary: string; secondary: string; text: string };
  spacing: { afterName: number; afterSection: number; betweenJobs: number };
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  structure?: TemplateSection[];
  formatting: FormattingRules;
  atsScore: number;
  bestFor: string[];
}

export type PersonalInfo = { fullName: string; email?: string; phone?: string; location?: string; linkedin?: string };
export type Experience = { title: string; company: string; location?: string; startDate?: string; endDate?: string; responsibilities: string[] };
export type ResumeContent = { personalInfo: PersonalInfo; summary?: string; coreCompetencies?: string[]; experience: Experience[]; education?: string[]; skills?: string[]; achievements?: string[] };

export const MODERN_TEMPLATE: ResumeTemplate = {
  id: 'modern', name: 'Modern', description: 'Clean, contemporary design with subtle colors', atsScore: 95, bestFor: ['tech','marketing','design','startups'],
  formatting: {
    margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 },
    fontSize: { name: 28, headings: 14, body: 11 },
    lineSpacing: { body: 1.15, sections: 1.5 },
    fontFamily: 'Calibri, Arial, sans-serif',
    colors: { primary: '#2563EB', secondary: '#64748B', text: '#1E293B' },
    spacing: { afterName: 16, afterSection: 18, betweenJobs: 14 }
  },
  structure: [
    { section: 'header', required: true, order: 1 },
    { section: 'summary', required: true, order: 2 },
    { section: 'core_competencies', required: false, order: 3 },
    { section: 'experience', required: true, order: 4 },
    { section: 'education', required: false, order: 5 },
    { section: 'skills', required: true, order: 6 },
    { section: 'achievements', required: false, order: 7 }
  ]
}

export const PROFESSIONAL_TEMPLATE: ResumeTemplate = {
  id: 'professional', name: 'Professional', description: 'Traditional layout perfect for corporate roles', atsScore: 98, bestFor: ['finance','consulting','law','healthcare'],
  formatting: {
    margins: { top: 1.0, bottom: 1.0, left: 1.0, right: 1.0 },
    fontSize: { name: 24, headings: 12, body: 10.5 },
    lineSpacing: { body: 1.1, sections: 1.3 },
    fontFamily: 'Times New Roman, Georgia, serif',
    colors: { primary: '#1F2937', secondary: '#6B7280', text: '#111827' },
    spacing: { afterName: 12, afterSection: 14, betweenJobs: 10 }
  }
}

export const CREATIVE_TEMPLATE: ResumeTemplate = {
  id: 'creative', name: 'Creative', description: 'Bold design for creative and marketing roles', atsScore: 85, bestFor: ['design','marketing','media','advertising'],
  formatting: {
    margins: { top: 0.8, bottom: 0.8, left: 0.8, right: 0.8 },
    fontSize: { name: 32, headings: 13, body: 11 },
    lineSpacing: { body: 1.2, sections: 1.6 },
    fontFamily: 'Montserrat, Arial, sans-serif',
    colors: { primary: '#7C3AED', secondary: '#F59E0B', text: '#1F2937' },
    spacing: { afterName: 20, afterSection: 20, betweenJobs: 16 }
  }
}

export const TECH_TEMPLATE: ResumeTemplate = {
  id: 'tech', name: 'Tech-Focused', description: 'Optimized for technology and engineering roles', atsScore: 96, bestFor: ['software','engineering','IT','data'],
  formatting: {
    margins: { top: 0.7, bottom: 0.7, left: 0.7, right: 0.7 },
    fontSize: { name: 26, headings: 13, body: 10.5 },
    lineSpacing: { body: 1.1, sections: 1.4 },
    fontFamily: "Consolas, 'Courier New', monospace",
    colors: { primary: '#059669', secondary: '#6B7280', text: '#111827' },
    spacing: { afterName: 14, afterSection: 16, betweenJobs: 12 }
  }
}

export function getTemplateById(id: string): ResumeTemplate {
  switch (id) {
    case 'professional': return PROFESSIONAL_TEMPLATE
    case 'creative': return CREATIVE_TEMPLATE
    case 'tech': return TECH_TEMPLATE
    case 'modern':
    default: return MODERN_TEMPLATE
  }
}

export function getTemplateCss(template: ResumeTemplate): string {
  const base = `
  .resume-container{max-width:8.5in;min-height:11in;margin:0 auto;background:#fff;color:${template.formatting.colors.text};padding:${template.formatting.margins.top}in ${template.formatting.margins.right}in ${template.formatting.margins.bottom}in ${template.formatting.margins.left}in;box-shadow:0 0 20px rgba(0,0,0,0.06);font-family:${template.formatting.fontFamily};font-size:${template.formatting.fontSize.body}pt;line-height:${template.formatting.lineSpacing.body};}
  .resume-name{font-size:${template.formatting.fontSize.name}pt;font-weight:700;color:${template.formatting.colors.primary};margin-bottom:${template.formatting.spacing.afterName}pt;letter-spacing:-0.5pt}
  .resume-contact{display:flex;justify-content:space-between;align-items:center;margin-bottom:${template.formatting.spacing.afterSection}pt;padding-bottom:12pt;border-bottom:2pt solid ${template.formatting.colors.primary}}
  .section-header{font-size:${template.formatting.fontSize.headings}pt;font-weight:600;color:${template.formatting.colors.primary};text-transform:uppercase;letter-spacing:1pt;margin:${template.formatting.spacing.afterSection}pt 0 12pt 0;padding-bottom:6pt;border-bottom:1pt solid #E2E8F0}
  .job-entry{margin-bottom:${template.formatting.spacing.betweenJobs}pt;page-break-inside:avoid}
  .job-title{font-size:12pt;font-weight:600;margin-bottom:4pt}
  .company-info{font-size:11pt;color:#64748B;margin-bottom:8pt}
  .job-description{margin:0;padding:0}
  .job-description li{margin-bottom:6pt;line-height:1.2;list-style:none;position:relative;padding-left:16pt}
  .job-description li:before{content:'•';color:${template.formatting.colors.primary};font-size:14pt;position:absolute;left:0;top:-1pt}
  `
  return base
}

export class ResumeFormatter {
  static formatResume(content: ResumeContent, template: ResumeTemplate): string {
    const css = getTemplateCss(template)
    const header = this.formatHeader(content.personalInfo, template)
    const parts: string[] = [header]
    if (content.summary) parts.push(this.wrapSection('Summary', `<div>${this.escape(content.summary)}</div>`))
    if (content.coreCompetencies && content.coreCompetencies.length) {
      parts.push(this.wrapSection('Core Competencies', `<div>${content.coreCompetencies.map(this.escape).join(' • ')}</div>`))
    }
    if (content.experience && content.experience.length) parts.push(this.wrapSection('Experience', this.formatExperience(content.experience, template)))
    if (content.skills && content.skills.length) parts.push(this.wrapSection('Skills', `<div>${content.skills.map(this.escape).join(' • ')}</div>`))
    if (content.education && content.education.length) parts.push(this.wrapSection('Education', `<ul>${content.education.map(e=>`<li>${this.escape(e)}</li>`).join('')}</ul>`))
    if (content.achievements && content.achievements.length) parts.push(this.wrapSection('Achievements', `<ul>${content.achievements.map(a=>`<li>${this.escape(a)}</li>`).join('')}</ul>`))
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="resume-container">${parts.join('')}</div></body></html>`
    return html
  }

  private static wrapSection(title: string, bodyHtml: string): string {
    return `<div class="section"><div class="section-header">${this.escape(title)}</div>${bodyHtml}</div>`
  }

  private static formatHeader(info: PersonalInfo, template: ResumeTemplate): string {
    const pieces = [info.location || '', info.email || '', info.phone || '', info.linkedin || ''].filter(Boolean).map(this.escape)
    return `<div class="resume-name">${this.escape(info.fullName || '')}</div><div class="resume-contact"><span>${pieces.join(' • ')}</span></div>`
  }

  private static formatExperience(experience: Experience[], template: ResumeTemplate): string {
    return experience.map((job, i) => {
      const mb = i < experience.length - 1 ? template.formatting.spacing.betweenJobs : 0
      const header = `<div class="job-title">${this.escape(job.title)}</div><div class="company-info">${this.escape(job.company)}${job.location ? ' | ' + this.escape(job.location) : ''}${job.startDate ? ' | ' + this.escape(job.startDate) : ''}${job.endDate ? ' - ' + this.escape(job.endDate) : ''}</div>`
      const bullets = Array.isArray(job.responsibilities) && job.responsibilities.length ? `<ul class="job-description">${job.responsibilities.map(r=>`<li>${this.escape(r)}</li>`).join('')}</ul>` : ''
      return `<div class="job-entry" style="margin-bottom:${mb}pt">${header}${bullets}</div>`
    }).join('')
  }

  private static escape(s: string): string { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

  static validateATSCompliance(resumeHtml: string): { total: number; issues: string[]; keywords: number; formatting: number } {
    const score = { total: 0, issues: [] as string[], keywords: 0, formatting: 0 }
    const headings = resumeHtml.match(/section-header/g)
    if (headings && headings.length >= 3) score.formatting += 20; else score.issues.push('Use standard section headers')
    const bullets = resumeHtml.match(/<li>/g)
    if (bullets && bullets.length >= 5) score.formatting += 20; else score.issues.push('Use bullet points for experience')
    const contactInfo = resumeHtml.match(/@|linkedin|\d{3}[)\-\s]?\d{3}[\-\s]?\d{4}/gi)
    if (contactInfo && contactInfo.length >= 2) score.formatting += 20; else score.issues.push('Include complete contact information')
    score.total = score.formatting + score.keywords
    return score
  }
}

export const ATS_RULES = {
  margins: { min: 0.5, max: 1.0, recommended: 0.75 },
  fontSize: { body: { min: 10, max: 12, recommended: 11 }, headings: { min: 12, max: 16, recommended: 14 }, name: { min: 18, max: 32, recommended: 24 } },
  sections: { required: ['contact','summary','experience'], recommended: ['skills','education'], order: ['contact','summary','skills','experience','education','achievements'] },
  keywords: { density: { min: 2, max: 8 }, placement: ['summary','skills','experience'] },
  formatting: { bulletPoints: true, standardHeadings: true, noTables: true, noImages: true, noColumns: true }
}


