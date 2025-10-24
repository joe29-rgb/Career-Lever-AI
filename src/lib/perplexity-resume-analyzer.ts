/**
 * Enhanced Perplexity-Powered Resume Analysis
 * 
 * Intelligently extracts and weights resume data using AI understanding
 * rather than basic PDF text parsing. Provides:
 * - Experience-weighted keyword extraction
 * - Accurate location detection with country
 * - Salary expectations based on 2025 market data
 * - Target job titles with career progression
 * - AI/Automation replacement risk analysis
 * - 5-year career outlook
 * - Job search optimization strategies
 * 
 * Version: 2.0.0 - Integrated with centralized prompts and validation
 */

import { PerplexityIntelligenceService } from './perplexity-intelligence'

// FIXED: Universal UUID generation (browser + Node.js)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID()
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// FIXED: Safe imports with fallbacks for missing dependencies
let PERPLEXITY_PROMPTS: any
let parseAIResponse: <T = any>(text: string, options?: any, context?: any) => T
let validateAIResponse: <T = any>(data: T, schema?: string, context?: any) => T

try {
  PERPLEXITY_PROMPTS = require('./prompts/perplexity-prompts').PERPLEXITY_PROMPTS
} catch (e) {
  console.warn('[RESUME_ANALYZER] perplexity-prompts not found, using inline prompts')
  PERPLEXITY_PROMPTS = { RESUME_ANALYSIS: { system: '', userTemplate: () => '' } }
}

try {
  parseAIResponse = require('./utils/ai-response-parser').parseAIResponse
} catch (e) {
  console.warn('[RESUME_ANALYZER] ai-response-parser not found, using JSON.parse')
  parseAIResponse = <T = any>(text: string) => JSON.parse(text) as T
}

try {
  validateAIResponse = require('./validation/schema-validator').validateAIResponse
} catch (e) {
  console.warn('[RESUME_ANALYZER] schema-validator not found, skipping validation')
  validateAIResponse = <T = any>(data: T) => data
}

export interface EnhancedResumeAnalysis {
  keywords: string[]
  location: {
    city: string
    province: string
    full: string
    country: string
  }
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive'
  targetSalaryRange: {
    min: number
    max: number
    currency: string
    marketData: {
      percentile25: number
      percentile50: number
      percentile75: number
      lastUpdated: string
    }
  }
  targetJobTitles: string[]
  topSkills: Array<{
    skill: string
    yearsExperience: number
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    marketDemand: 'low' | 'medium' | 'high'
    growthTrend: 'declining' | 'stable' | 'growing' | 'hot'
  }>
  industries: string[]
  certifications: string[]
  careerSummary: string
  // AI/Automation Analysis
  futureOutlook: {
    aiReplacementRisk: 'low' | 'medium' | 'high'
    automationRisk: 'low' | 'medium' | 'high'
    fiveYearOutlook: 'declining' | 'stable' | 'growing' | 'thriving'
    reasoning: string
    recommendations: string[]
  }
  // Career Path Intelligence
  careerPath: {
    currentLevel: string
    nextPossibleRoles: string[]
    skillGaps: Array<{
      skill: string
      importance: 'nice-to-have' | 'important' | 'critical'
      timeToLearn: string
    }>
    recommendedCertifications: string[]
  }
  // Job Search Intelligence
  searchOptimization: {
    bestJobBoards: string[]
    optimalApplicationTime: string
    competitiveAdvantages: string[]
    marketSaturation: 'low' | 'medium' | 'high'
    applicationStrategy: string
  }
}

