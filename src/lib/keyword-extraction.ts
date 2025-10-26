/**
 * Enhanced Keyword Extraction with Multi-Factor Weighting
 * Extracts 50+ keywords and applies recency, tenure, industry, and seniority multipliers
 */

export interface WeightedKeyword {
  keyword: string
  weight: number
  sources: string[] // Which roles it came from
  recency: number // How recent (0.5x - 2x)
  tenure: number // Years in roles using this skill
}

export interface ResumeRole {
  title: string
  company: string
  startDate: Date
  endDate: Date | null
  duration: number // years
  description: string
  industry: string
  isCurrent: boolean
}

export interface KeywordExtractionResult {
  keywords: WeightedKeyword[]
  topKeywords: string[] // Top 18 for search
  allKeywords: string[] // All 50+ for reference
  metadata: {
    totalKeywords: number
    primaryIndustry: string
    experienceYears: number
    dominantSkills: string[]
    rolesAnalyzed: number
  }
}

/**
 * Extract and weight keywords from resume
 */
export async function extractWeightedKeywords(
  resumeText: string
): Promise<KeywordExtractionResult> {
  console.log('[KEYWORD_EXTRACTION] Starting extraction, resume length:', resumeText.length)
  
  // 1. Parse resume structure to identify roles and tenure
  const resumeStructure = parseResumeStructure(resumeText)
  
  console.log('[KEYWORD_EXTRACTION] Resume structure:', {
    roles: resumeStructure.roles.length,
    totalYears: resumeStructure.totalExperienceYears,
    primaryIndustry: resumeStructure.primaryIndustry
  })
  
  // 2. Extract raw keywords (simple frequency-based for now, can enhance with AI later)
  const rawKeywords = extractRawKeywords(resumeText, resumeStructure)
  
  console.log('[KEYWORD_EXTRACTION] Raw keywords extracted:', rawKeywords.length)
  
  // 3. Weight keywords by multiple factors
  const weightedKeywords = rawKeywords.map((keyword) => {
    // Base weight from frequency
    const baseWeight = 1.0
    
    // Recency multiplier (most recent role = 2x, oldest = 0.5x)
    const recencyMultiplier = calculateRecencyMultiplier(keyword, resumeStructure)
    
    // Tenure multiplier (3+ years = 1.5x, < 1 year = 0.8x)
    const tenureMultiplier = calculateTenureMultiplier(keyword, resumeStructure)
    
    // Industry multiplier (primary industry = 1.25x)
    const industryMultiplier = calculateIndustryMultiplier(keyword, resumeStructure)
    
    // Role seniority multiplier (senior/lead roles = 1.2x)
    const seniorityMultiplier = calculateSeniorityMultiplier(keyword, resumeStructure)
    
    // Final weight
    const weight = baseWeight * recencyMultiplier * tenureMultiplier * industryMultiplier * seniorityMultiplier
    
    return {
      keyword,
      weight,
      sources: findKeywordSources(keyword, resumeStructure),
      recency: recencyMultiplier,
      tenure: calculateKeywordTenure(keyword, resumeStructure)
    }
  })
  
  // 4. Sort by weight (descending)
  weightedKeywords.sort((a, b) => b.weight - a.weight)
  
  console.log('[KEYWORD_EXTRACTION] Top 10 weighted keywords:')
  weightedKeywords.slice(0, 10).forEach((kw, i) => {
    console.log(`  ${i + 1}. ${kw.keyword} (weight: ${kw.weight.toFixed(2)}, recency: ${kw.recency.toFixed(2)}x)`)
  })
  
  // 5. Select top 18 for search
  const topKeywords = weightedKeywords.slice(0, 18).map(kw => kw.keyword)
  
  // 6. Prepare metadata
  const metadata = {
    totalKeywords: weightedKeywords.length,
    primaryIndustry: resumeStructure.primaryIndustry,
    experienceYears: resumeStructure.totalExperienceYears,
    dominantSkills: weightedKeywords.slice(0, 5).map(kw => kw.keyword),
    rolesAnalyzed: resumeStructure.roles.length
  }
  
  return {
    keywords: weightedKeywords,
    topKeywords,
    allKeywords: weightedKeywords.map(kw => kw.keyword),
    metadata
  }
}

/**
 * Parse resume to identify roles, tenure, industries
 */
interface ResumeStructure {
  roles: ResumeRole[]
  totalExperienceYears: number
  primaryIndustry: string
}

