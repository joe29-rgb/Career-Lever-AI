import { z } from 'zod'

// Define structured resume schema
export const ResumeSchema = z.object({
  personalInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().url().optional(),
    website: z.string().url().optional(),
    github: z.string().url().optional()
  }),
  summary: z.string().optional(),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    location: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
    description: z.string().optional(),
    achievements: z.array(z.string())
  })),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    location: z.string().optional(),
    graduationDate: z.string(),
    gpa: z.string().optional(),
    honors: z.array(z.string()).optional()
  })),
  skills: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()),
    languages: z.array(z.object({
      name: z.string(),
      proficiency: z.enum(['native', 'fluent', 'professional', 'intermediate', 'basic'])
    })).optional(),
    certifications: z.array(z.object({
      name: z.string(),
      issuer: z.string(),
      date: z.string()
    })).optional()
  }),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    url: z.string().url().optional(),
    achievements: z.array(z.string())
  })).optional(),
  volunteer: z.array(z.object({
    organization: z.string(),
    role: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.string()
  })).optional()
})

export type Resume = z.infer<typeof ResumeSchema>

/**
 * Parse resume text into structured data using AI
 */
export async function parseResumeText(text: string): Promise<Resume> {
  const prompt = `Parse this resume into structured JSON format.

RESUME TEXT:
${text}

Return ONLY valid JSON matching this exact schema:
{
  "personalInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "location": "San Francisco, CA",
    "linkedin": "https://linkedin.com/in/johndoe",
    "website": "https://johndoe.com",
    "github": "https://github.com/johndoe"
  },
  "summary": "Experienced software engineer with 10+ years...",
  "experience": [
    {
      "title": "Senior Software Engineer",
      "company": "Google",
      "location": "Mountain View, CA",
      "startDate": "2020-01",
      "endDate": "2024-10",
      "current": false,
      "description": "Led team of 5 engineers...",
      "achievements": [
        "Reduced latency by 40% through optimization",
        "Architected microservices handling 1M requests/day"
      ]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "Stanford University",
      "location": "Stanford, CA",
      "graduationDate": "2015-06",
      "gpa": "3.8",
      "honors": ["Dean's List", "Cum Laude"]
    }
  ],
  "skills": {
    "technical": ["JavaScript", "React", "Node.js", "Python", "AWS"],
    "soft": ["Leadership", "Communication", "Problem Solving"],
    "languages": [
      { "name": "English", "proficiency": "native" },
      { "name": "Spanish", "proficiency": "professional" }
    ],
    "certifications": [
      {
        "name": "AWS Solutions Architect",
        "issuer": "Amazon Web Services",
        "date": "2023-05"
      }
    ]
  },
  "projects": [
    {
      "name": "Open Source Library",
      "description": "React component library with 10k+ stars",
      "technologies": ["React", "TypeScript", "Storybook"],
      "url": "https://github.com/example/library",
      "achievements": [
        "1,000+ GitHub stars",
        "Used by 50+ companies"
      ]
    }
  ]
}

IMPORTANT:
- Extract ALL information from the resume
- Organize chronologically (most recent first)
- Use QUANTIFIED achievements (numbers, percentages, metrics)
- Keep technical terms exactly as written
- Include ALL skills mentioned
- Parse dates into YYYY-MM format
- If a field is not present, omit it (don't use null/empty strings)

Return ONLY the JSON, no explanations.`

  const response = await fetch('/api/resume/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, text })
  })

  if (!response.ok) {
    throw new Error('Failed to parse resume')
  }

  const { content } = await response.json()
  
  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse resume - no JSON found')
  
  const parsed = JSON.parse(jsonMatch[0])
  
  // Validate with Zod
  return ResumeSchema.parse(parsed)
}

/**
 * Calculate resume statistics
 */
export function calculateResumeStats(resume: Resume) {
  return {
    totalYearsExperience: calculateYearsOfExperience(resume.experience),
    totalAchievements: resume.experience.reduce((sum, exp) => sum + exp.achievements.length, 0),
    totalSkills: resume.skills.technical.length + resume.skills.soft.length,
    educationLevel: getHighestEducationLevel(resume.education),
    certificationCount: resume.skills.certifications?.length || 0,
    hasProjects: (resume.projects?.length || 0) > 0,
    hasVolunteer: (resume.volunteer?.length || 0) > 0
  }
}

function calculateYearsOfExperience(experience: Resume['experience']): number {
  let totalMonths = 0
  
  for (const exp of experience) {
    const start = new Date(exp.startDate)
    const end = exp.current ? new Date() : new Date(exp.endDate!)
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    totalMonths += months
  }
  
  return Math.round(totalMonths / 12 * 10) / 10 // Round to 1 decimal
}

function getHighestEducationLevel(education: Resume['education']): string {
  const levels = ['phd', 'doctorate', 'master', 'bachelor', 'associate']
  
  for (const level of levels) {
    if (education.some(edu => edu.degree.toLowerCase().includes(level))) {
      return level
    }
  }
  
  return 'other'
}

/**
 * Format date for display
 */
export function formatDate(date?: string): string {
  if (!date) return ''
  const [year, month] = date.split('-')
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[parseInt(month) - 1]} ${year}`
}

/**
 * Format date range
 */
export function formatDateRange(exp: { startDate: string; endDate?: string; current?: boolean }): string {
  const start = formatDate(exp.startDate)
  const end = exp.current ? 'Present' : formatDate(exp.endDate)
  return `${start} - ${end}`
}
