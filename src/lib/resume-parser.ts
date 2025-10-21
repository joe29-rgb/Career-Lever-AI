/**
 * Parse plain text resume into structured data for resume-templates-v2
 */

import type { ResumeData } from './resume-templates-v2'

export function parseResumeText(text: string, personalInfo?: {
  name?: string
  email?: string
  phone?: string
  location?: string
}): ResumeData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  
  // Extract personal info from text if not provided
  const extractedInfo = personalInfo || extractPersonalInfoFromText(text)
  
  // Parse experience section
  const experience = parseExperienceSection(lines)
  
  // Parse education section
  const education = parseEducationSection(lines)
  
  // Parse skills section
  const skills = parseSkillsSection(lines)
  
  // Extract summary (usually first paragraph after contact info)
  const summary = extractSummary(lines)
  
  return {
    personalInfo: {
      fullName: extractedInfo.name || 'Professional',
      email: extractedInfo.email || '',
      phone: extractedInfo.phone || '',
      location: extractedInfo.location || '',
      summary: summary
    },
    experience,
    education,
    skills
  }
}

function extractPersonalInfoFromText(text: string): {
  name?: string
  email?: string
  phone?: string
  location?: string
} {
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  const phoneMatch = text.match(/(\+?1?\s*\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4})/i)
  
  // Name is usually first line or before email
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let name = lines[0] || ''
  
  // Clean up name (remove if it contains email or phone)
  if (name.includes('@') || name.match(/\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/)) {
    name = ''
  }
  
  // Location patterns
  const locationMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}(?:\s+[A-Z0-9]{5})?)/i) ||
                       text.match(/([A-Z][a-z]+,\s*[A-Z]{2,})/i)
  
  return {
    name: name.replace(/[^\w\s.-]/g, '').trim(),
    email: emailMatch ? emailMatch[1] : undefined,
    phone: phoneMatch ? phoneMatch[1] : undefined,
    location: locationMatch ? locationMatch[1] : undefined
  }
}

function extractSummary(lines: string[]): string {
  // Look for summary section
  const summaryIndex = lines.findIndex(l => 
    /^(professional\s+)?summary|^objective|^profile/i.test(l)
  )
  
  if (summaryIndex !== -1 && summaryIndex < lines.length - 1) {
    // Get next few lines after summary header
    const summaryLines: string[] = []
    for (let i = summaryIndex + 1; i < lines.length && i < summaryIndex + 5; i++) {
      const line = lines[i]
      // Stop if we hit another section header
      if (/^[A-Z\s]{3,}$/.test(line) && line.length < 50) break
      if (line && !line.includes('|') && !line.startsWith('•') && !line.startsWith('-')) {
        summaryLines.push(line)
      }
    }
    if (summaryLines.length > 0) {
      return summaryLines.join(' ').slice(0, 500)
    }
  }
  
  // Fallback: use first paragraph that's not contact info
  for (let i = 1; i < Math.min(10, lines.length); i++) {
    const line = lines[i]
    if (line.length > 50 && !line.includes('@') && !line.match(/\d{3}[\s.-]?\d{3}/)) {
      return line.slice(0, 500)
    }
  }
  
  return 'Experienced professional with a proven track record of success.'
}

type ExperienceItem = {
  id: string
  company: string
  position: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
  achievements: string[]
  technologies?: string[]
}