function parseResumeStructure(resumeText: string): ResumeStructure {
  const roles: ResumeRole[] = []
  
  // Common date patterns
  const datePatterns = [
    /(\w+\s+\d{4})\s*[-–—]\s*(\w+\s+\d{4}|Present|Current)/gi,
    /(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/gi,
    /(\d{1,2}\/\d{4})\s*[-–—]\s*(\d{1,2}\/\d{4}|Present|Current)/gi
  ]
  
  // Split by common section headers
  const sections = resumeText.split(/(?:EXPERIENCE|WORK HISTORY|EMPLOYMENT|PROFESSIONAL EXPERIENCE)/i)
  const experienceSection = sections.length > 1 ? sections[1] : resumeText
  
  // Extract roles (simple heuristic)
  const lines = experienceSection.split('\n')
  let currentRole: Partial<ResumeRole> | null = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Check if this line contains a date range
    let dateMatch: RegExpMatchArray | null = null
    for (const pattern of datePatterns) {
      dateMatch = line.match(pattern)
      if (dateMatch) break
    }
    
    if (dateMatch) {
      // This might be a role header
      const [fullMatch, startStr, endStr] = dateMatch
      const startDate = parseDate(startStr)
      const endDate = endStr.match(/Present|Current/i) ? null : parseDate(endStr)
      const duration = calculateYearsBetween(startDate, endDate || new Date())
      
      // Extract title and company from the line
      const parts = line.replace(fullMatch, '').split(/[|,]/).map(p => p.trim()).filter(Boolean)
      
      if (currentRole && currentRole.title) {
        roles.push(currentRole as ResumeRole)
      }
      
      currentRole = {
        title: parts[0] || line.split(/[|,]/)[0]?.trim() || 'Unknown',
        company: parts[1] || 'Unknown',
        startDate,
        endDate,
        duration,
        description: '',
        industry: 'General',
        isCurrent: !endDate
      }
    } else if (currentRole) {
      // Add to current role description
      currentRole.description = (currentRole.description || '') + ' ' + line
    }
  }
  
  // Add last role
  if (currentRole && currentRole.title) {
    roles.push(currentRole as ResumeRole)
  }
  
  // Infer industries
  roles.forEach(role => {
    role.industry = inferIndustry(role.company, role.description)
  })
  
  // Calculate total experience
  const totalExperienceYears = roles.reduce((sum, role) => sum + role.duration, 0)
  
  // Identify primary industry (most time spent)
  const industryMap = new Map<string, number>()
  roles.forEach(role => {
    const current = industryMap.get(role.industry) || 0
    industryMap.set(role.industry, current + role.duration)
  })
  
  const primaryIndustry = Array.from(industryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([industry]) => industry)[0] || 'General'
  
  return {
    roles,
    totalExperienceYears,
    primaryIndustry
  }
}

/**
 * Extract raw keywords from resume text
 */
function extractRawKeywords(resumeText: string, structure: ResumeStructure): string[] {
  const keywords = new Set<string>()
  
  // Common skill keywords
  const skillPatterns = [
    /\b(Business Development|Sales|Marketing|Finance|Accounting|Engineering|Software|Development|Management|Leadership|Project Management|Operations|Strategy|Analytics|Data|CRM|ERP|SQL|Python|JavaScript|React|Node|AWS|Azure|Cloud|DevOps|Agile|Scrum|Lean|Six Sigma|Quality|Compliance|Risk|Audit|Legal|HR|Recruiting|Training|Customer Service|Support|Technical|Communication|Negotiation|Problem Solving|Team Building|Coaching|Mentoring|Planning|Budgeting|Forecasting|Reporting|Analysis|Research|Design|Architecture|Infrastructure|Security|Testing|QA|Documentation|Presentation|Public Speaking|Writing|Editing|Translation|Multilingual|Bilingual)\b/gi
  ]
  
  skillPatterns.forEach(pattern => {
    const matches = resumeText.matchAll(pattern)
    for (const match of matches) {
      keywords.add(match[1])
    }
  })
  
  // Extract from role titles
  structure.roles.forEach((role: ResumeRole) => {
    const titleWords = role.title.split(/\s+/)
    titleWords.forEach((word: string) => {
      if (word.length > 3 && !/^(the|and|for|with|from)$/i.test(word)) {
        keywords.add(word)
      }
    })
  })
  
  // Industry-specific terms
  if (structure.primaryIndustry.includes('Finance') || structure.primaryIndustry.includes('Lending')) {
    ['Commercial Lending', 'Loan Approval', 'Credit Analysis', 'Financial Analysis', 'Deal Structuring', 'Risk Assessment'].forEach(kw => keywords.add(kw))
  }
  
  if (structure.primaryIndustry.includes('Tech') || structure.primaryIndustry.includes('Software')) {
    ['Software Development', 'API Integration', 'Database Design', 'Cloud Architecture', 'CI/CD', 'Microservices'].forEach(kw => keywords.add(kw))
  }
  
  return Array.from(keywords)
}

/**
 * Calculate recency multiplier
 */
function calculateRecencyMultiplier(keyword: string, structure: ResumeStructure): number {
  const rolesWithKeyword = structure.roles.filter((role: ResumeRole) => 
    role.description.toLowerCase().includes(keyword.toLowerCase()) ||
    role.title.toLowerCase().includes(keyword.toLowerCase())
  )
  
  if (rolesWithKeyword.length === 0) return 1.0
  
  // Get most recent role with this keyword
  const mostRecentRole = rolesWithKeyword[0]
  const yearsSinceRole = calculateYearsBetween(mostRecentRole.startDate, new Date())
  
  // Recency decay
  if (mostRecentRole.isCurrent || yearsSinceRole < 1) return 2.0
  if (yearsSinceRole < 3) return 1.5
  if (yearsSinceRole < 5) return 1.0
  if (yearsSinceRole < 10) return 0.7
  return 0.5
}

