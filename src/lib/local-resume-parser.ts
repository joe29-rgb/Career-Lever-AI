/**
 * LOCAL RESUME PARSER - NO API CALLS NEEDED
 * 
 * Extracts keywords, location, skills, and experience from resume text
 * with industry and education weighting based on work history duration.
 * 
 * This is a FALLBACK when Perplexity API is unavailable or out of credits.
 */

interface ParsedResume {
  keywords: string[]
  location: string | null
  locations: string[]
  skills: string[]
  industries: string[]
  experienceYears: number
  educationSkills: string[]
  workHistorySkills: Map<string, number> // skill -> years used
}

interface WorkExperience {
  title: string
  company: string
  duration: number // in years
  skills: string[]
}

export class LocalResumeParser {
  // Common job titles and roles
  private static readonly JOB_TITLES = [
    'manager', 'director', 'executive', 'specialist', 'coordinator', 'analyst',
    'developer', 'engineer', 'designer', 'architect', 'consultant', 'advisor',
    'representative', 'associate', 'assistant', 'administrator', 'officer',
    'lead', 'senior', 'junior', 'principal', 'chief', 'head', 'supervisor',
    'sales', 'marketing', 'finance', 'operations', 'business development',
    'account manager', 'project manager', 'product manager', 'team lead'
  ]

  // Common technical and business skills
  private static readonly SKILLS_DATABASE = [
    // Sales & Business
    'sales', 'business development', 'account management', 'crm', 'salesforce',
    'b2b', 'b2c', 'cold calling', 'lead generation', 'negotiation', 'closing',
    'pipeline management', 'territory management', 'client relations',
    'customer success', 'relationship building', 'prospecting', 'forecasting',
    
    // Technical
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go',
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
    'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
    'git', 'ci/cd', 'agile', 'scrum', 'devops', 'api', 'rest', 'graphql',
    
    // Finance
    'financial analysis', 'accounting', 'budgeting', 'forecasting', 'modeling',
    'quickbooks', 'excel', 'financial reporting', 'audit', 'tax', 'compliance',
    'investment', 'portfolio management', 'risk management',
    
    // Marketing
    'digital marketing', 'seo', 'sem', 'social media', 'content marketing',
    'email marketing', 'ppc', 'google analytics', 'facebook ads', 'linkedin ads',
    'marketing automation', 'hubspot', 'marketo', 'brand management',
    
    // Management & Leadership
    'leadership', 'team management', 'strategic planning', 'process improvement',
    'change management', 'project management', 'pmp', 'agile', 'lean', 'six sigma',
    'coaching', 'mentoring', 'performance management', 'hiring', 'training',
    
    // AI & Data
    'machine learning', 'ai', 'artificial intelligence', 'data science',
    'data analysis', 'big data', 'nlp', 'computer vision', 'deep learning',
    'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy'
  ]

  // Canadian provinces and major cities
  private static readonly LOCATION_PATTERNS = [
    // Provinces/States
    'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland',
    'Nova Scotia', 'Northwest Territories', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon',
    // US States (common)
    'CA', 'NY', 'TX', 'FL', 'IL', 'WA', 'MA', 'CO',
    'California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington',
    // Major Canadian cities
    'Edmonton', 'Calgary', 'Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Winnipeg',
    'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax',
    'Oshawa', 'Windsor', 'Saskatoon', 'Regina', 'Sherbrooke', 'St. John\'s'
  ]

  /**
   * Main parsing method - extracts all resume data
   */
  static parse(resumeText: string, maxKeywords: number = 50): ParsedResume {
    const lines = resumeText.split(/\r?\n/)
    
    // Extract location (usually in header)
    const location = this.extractLocation(lines)
    
    // Extract work experiences
    const workExperiences = this.extractWorkExperiences(resumeText)
    
    // Extract skills from entire resume
    const allSkills = this.extractSkills(resumeText)
    
    // Calculate total experience years
    const experienceYears = workExperiences.reduce((sum, exp) => sum + exp.duration, 0)
    
    // Build skill -> years mapping from work history
    const workHistorySkills = this.buildSkillYearsMap(workExperiences)
    
    // Extract education skills (usually lower weight)
    const educationSkills = this.extractEducationSkills(resumeText)
    
    // Extract industries from work experience
    const industries = this.extractIndustries(workExperiences)
    
    // Weight and rank keywords
    const keywords = this.weightAndRankKeywords(
      allSkills,
      workHistorySkills,
      educationSkills,
      experienceYears,
      maxKeywords
    )
    
    return {
      keywords,
      location,
      locations: location ? [location] : [],
      skills: allSkills,
      industries,
      experienceYears,
      educationSkills,
      workHistorySkills
    }
  }

