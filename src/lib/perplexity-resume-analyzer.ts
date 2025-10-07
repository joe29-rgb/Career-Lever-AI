/**
 * Enhanced Perplexity-Powered Resume Analysis
 * 
 * Intelligently extracts and weights resume data using AI understanding
 * rather than basic PDF text parsing. Provides:
 * - Experience-weighted keyword extraction
 * - Accurate location detection
 * - Salary expectations based on market data
 * - Target job titles
 */

import { PerplexityIntelligenceService } from './perplexity-intelligence'

export interface EnhancedResumeAnalysis {
  keywords: string[]
  location: {
    city: string
    province: string
    full: string
  }
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive'
  targetSalaryRange: {
    min: number
    max: number
    currency: string
  }
  targetJobTitles: string[]
  topSkills: Array<{
    skill: string
    yearsExperience: number
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  }>
  industries: string[]
  certifications: string[]
  careerSummary: string
}

export class PerplexityResumeAnalyzer {
  /**
   * Analyze resume using Perplexity AI for intelligent extraction
   */
  static async analyzeResume(resumeText: string): Promise<EnhancedResumeAnalysis> {
    const SYSTEM_PROMPT = `You are an expert resume analyst with deep understanding of Canadian and US job markets.
Analyze resumes with precision, extracting:
1. Keywords weighted by experience level and recency
2. Exact location (City, Province/State)
3. Experience level based on years and responsibilities
4. Target salary range (CAD for Canadian locations, USD for US)
5. Target job titles based on career trajectory
6. Top skills with proficiency levels
7. Industry focus areas
8. Certifications and credentials

RULES:
- Prioritize skills with the most years of experience
- Consider job progression (junior → senior → lead → executive)
- Use market data for salary ranges
- Extract location from contact info or work history
- Identify certifications by standard names (PMP, CPA, etc.)

OUTPUT ONLY valid JSON, no explanations.`

    const USER_PROMPT = `Analyze this resume and return detailed career profile:

Resume Text:
${resumeText}

Return ONLY this JSON structure:
{
  "keywords": ["array", "of", "top", "15", "keywords", "weighted", "by", "experience"],
  "location": {
    "city": "CityName",
    "province": "ProvinceOrState",
    "full": "City, Province"
  },
  "experienceLevel": "entry|mid|senior|executive",
  "targetSalaryRange": {
    "min": 80000,
    "max": 120000,
    "currency": "CAD"
  },
  "targetJobTitles": ["Primary Job Title", "Alternative Title 1", "Alternative Title 2"],
  "topSkills": [
    {
      "skill": "Skill Name",
      "yearsExperience": 5,
      "proficiency": "expert"
    }
  ],
  "industries": ["Industry 1", "Industry 2"],
  "certifications": ["Cert 1", "Cert 2"],
  "careerSummary": "2-3 sentence professional summary"
}`

    try {
      const response = await PerplexityIntelligenceService.customQuery({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: USER_PROMPT,
        temperature: 0.2,
        maxTokens: 2000
      })

      // Extract JSON from response (in case Perplexity adds explanation)
      let text = response.trim()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        text = jsonMatch[0]
      }

      const analysis = JSON.parse(text) as EnhancedResumeAnalysis

      // Validate and provide defaults
      return {
        keywords: analysis.keywords || [],
        location: analysis.location || { city: 'Toronto', province: 'ON', full: 'Toronto, ON' },
        experienceLevel: analysis.experienceLevel || 'mid',
        targetSalaryRange: analysis.targetSalaryRange || { min: 50000, max: 80000, currency: 'CAD' },
        targetJobTitles: analysis.targetJobTitles || [],
        topSkills: analysis.topSkills || [],
        industries: analysis.industries || [],
        certifications: analysis.certifications || [],
        careerSummary: analysis.careerSummary || 'Experienced professional seeking new opportunities'
      }
    } catch (error) {
      console.error('[PERPLEXITY RESUME ANALYZER] Failed:', error)
      
      // Fallback to basic extraction
      return this.basicFallbackAnalysis(resumeText)
    }
  }

  /**
   * Basic fallback if Perplexity fails
   */
  private static basicFallbackAnalysis(resumeText: string): EnhancedResumeAnalysis {
    // Extract location using regex
    const locationRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/
    const locationMatch = resumeText.match(locationRegex)
    const city = locationMatch?.[1] || 'Toronto'
    const province = locationMatch?.[2] || 'ON'

    // Extract email to guess experience level
    const hasLeadership = /lead|manage|director|senior|principal/i.test(resumeText)
    const hasExecutive = /vp|ceo|cto|cfo|president|executive/i.test(resumeText)
    
    let experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' = 'mid'
    if (hasExecutive) experienceLevel = 'executive'
    else if (hasLeadership) experienceLevel = 'senior'

    // Basic keyword extraction (top 15 words, exclude common words)
    const words = resumeText.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'been', 'were', 'would', 'could', 'should'])
    const wordFreq: Record<string, number> = {}
    
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1
      }
    })

    const keywords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([word]) => word)

    return {
      keywords,
      location: { city, province, full: `${city}, ${province}` },
      experienceLevel,
      targetSalaryRange: {
        min: experienceLevel === 'executive' ? 120000 : experienceLevel === 'senior' ? 90000 : 60000,
        max: experienceLevel === 'executive' ? 200000 : experienceLevel === 'senior' ? 140000 : 90000,
        currency: 'CAD'
      },
      targetJobTitles: [],
      topSkills: [],
      industries: [],
      certifications: [],
      careerSummary: 'Professional seeking new opportunities'
    }
  }

  /**
   * Get recommended job boards based on resume analysis
   */
  static async getRecommendedJobBoards(analysis: EnhancedResumeAnalysis): Promise<string[]> {
    const isCanadian = analysis.location.province.length === 2 && /^[A-Z]{2}$/.test(analysis.location.province)
    
    const boards: string[] = []

    // Always recommend
    boards.push('LinkedIn', 'Indeed')

    // Canadian-specific
    if (isCanadian) {
      boards.push('Job Bank Canada', 'Jobboom', 'Workopolis')
    }

    // Experience level specific
    if (analysis.experienceLevel === 'executive') {
      boards.push('The Ladders', 'ExecuNet')
    } else if (analysis.experienceLevel === 'entry') {
      boards.push('Glassdoor', 'ZipRecruiter')
    }

    // Industry specific
    if (analysis.industries.some(i => /tech|software|developer|engineer/i.test(i))) {
      boards.push('Dice', 'Stack Overflow Jobs', 'AngelList')
    }

    return boards
  }
}

