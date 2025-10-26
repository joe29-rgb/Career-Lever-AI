import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { extractTextFromPDF } from '@/lib/pdf-utils'

/**
 * Parse LinkedIn profile data (PDF or text)
 * Extracts structured resume data from LinkedIn exports
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''

    let linkedInText = ''
    let source = 'linkedin'

    // Handle PDF upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      source = (formData.get('source') as string) || 'linkedin'

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      // Extract text from PDF
      linkedInText = await extractTextFromPDF(file)
    } 
    // Handle text paste
    else {
      const body = await request.json()
      linkedInText = body.text
      source = body.source || 'linkedin'
    }

    if (!linkedInText || linkedInText.trim().length < 50) {
      return NextResponse.json(
        { error: 'LinkedIn data is too short or empty' },
        { status: 400 }
      )
    }

    console.log('[LINKEDIN_PARSE] Processing LinkedIn data, length:', linkedInText.length)

    // Parse LinkedIn data into structured format
    const resumeData = parseLinkedInData(linkedInText)

    console.log('[LINKEDIN_PARSE] Successfully parsed:', {
      name: resumeData.personalInfo.fullName,
      experienceCount: resumeData.experience.length,
      educationCount: resumeData.education.length,
      skillsCount: resumeData.skills.length
    })

    return NextResponse.json({
      success: true,
      resumeData,
      source,
      metadata: {
        parsedAt: new Date().toISOString(),
        textLength: linkedInText.length,
        sections: {
          experience: resumeData.experience.length,
          education: resumeData.education.length,
          skills: resumeData.skills.length
        }
      }
    })

  } catch (error) {
    console.error('[LINKEDIN_PARSE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to parse LinkedIn data', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Parse LinkedIn profile text into structured resume data
 */
function parseLinkedInData(text: string): any {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  
  // Extract name (usually first line or after "Profile")
  let fullName = 'LinkedIn User'
  const nameMatch = text.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/m)
  if (nameMatch) {
    fullName = nameMatch[1]
  }

  // Extract email
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i)
  const email = emailMatch ? emailMatch[1] : ''

  // Extract phone
  const phoneMatch = text.match(/(\+?1?\s*\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4})/i)
  const phone = phoneMatch ? phoneMatch[1] : ''

  // Extract location
  const locationMatch = text.match(/([A-Z][a-z]+,\s*[A-Z]{2}(?:,\s*[A-Z][a-z]+)?)/i)
  const location = locationMatch ? locationMatch[1] : ''

  // Extract LinkedIn URL
  const linkedInMatch = text.match(/(linkedin\.com\/in\/[a-zA-Z0-9-]+)/i)
  const linkedIn = linkedInMatch ? `https://www.${linkedInMatch[1]}` : ''

  // Extract headline/title
  let headline = ''
  const headlineMatch = text.match(/(?:Headline|Title|Position):\s*(.+)/i)
  if (headlineMatch) {
    headline = headlineMatch[1]
  } else {
    // Try to find a professional title
    const titleMatch = text.match(/(?:^|\n)([A-Z][a-z]+\s+(?:Engineer|Developer|Manager|Director|Analyst|Consultant|Designer|Specialist))/m)
    if (titleMatch) {
      headline = titleMatch[1]
    }
  }

  // Extract experience
  const experience = parseLinkedInExperience(text)

  // Extract education
  const education = parseLinkedInEducation(text)

  // Extract skills
  const skills = parseLinkedInSkills(text)

  // Extract summary
  const summaryMatch = text.match(/(?:Summary|About):\s*(.+?)(?:\n\n|Experience:|Education:|$)/is)
  const summary = summaryMatch ? summaryMatch[1].trim() : ''

  return {
    personalInfo: {
      fullName,
      email,
      phone,
      location,
      linkedIn,
      website: '',
      github: ''
    },
    summary: summary || `${headline} with expertise in ${skills.slice(0, 5).join(', ')}`,
    experience,
    education,
    skills,
    certifications: [],
    projects: [],
    metadata: {
      source: 'linkedin',
      importedAt: new Date().toISOString()
    }
  }
}

/**
 * Parse experience section from LinkedIn text
 */
function parseLinkedInExperience(text: string): any[] {
  const experience: any[] = []
  
  // Look for experience section
  const expMatch = text.match(/Experience:?\s*(.+?)(?:Education:|Skills:|Certifications:|$)/is)
  if (!expMatch) return experience

  const expText = expMatch[1]
  
  // Split by job entries (look for company names or dates)
  const jobPattern = /([A-Z][^\n]+)\n([A-Z][^\n]+)\n((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^\n]+)/g
  let match

  while ((match = jobPattern.exec(expText)) !== null) {
    const [, title, company, dates] = match
    
    // Parse dates
    const dateMatch = dates.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s*[-–]\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})|Present)/i)
    
    let startDate = ''
    let endDate = ''
    let current = false

    if (dateMatch) {
      startDate = `${dateMatch[1]} ${dateMatch[2]}`
      if (dateMatch[3] && dateMatch[4]) {
        endDate = `${dateMatch[3]} ${dateMatch[4]}`
      } else {
        endDate = 'Present'
        current = true
      }
    }

    experience.push({
      title: title.trim(),
      company: company.trim(),
      location: '',
      startDate,
      endDate,
      current,
      description: '',
      achievements: []
    })
  }

  return experience
}

/**
 * Parse education section from LinkedIn text
 */
function parseLinkedInEducation(text: string): any[] {
  const education: any[] = []
  
  const eduMatch = text.match(/Education:?\s*(.+?)(?:Skills:|Certifications:|Licenses:|$)/is)
  if (!eduMatch) return education

  const eduText = eduMatch[1]
  
  // Look for school names and degrees
  const schoolPattern = /([A-Z][^\n]+(?:University|College|Institute|School))\n([^\n]+)\n(\d{4}\s*[-–]\s*\d{4}|\d{4})/gi
  let match

  while ((match = schoolPattern.exec(eduText)) !== null) {
    const [, school, degree, years] = match
    
    education.push({
      school: school.trim(),
      degree: degree.trim(),
      field: '',
      graduationYear: years.match(/\d{4}$/)?.[0] || '',
      gpa: '',
      achievements: []
    })
  }

  return education
}

/**
 * Parse skills from LinkedIn text
 */
function parseLinkedInSkills(text: string): string[] {
  const skills: string[] = []
  
  // Look for skills section
  const skillsMatch = text.match(/Skills:?\s*(.+?)(?:Certifications:|Licenses:|Languages:|$)/is)
  if (!skillsMatch) {
    // Fallback: extract common technical terms
    const techTerms = text.match(/\b(JavaScript|TypeScript|Python|Java|React|Node\.js|AWS|Docker|Kubernetes|SQL|MongoDB|Git|Agile|Scrum|Leadership|Management|Sales|Marketing|Design|Analytics)\b/gi)
    if (techTerms) {
      return [...new Set(techTerms.map(t => t.trim()))]
    }
    return skills
  }

  const skillsText = skillsMatch[1]
  
  // Split by common delimiters
  const skillsList = skillsText.split(/[•·,\n]/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 50)
  
  return [...new Set(skillsList)]
}