  /**
   * Extract location from resume header
   */
  private static extractLocation(lines: string[]): string | null {
    // Check first 10 lines for location (usually in header)
    const headerLines = lines.slice(0, 10).join(' ')
    
    // Pattern: "City, PROVINCE" or "City, STATE"
    const locationRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/g
    const matches = Array.from(headerLines.matchAll(locationRegex))
    
    if (matches.length > 0) {
      return matches[0][0] // Return first match (e.g., "Edmonton, AB")
    }
    
    // Try to find province/state alone
    for (const province of this.LOCATION_PATTERNS) {
      const regex = new RegExp(`\\b${province}\\b`, 'i')
      if (regex.test(headerLines)) {
        return province
      }
    }
    
    return null
  }

  /**
   * Extract work experiences with duration
   */
  private static extractWorkExperiences(resumeText: string): WorkExperience[] {
    const experiences: WorkExperience[] = []
    const lines = resumeText.split(/\r?\n/)
    
    // Find work experience section
    const experienceSection = this.extractSection(resumeText, [
      'work experience', 'professional experience', 'employment history',
      'career history', 'experience'
    ])
    
    if (!experienceSection) return experiences
    
    // Parse each job entry
    const jobBlocks = experienceSection.split(/\n\n+/)
    
    for (const block of jobBlocks) {
      const titleMatch = block.match(new RegExp(this.JOB_TITLES.join('|'), 'i'))
      if (!titleMatch) continue
      
      const title = titleMatch[0]
      
      // Extract company name (usually after title, before dates)
      const companyMatch = block.match(/(?:at|@)\s+([A-Z][A-Za-z\s&,.]+?)(?:\s+\||\s+\d{4}|\n)/i)
      const company = companyMatch ? companyMatch[1].trim() : 'Unknown'
      
      // Extract duration (look for year ranges like "2020-2023" or "2020-Present")
      const duration = this.extractDuration(block)
      
      // Extract skills mentioned in this job
      const skills = this.extractSkills(block)
      
      experiences.push({ title, company, duration, skills })
    }
    
    return experiences
  }

  /**
   * Extract duration in years from text like "2020-2023" or "Jan 2020 - Present"
   */
  private static extractDuration(text: string): number {
    // Pattern: YYYY-YYYY or YYYY-Present
    const yearRangeMatch = text.match(/(\d{4})\s*[-–]\s*(\d{4}|Present|Current)/i)
    
    if (yearRangeMatch) {
      const startYear = parseInt(yearRangeMatch[1])
      const endYear = yearRangeMatch[2].match(/\d{4}/) 
        ? parseInt(yearRangeMatch[2]) 
        : new Date().getFullYear()
      
      return Math.max(0, endYear - startYear)
    }
    
    // Pattern: "X years"
    const yearsMatch = text.match(/(\d+)\s*(?:\+)?\s*years?/i)
    if (yearsMatch) {
      return parseInt(yearsMatch[1])
    }
    
    return 1 // Default to 1 year if can't determine
  }

  /**
   * Extract section by header keywords
   */
  private static extractSection(text: string, headers: string[]): string | null {
    for (const header of headers) {
      const regex = new RegExp(`^\\s*${header}\\s*$`, 'im')
      const match = text.match(regex)
      
      if (match && match.index !== undefined) {
        const start = match.index + match[0].length
        
        // Find next section header or end of text
        const nextSectionMatch = text.slice(start).match(/\n\s*[A-Z][A-Za-z\s]{3,30}\s*\n/)
        const end = nextSectionMatch && nextSectionMatch.index !== undefined
          ? start + nextSectionMatch.index
          : text.length
        
        return text.slice(start, end)
      }
    }
    
    return null
  }