export class PerplexityResumeAnalyzer {
  /**
   * Analyze resume using Perplexity AI for intelligent extraction
   */
  static async analyzeResume(resumeText: string): Promise<EnhancedResumeAnalysis> {
    const requestId = generateUUID()
    const timestamp = Date.now()

    try {
      // Use centralized prompts
      const systemPrompt = PERPLEXITY_PROMPTS.RESUME_ANALYSIS.system
      const userPrompt = PERPLEXITY_PROMPTS.RESUME_ANALYSIS.userTemplate(resumeText)

      // Call Perplexity via intelligence service
      const result = await PerplexityIntelligenceService.customQuery({
        systemPrompt,
        userPrompt,
        temperature: 0.2,
        maxTokens: 3000
      })

      // Parse and validate response
      const context = {
        requestId,
        prompts: { system: systemPrompt, user: userPrompt.slice(0, 200) + '...' },
        timestamp
      }

      const parsed = parseAIResponse<EnhancedResumeAnalysis>(result.content, {
        stripMarkdown: true,
        extractFirst: true,
        throwOnError: true
      }, context)

      // Validate against schema
      const validated = validateAIResponse<EnhancedResumeAnalysis>(
        parsed,
        'resume-analysis',
        context
      )

      return validated
    } catch (error: any) {
      console.error('[PerplexityResumeAnalyzer] AI analysis failed:', error.message)

      // Fallback to enhanced regex analysis
      return this.enhancedFallbackAnalysis(resumeText)
    }
  }