/**
 * Calculate tenure multiplier
 */
function calculateTenureMultiplier(keyword: string, structure: ResumeStructure): number {
  const rolesWithKeyword = structure.roles.filter((role: ResumeRole) => 
    role.description.toLowerCase().includes(keyword.toLowerCase()) ||
    role.title.toLowerCase().includes(keyword.toLowerCase())
  )
  
  const totalTenure = rolesWithKeyword.reduce((sum: number, role: ResumeRole) => sum + role.duration, 0)
  
  if (totalTenure >= 5) return 1.5
  if (totalTenure >= 3) return 1.3
  if (totalTenure >= 1) return 1.0
  return 0.8
}

/**
 * Calculate industry multiplier
 */
function calculateIndustryMultiplier(keyword: string, structure: ResumeStructure): number {
  const primaryIndustry = structure.primaryIndustry
  
  const primaryRoles = structure.roles.filter((role: ResumeRole) => role.industry === primaryIndustry)
  const keywordInPrimary = primaryRoles.some((role: ResumeRole) => 
    role.description.toLowerCase().includes(keyword.toLowerCase()) ||
    role.title.toLowerCase().includes(keyword.toLowerCase())
  )
  
  return keywordInPrimary ? 1.25 : 1.0
}

/**
 * Calculate seniority multiplier
 */
function calculateSeniorityMultiplier(keyword: string, structure: ResumeStructure): number {
  const rolesWithKeyword = structure.roles.filter((role: ResumeRole) => 
    role.description.toLowerCase().includes(keyword.toLowerCase()) ||
    role.title.toLowerCase().includes(keyword.toLowerCase())
  )
  
  const hasSeniorRole = rolesWithKeyword.some((role: ResumeRole) => 
    /senior|lead|manager|director|vp|ceo|cto|head|principal|chief/i.test(role.title)
  )
  
  const hasJuniorRole = rolesWithKeyword.some((role: ResumeRole) => 
    /junior|entry|associate|intern|assistant/i.test(role.title)
  )
  
  if (hasSeniorRole) return 1.2
  if (hasJuniorRole) return 0.9
  return 1.0
}

// Helper functions
function parseDate(dateStr: string): Date {
  const monthMap: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
    nov: 10, november: 10, dec: 11, december: 11
  }
  
  // Try "Jan 2020" format
  const monthYearMatch = dateStr.match(/(\w+)\s+(\d{4})/i)
  if (monthYearMatch) {
    const month = monthMap[monthYearMatch[1].toLowerCase()] ?? 0
    const year = parseInt(monthYearMatch[2])
    return new Date(year, month, 1)
  }
  
  // Try "2020" format
  const yearMatch = dateStr.match(/(\d{4})/)
  if (yearMatch) {
    return new Date(parseInt(yearMatch[1]), 0, 1)
  }
  
  return new Date()
}

function calculateYearsBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime()
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25)
  return Math.max(0, Math.round(diffYears * 10) / 10)
}

function inferIndustry(company: string, description: string): string {
  const text = (company + ' ' + description).toLowerCase()
  
  const industryKeywords: Record<string, string[]> = {
    'Finance/Commercial Lending': ['loan', 'lending', 'credit', 'finance', 'bank', 'mortgage', 'commercial lending'],
    'Technology/Software': ['software', 'code', 'developer', 'engineering', 'tech', 'api', 'cloud', 'saas'],
    'Sales/Business Development': ['sales', 'business development', 'account', 'client', 'revenue', 'bd'],
    'Automotive': ['car', 'vehicle', 'auto', 'dealership', 'automotive'],
    'Construction': ['construction', 'contractor', 'building', 'renovation', 'electrical'],
    'Nonprofit': ['nonprofit', 'charity', 'foundation', 'fundraising', 'volunteer']
  }
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      return industry
    }
  }
  
  return 'General'
}

function findKeywordSources(keyword: string, structure: ResumeStructure): string[] {
  return structure.roles
    .filter((role: ResumeRole) => 
      role.description.toLowerCase().includes(keyword.toLowerCase()) ||
      role.title.toLowerCase().includes(keyword.toLowerCase())
    )
    .map((role: ResumeRole) => role.company)
}

function calculateKeywordTenure(keyword: string, structure: ResumeStructure): number {
  const rolesWithKeyword = structure.roles.filter((role: ResumeRole) => 
    role.description.toLowerCase().includes(keyword.toLowerCase()) ||
    role.title.toLowerCase().includes(keyword.toLowerCase())
  )
  
  return rolesWithKeyword.reduce((sum: number, role: ResumeRole) => sum + role.duration, 0)
}