  /**
   * Extract skills from text using skills database
   */
  private static extractSkills(text: string): string[] {
    const foundSkills = new Set<string>()
    const lowerText = text.toLowerCase()
    
    for (const skill of this.SKILLS_DATABASE) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (regex.test(lowerText)) {
        foundSkills.add(skill)
      }
    }
    
    // Also extract job titles as skills
    for (const title of this.JOB_TITLES) {
      const regex = new RegExp(`\\b${title}\\b`, 'i')
      if (regex.test(lowerText)) {
        foundSkills.add(title)
      }
    }
    
    return Array.from(foundSkills)
  }

  /**
   * Extract education-specific skills
   */
  private static extractEducationSkills(resumeText: string): string[] {
    const educationSection = this.extractSection(resumeText, [
      'education', 'academic background', 'qualifications', 'certifications'
    ])
    
    if (!educationSection) return []
    
    return this.extractSkills(educationSection)
  }

  /**
   * Build map of skill -> years used based on work history
   */
  private static buildSkillYearsMap(
    workExperiences: WorkExperience[]
  ): Map<string, number> {
    const skillYears = new Map<string, number>()
    
    for (const exp of workExperiences) {
      for (const skill of exp.skills) {
        const currentYears = skillYears.get(skill) || 0
        skillYears.set(skill, currentYears + exp.duration)
      }
    }
    
    return skillYears
  }

  /**
   * Extract industries from work experience companies
   */
  private static extractIndustries(workExperiences: WorkExperience[]): string[] {
    const industries = new Set<string>()
    
    for (const exp of workExperiences) {
      // Simple industry extraction based on job title keywords
      const titleLower = exp.title.toLowerCase()
      
      if (titleLower.includes('sales') || titleLower.includes('business development')) {
        industries.add('Sales')
      }
      if (titleLower.includes('tech') || titleLower.includes('software') || titleLower.includes('developer')) {
        industries.add('Technology')
      }
      if (titleLower.includes('finance') || titleLower.includes('accounting')) {
        industries.add('Finance')
      }
      if (titleLower.includes('marketing')) {
        industries.add('Marketing')
      }
      if (titleLower.includes('manager') || titleLower.includes('director')) {
        industries.add('Management')
      }
    }
    
    return Array.from(industries)
  }

  /**
   * Weight and rank keywords by:
   * 1. Years of experience using the skill
   * 2. Recency (work experience > education)
   * 3. Frequency across roles
   */
  private static weightAndRankKeywords(
    allSkills: string[],
    workHistorySkills: Map<string, number>,
    educationSkills: string[],
    totalExperienceYears: number,
    maxKeywords: number
  ): string[] {
    const weightedSkills: Array<{ skill: string; weight: number }> = []
    
    for (const skill of allSkills) {
      let weight = 0
      
      // Weight from work history (years using skill / total career years)
      const yearsUsed = workHistorySkills.get(skill) || 0
      if (yearsUsed > 0 && totalExperienceYears > 0) {
        weight += (yearsUsed / totalExperienceYears) * 10 // Scale to 0-10
      }
      
      // Boost for work experience vs education only
      if (workHistorySkills.has(skill)) {
        weight += 5 // Work experience skills get +5 boost
      } else if (educationSkills.includes(skill)) {
        weight += 1 // Education-only skills get +1
      }
      
      // Boost for high-value skills
      if (this.isHighValueSkill(skill)) {
        weight += 2
      }
      
      weightedSkills.push({ skill, weight })
    }
    
    // Sort by weight (descending) and return top N
    return weightedSkills
      .sort((a, b) => b.weight - a.weight)
      .slice(0, maxKeywords)
      .map(item => item.skill)
  }

  /**
   * Check if skill is high-value (management, leadership, technical lead)
   */
  private static isHighValueSkill(skill: string): boolean {
    const highValueKeywords = [
      'leadership', 'management', 'director', 'executive', 'strategic',
      'ai', 'machine learning', 'cloud', 'aws', 'architecture'
    ]
    
    const skillLower = skill.toLowerCase()
    return highValueKeywords.some(keyword => skillLower.includes(keyword))
  }
}