  /**
   * LEGACY METHOD - Now uses centralized system
   * @deprecated Use analyzeResume instead
   */
  static async analyzeLegacy(resumeText: string): Promise<EnhancedResumeAnalysis> {
    const SYSTEM_PROMPT = `You are an expert career strategist and resume analyst with deep understanding of Canadian and US job markets, industry trends, AI/automation impact, and career trajectory optimization.

Analyze resumes with precision, extracting:
1. Keywords weighted by experience level, recency, and market demand
2. Exact location with country detection
3. Experience level based on years, responsibilities, and leadership scope
4. Target salary range with current market data (2025 rates)
5. Target job titles based on career trajectory and market opportunities
6. Skills with proficiency levels and market demand assessment
7. Industry focus areas with growth potential
8. Certifications and credentials with market value
9. AI/Automation replacement risk analysis
10. 5-year career outlook and growth potential
11. Career path progression opportunities
12. Job search optimization strategies

CRITICAL ANALYSIS FACTORS:
- AI/Automation Impact: Assess which roles are safe vs at risk
- Market Trends: Consider remote work, AI integration, industry shifts
- Geographic Factors: Canadian vs US market differences
- Skill Evolution: Which skills are becoming obsolete vs emerging
- Career Progression: Natural next steps and skill gaps

SALARY DATA (Use 2025 Current Market Rates):
- Canada: Adjust for province (ON/BC higher, others moderate)
- US: Adjust for state and city (CA/NY/WA higher)
- Consider remote work salary normalization trends
- Factor in industry premiums (tech, finance, healthcare)

AI/AUTOMATION RISK ASSESSMENT:
- Low Risk: Creative, strategic, interpersonal, complex problem-solving roles
- Medium Risk: Roles with some routine tasks but require human judgment
- High Risk: Highly repetitive, rule-based, or easily automated tasks

OUTPUT ONLY valid JSON, no explanations or markdown.`

    const USER_PROMPT = `Analyze this resume comprehensively for 2025 job market:

Resume Text:
${resumeText}

Return ONLY this JSON structure:
{
  "keywords": ["array", "of", "top", "20", "keywords", "weighted", "by", "market", "demand", "and", "experience"],
  "location": {
    "city": "CityName",
    "province": "ProvinceOrState", 
    "full": "City, Province",
    "country": "Canada"
  },
  "experienceLevel": "entry|mid|senior|executive",
  "targetSalaryRange": {
    "min": 85000,
    "max": 125000,
    "currency": "CAD",
    "marketData": {
      "percentile25": 90000,
      "percentile50": 105000,
      "percentile75": 120000,
      "lastUpdated": "2025-10"
    }
  },
  "targetJobTitles": ["Primary Job Title", "Alternative Title 1", "Alternative Title 2", "Stretch Goal Title"],
  "topSkills": [
    {
      "skill": "Skill Name",
      "yearsExperience": 5,
      "proficiency": "expert",
      "marketDemand": "high",
      "growthTrend": "growing"
    }
  ],
  "industries": ["Primary Industry", "Secondary Industry"],
  "certifications": ["Current Cert 1", "Current Cert 2"],
  "careerSummary": "2-3 sentence professional summary highlighting unique value proposition",
  "futureOutlook": {
    "aiReplacementRisk": "low",
    "automationRisk": "low", 
    "fiveYearOutlook": "growing",
    "reasoning": "Detailed explanation of why this career path is safe/risky and growth potential",
    "recommendations": ["Action 1", "Action 2", "Action 3"]
  },
  "careerPath": {
    "currentLevel": "Current Role Level",
    "nextPossibleRoles": ["Next Role 1", "Next Role 2", "Next Role 3"],
    "skillGaps": [
      {
        "skill": "Missing Skill",
        "importance": "critical",
        "timeToLearn": "3-6 months"
      }
    ],
    "recommendedCertifications": ["Cert 1", "Cert 2"]
  },
  "searchOptimization": {
    "bestJobBoards": ["Board 1", "Board 2", "Board 3"],
    "optimalApplicationTime": "Tuesday-Thursday, 9-11 AM",
    "competitiveAdvantages": ["Advantage 1", "Advantage 2"],
    "marketSaturation": "medium",
    "applicationStrategy": "Detailed strategy for this specific profile"
  }
}`

    try {
      const response = await PerplexityIntelligenceService.customQuery({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: USER_PROMPT,
        temperature: 0.3, // Slightly higher for creative analysis
        maxTokens: 3000   // Increased for comprehensive analysis
      })

      // Extract JSON from response (handle Perplexity's text wrapping)
      let text = response.content.trim()
      
      // Remove markdown code blocks if present
      text = text.replace(/```json\s*|\s*```/g, '')
      
      // Extract JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        text = jsonMatch[0]
      }

      const analysis = JSON.parse(text) as EnhancedResumeAnalysis

      // Validate and provide intelligent defaults
      return {
        keywords: analysis.keywords || [],
        location: analysis.location || { 
          city: 'Toronto', 
          province: 'ON', 
          full: 'Toronto, ON',
          country: 'Canada'
        },
        experienceLevel: analysis.experienceLevel || 'mid',
        targetSalaryRange: analysis.targetSalaryRange || {
          min: 65000,
          max: 95000,
          currency: 'CAD',
          marketData: {
            percentile25: 70000,
            percentile50: 80000,
            percentile75: 90000,
            lastUpdated: '2025-10'
          }
        },
        targetJobTitles: analysis.targetJobTitles || [],
        topSkills: analysis.topSkills || [],
        industries: analysis.industries || [],
        certifications: analysis.certifications || [],
        careerSummary: analysis.careerSummary || 'Experienced professional seeking new opportunities',
        futureOutlook: analysis.futureOutlook || {
          aiReplacementRisk: 'medium',
          automationRisk: 'medium',
          fiveYearOutlook: 'stable',
          reasoning: 'Analysis unavailable - recommend manual review',
          recommendations: ['Stay updated with industry trends', 'Develop AI-resistant skills']
        },
        careerPath: analysis.careerPath || {
          currentLevel: 'Individual Contributor',
          nextPossibleRoles: [],
          skillGaps: [],
          recommendedCertifications: []
        },
        searchOptimization: analysis.searchOptimization || {
          bestJobBoards: ['LinkedIn', 'Indeed', 'Job Bank Canada'],
          optimalApplicationTime: 'Tuesday-Thursday, 9-11 AM',
          competitiveAdvantages: [],
          marketSaturation: 'medium',
          applicationStrategy: 'Standard application approach recommended'
        }
      }
    } catch (error) {
      console.error('[PERPLEXITY RESUME ANALYZER] Failed:', error)
      
      // Enhanced fallback with AI risk assessment
      return this.enhancedFallbackAnalysis(resumeText)
    }
  }

  /**
   * Enhanced fallback analysis if Perplexity fails
   */
  private static enhancedFallbackAnalysis(resumeText: string): EnhancedResumeAnalysis {
    // Extract location using improved regex
    const locationRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2,3})/g
    const matches = [...resumeText.matchAll(locationRegex)]
    const locationMatch = matches[0]
    const city = locationMatch?.[1] || 'Toronto'
    const province = locationMatch?.[2] || 'ON'
    const country = province.length === 2 ? 'Canada' : 'United States'

    // Determine experience level with better logic
    const yearsMatches = resumeText.match(/(\d+)\+?\s*years?/gi)
    const maxYears = yearsMatches ? Math.max(...yearsMatches.map(m => parseInt(m))) : 0
    
    const hasLeadership = /lead|manage|director|senior|principal|head\s+of/i.test(resumeText)
    const hasExecutive = /vp|vice\s+president|ceo|cto|cfo|president|executive|founder/i.test(resumeText)
    const hasManager = /manager|supervisor|team\s+lead/i.test(resumeText)
    
    let experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' = 'entry'
    if (hasExecutive || maxYears > 15) experienceLevel = 'executive'
    else if (hasLeadership || hasManager || maxYears > 8) experienceLevel = 'senior'
    else if (maxYears > 3) experienceLevel = 'mid'

    // Enhanced keyword extraction with skill weighting
    const techSkills = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'azure', 'docker', 'kubernetes', 'ai', 'machine learning', 'data science']
    const businessSkills = ['management', 'leadership', 'strategy', 'analysis', 'project management', 'sales', 'marketing']
    
    const words = resumeText.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
    const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'been', 'were', 'would', 'could', 'should', 'work', 'company', 'role', 'position'])
    const wordFreq: Record<string, number> = {}
    
    words.forEach(word => {
      if (!stopWords.has(word)) {
        // Weight tech and business skills higher
        const weight = techSkills.includes(word) || businessSkills.includes(word) ? 3 : 1
        wordFreq[word] = (wordFreq[word] || 0) + weight
      }
    })

    const keywords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word)

    // Assess AI/Automation risk based on job content
    const hasCreativeWork = /creative|design|strategy|innovation|research/i.test(resumeText)
    const hasInterpersonalWork = /team|leadership|management|client|customer|stakeholder/i.test(resumeText)
    const hasAnalyticalWork = /analysis|problem.solving|decision|strategic/i.test(resumeText)
    const hasRoutineWork = /data.entry|processing|administrative|clerical/i.test(resumeText)

    let aiReplacementRisk: 'low' | 'medium' | 'high' = 'medium'
    if (hasCreativeWork && hasInterpersonalWork && hasAnalyticalWork) aiReplacementRisk = 'low'
    else if (hasRoutineWork) aiReplacementRisk = 'high'

    // Salary estimation based on experience and location
    const baseSalaries = {
      entry: { min: 45000, max: 65000 },
      mid: { min: 65000, max: 90000 },
      senior: { min: 90000, max: 130000 },
      executive: { min: 130000, max: 200000 }
    }

    const locationMultiplier = 
      city.toLowerCase().includes('toronto') || city.toLowerCase().includes('vancouver') ? 1.2 :
      city.toLowerCase().includes('calgary') || city.toLowerCase().includes('ottawa') ? 1.1 : 1.0

    const salaryRange = baseSalaries[experienceLevel]
    const currency = country === 'Canada' ? 'CAD' : 'USD'

    return {
      keywords,
      location: { city, province, full: `${city}, ${province}`, country },
      experienceLevel,
      targetSalaryRange: {
        min: Math.round(salaryRange.min * locationMultiplier),
        max: Math.round(salaryRange.max * locationMultiplier),
        currency,
        marketData: {
          percentile25: Math.round(salaryRange.min * locationMultiplier * 1.1),
          percentile50: Math.round((salaryRange.min + salaryRange.max) / 2 * locationMultiplier),
          percentile75: Math.round(salaryRange.max * locationMultiplier * 0.9),
          lastUpdated: '2025-10'
        }
      },
      targetJobTitles: [],
      topSkills: keywords.slice(0, 10).map(skill => ({
        skill,
        yearsExperience: Math.min(maxYears, 10),
        proficiency: experienceLevel === 'executive' ? 'expert' : 
                    experienceLevel === 'senior' ? 'advanced' : 'intermediate',
        marketDemand: techSkills.includes(skill) ? 'high' : 'medium',
        growthTrend: techSkills.includes(skill) ? 'growing' : 'stable'
      })),
      industries: [],
      certifications: [],
      careerSummary: `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}-level professional with expertise in ${keywords.slice(0, 3).join(', ')}`,
      futureOutlook: {
        aiReplacementRisk,
        automationRisk: hasRoutineWork ? 'high' : 'medium',
        fiveYearOutlook: aiReplacementRisk === 'low' ? 'growing' : 'stable',
        reasoning: `Based on skill analysis, this role shows ${aiReplacementRisk} risk of AI replacement due to ${hasCreativeWork ? 'creative and strategic elements' : 'routine task components'}.`,
        recommendations: [
          'Develop AI-resistant skills like strategic thinking and relationship building',
          'Stay updated with industry automation trends',
          'Consider upskilling in emerging technologies'
        ]
      },
      careerPath: {
        currentLevel: experienceLevel === 'entry' ? 'Junior Professional' : 
                     experienceLevel === 'mid' ? 'Experienced Professional' :
                     experienceLevel === 'senior' ? 'Senior Professional' : 'Executive',
        nextPossibleRoles: [],
        skillGaps: [],
        recommendedCertifications: []
      },
      searchOptimization: {
        bestJobBoards: country === 'Canada' ? 
          ['LinkedIn', 'Indeed Canada', 'Job Bank Canada', 'Workopolis'] :
          ['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter'],
        optimalApplicationTime: 'Tuesday-Thursday, 9-11 AM local time',
        competitiveAdvantages: keywords.slice(0, 3),
        marketSaturation: 'medium',
        applicationStrategy: `Focus on ${experienceLevel}-level positions in ${city} market, emphasize ${keywords.slice(0, 2).join(' and ')} experience`
      }
    }
  }

  /**
   * Get AI-powered job search recommendations
   */
  static async getJobSearchRecommendations(analysis: EnhancedResumeAnalysis): Promise<{
    searchTerms: string[]
    excludeTerms: string[]
    targetCompanies: string[]
    networking: string[]
    timeline: string
  }> {
    const prompt = `Based on this career profile, provide job search recommendations:
    
Location: ${analysis.location.full}
Experience: ${analysis.experienceLevel}
Industries: ${analysis.industries.join(', ')}
Skills: ${analysis.topSkills.map(s => s.skill).slice(0, 10).join(', ')}
AI Risk: ${analysis.futureOutlook.aiReplacementRisk}

Return ONLY this JSON:
{
  "searchTerms": ["keyword1", "keyword2", ...],
  "excludeTerms": ["avoid1", "avoid2", ...],
  "targetCompanies": ["company1", "company2", ...],
  "networking": ["strategy1", "strategy2", ...],
  "timeline": "3-6 months explanation"
}`

    try {
      const response = await PerplexityIntelligenceService.customQuery({
        systemPrompt: 'You are a career strategist. Return only valid JSON with no markdown.',
        userPrompt: prompt,
        temperature: 0.4,
        maxTokens: 1500
      })

      // FIXED: Actually parse the AI response
      let content = response.content.trim().replace(/```(?:json)?\s*/g, '')
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          searchTerms: parsed.searchTerms || analysis.keywords.slice(0, 10),
          excludeTerms: parsed.excludeTerms || [],
          targetCompanies: parsed.targetCompanies || [],
          networking: parsed.networking || [],
          timeline: parsed.timeline || '3-6 months'
        }
      }
    } catch (error) {
      console.error('[JOB_SEARCH_RECOMMENDATIONS] Failed:', error)
    }

    // Fallback only if AI completely fails
    return {
      searchTerms: analysis.keywords.slice(0, 10),
      excludeTerms: [],
      targetCompanies: [],
      networking: [],
      timeline: '3-6 months'
    }
  }

  /**
   * Generate market intelligence report
   */
  static async generateMarketReport(analysis: EnhancedResumeAnalysis): Promise<{
    marketTrends: string[]
    salaryTrends: string
    demandForecast: string
    recommendations: string[]
  }> {
    const prompt = `Generate a market intelligence report for this career profile:

Location: ${analysis.location.full} 
Experience: ${analysis.experienceLevel}
Industries: ${analysis.industries.join(', ')}
Target Roles: ${analysis.targetJobTitles.join(', ')}

Return ONLY this JSON:
{
  "marketTrends": ["trend1", "trend2", ...],
  "salaryTrends": "Salary outlook explanation",
  "demandForecast": "Demand forecast explanation",
  "recommendations": ["rec1", "rec2", ...]
}`

    try {
      const response = await PerplexityIntelligenceService.customQuery({
        systemPrompt: 'You are a market research analyst. Return only valid JSON with no markdown.',
        userPrompt: prompt,
        temperature: 0.2,
        maxTokens: 2000
      })

      // FIXED: Actually parse AI response
      let content = response.content.trim().replace(/```(?:json)?\s*/g, '')
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          marketTrends: parsed.marketTrends || [],
          salaryTrends: parsed.salaryTrends || 'Market data unavailable',
          demandForecast: parsed.demandForecast || 'Analysis pending',
          recommendations: parsed.recommendations || analysis.futureOutlook.recommendations
        }
      }
    } catch (error) {
      console.error('[MARKET_REPORT] Failed:', error)
    }

    // Fallback only if AI completely fails
    return {
      marketTrends: ['Remote work increasing', 'AI skills in demand'],
      salaryTrends: 'Market data unavailable',
      demandForecast: 'Analysis pending',
      recommendations: analysis.futureOutlook.recommendations
    }
  }

  /**
   * Get recommended job boards with intelligent matching
   */
  static async getRecommendedJobBoards(analysis: EnhancedResumeAnalysis): Promise<Array<{
    name: string
    relevanceScore: number
    reasoning: string
    specialization: string
  }>> {
    const isCanadian = analysis.location.country === 'Canada'
    const { experienceLevel, industries, topSkills } = analysis
    
    const boards: Array<{
      name: string
      relevanceScore: number
      reasoning: string
      specialization: string
    }> = []

    // Universal boards
    boards.push(
      { name: 'LinkedIn', relevanceScore: 95, reasoning: 'Best for professional networking and quality opportunities', specialization: 'Professional Network' },
      { name: 'Indeed', relevanceScore: 85, reasoning: 'Largest job database with good local coverage', specialization: 'General Purpose' }
    )

    // Canadian-specific
    if (isCanadian) {
      boards.push(
        { name: 'Job Bank Canada', relevanceScore: 90, reasoning: 'Government-backed platform with verified Canadian employers', specialization: 'Canadian Government' },
        { name: 'Workopolis', relevanceScore: 75, reasoning: 'Strong presence in Canadian market', specialization: 'Canadian Corporate' }
      )
    }

    // Experience level specific
    if (experienceLevel === 'executive') {
      boards.push(
        { name: 'The Ladders', relevanceScore: 85, reasoning: 'Specialized in $100K+ executive positions', specialization: 'Executive' },
        { name: 'ExecuNet', relevanceScore: 80, reasoning: 'Executive networking and opportunities', specialization: 'Executive Network' }
      )
    } else if (experienceLevel === 'entry') {
      boards.push(
        { name: 'Glassdoor', relevanceScore: 80, reasoning: 'Good for entry-level positions and company insights', specialization: 'Entry Level' },
        { name: 'ZipRecruiter', relevanceScore: 75, reasoning: 'Quick application process for entry roles', specialization: 'Quick Apply' }
      )
    }

    // Industry-specific recommendations
    const techSkills = topSkills.some(s => ['javascript', 'python', 'react', 'aws', 'docker'].includes(s.skill.toLowerCase()))
    const hasBusinessSkills = topSkills.some(s => ['management', 'sales', 'marketing', 'strategy'].includes(s.skill.toLowerCase()))

    if (techSkills) {
      boards.push(
        { name: 'Dice', relevanceScore: 85, reasoning: 'Technology-focused job board with tech companies', specialization: 'Technology' },
        { name: 'Stack Overflow Jobs', relevanceScore: 80, reasoning: 'Developer-focused positions', specialization: 'Software Development' },
        { name: 'AngelList', relevanceScore: 75, reasoning: 'Startup and tech company opportunities', specialization: 'Startups' }
      )
    }

    if (hasBusinessSkills) {
      boards.push(
        { name: 'Monster', relevanceScore: 70, reasoning: 'Strong in business and management roles', specialization: 'Business & Management' }
      )
    }

    // Sort by relevance score and return top recommendations
    return boards
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8)
  }
}