function parseExperienceSection(lines: string[]): ExperienceItem[] {
  const experience: ExperienceItem[] = []
  
  // Find experience section
  const expIndex = lines.findIndex(l => 
    /^(professional\s+)?experience|^work\s+history|^employment/i.test(l)
  )
  
  if (expIndex === -1) return []
  
  let currentJob: Partial<ExperienceItem> | null = null
  let achievements: string[] = []
  
  for (let i = expIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    
    // Stop at next major section
    if (/^(education|skills|certifications|projects)/i.test(line)) break
    
    // Job title line (usually followed by company/dates)
    if (i < lines.length - 1 && lines[i + 1].includes('|')) {
      // Save previous job
      if (currentJob && currentJob.id) {
        currentJob.achievements = achievements
        experience.push(currentJob as ExperienceItem)
        achievements = []
      }
      
      // Parse new job
      const metaLine = lines[i + 1]
      const parts = metaLine.split('|').map(p => p.trim())
      
      const dateMatch = metaLine.match(/(\d{4}|[A-Z][a-z]{2}\s+\d{4})\s*[-–]\s*(Present|\d{4}|[A-Z][a-z]{2}\s+\d{4})/i)
      
      currentJob = {
        id: `exp-${experience.length}`,
        position: line,
        company: parts[0] || 'Company',
        location: parts[1] || '',
        startDate: dateMatch ? dateMatch[1] : '2020',
        endDate: dateMatch ? dateMatch[2] : 'Present',
        current: dateMatch ? /present/i.test(dateMatch[2]) : false,
        description: '',
        achievements: []
      }
      
      i++ // Skip meta line
    }
    // Bullet points (achievements)
    else if ((line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) && currentJob) {
      achievements.push(line.replace(/^[•\-*]\s*/, ''))
    }
  }
  
  // Save last job
  if (currentJob && currentJob.id) {
    currentJob.achievements = achievements
    experience.push(currentJob as ExperienceItem)
  }
  
  return experience
}

type EducationItem = {
  id: string
  institution: string
  degree: string
  field: string
  location: string
  graduationDate: string
  gpa?: string
  honors?: string[]
}

function parseEducationSection(lines: string[]): EducationItem[] {
  const education: EducationItem[] = []
  
  const eduIndex = lines.findIndex(l => /^education/i.test(l))
  if (eduIndex === -1) return []
  
  for (let i = eduIndex + 1; i < lines.length && i < eduIndex + 10; i++) {
    const line = lines[i]
    
    // Stop at next section
    if (/^(skills|certifications|experience)/i.test(line)) break
    
    // Degree line
    if (line.match(/bachelor|master|phd|associate|diploma|certificate/i)) {
      const degreeMatch = line.match(/(bachelor|master|phd|associate|diploma|certificate)(?:'?s)?(?:\s+of)?(?:\s+(?:science|arts|engineering|business))?(?:\s+in\s+(.+?))?$/i)
      const nextLine = lines[i + 1] || ''
      const dateMatch = nextLine.match(/\d{4}/)
      
      education.push({
        id: `edu-${education.length}`,
        degree: degreeMatch ? degreeMatch[0] : line,
        field: degreeMatch && degreeMatch[2] ? degreeMatch[2] : 'General Studies',
        institution: nextLine.split('|')[0]?.trim() || 'University',
        location: nextLine.split('|')[1]?.trim() || '',
        graduationDate: dateMatch ? dateMatch[0] : '2020'
      })
    }
  }
  
  return education
}

function parseSkillsSection(lines: string[]): {
  technical: string[]
  soft: string[]
  languages?: Array<{ language: string; proficiency: string }>
  certifications?: Array<{ name: string; issuer: string; date: string }>
} {
  const technical: string[] = []
  const soft: string[] = []
  
  const skillsIndex = lines.findIndex(l => /^skills|^technical\s+skills|^core\s+competencies/i.test(l))
  
  if (skillsIndex !== -1) {
    for (let i = skillsIndex + 1; i < lines.length && i < skillsIndex + 15; i++) {
      const line = lines[i]
      
      // Stop at next section
      if (/^(education|experience|certifications)/i.test(line)) break
      
      // Parse skills (comma or bullet separated)
      if (line.includes(',') || line.includes('•')) {
        const skills = line.split(/[,•]/).map(s => s.trim()).filter(Boolean)
        technical.push(...skills)
      } else if (line.length > 2 && line.length < 50) {
        technical.push(line)
      }
    }
  }
  
  // Default skills if none found
  if (technical.length === 0) {
    technical.push('Communication', 'Problem Solving', 'Team Collaboration', 'Project Management')
  }
  
  return {
    technical: technical.slice(0, 20),
    soft: soft.slice(0, 10)
  }
}
