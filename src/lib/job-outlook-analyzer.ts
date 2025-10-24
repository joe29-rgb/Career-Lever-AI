/**
 * AI/Automation Job Outlook Analyzer
 * 
 * Provides 5-year job market projections using Perplexity AI
 * Analyzes automation risk, growth trends, and career recommendations
 */

import { PerplexityIntelligenceService } from './perplexity-intelligence'

export interface JobOutlook {
  jobTitle: string
  location: string
  
  // 5-Year Projections
  projections: {
    year: number
    demandTrend: 'increasing' | 'stable' | 'decreasing'
    salaryGrowth: number // percentage
    jobOpenings: number // estimated
  }[]
  
  // Automation Risk Analysis
  automation: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    riskScore: number // 0-100
    automationTimeline: string // e.g. "5-10 years", "10+ years"
    vulnerableTasks: string[]
    safeTasks: string[]
    recommendations: string[]
  }
  
  // Market Intelligence
  market: {
    currentDemand: 'very high' | 'high' | 'moderate' | 'low'
    competitionLevel: 'very competitive' | 'competitive' | 'moderate' | 'favorable'
    emergingSkills: string[]
    decliningSkills: string[]
    topIndustries: string[]
    averageSalary: {
      min: number
      max: number
      median: number
      currency: string
    }
  }
  
  // Career Recommendations
  recommendations: {
    upskilling: string[]
    pivotOpportunities: string[]
    certifications: string[]
    safetyScore: number // 0-100, higher = more future-proof
  }
  
  // Data Sources
  metadata: {
    analyzedAt: string
    sources: string[]
    confidence: 'high' | 'medium' | 'low'
  }
}

export class JobOutlookAnalyzer {
  /**
   * Analyze job outlook using Perplexity AI with real-time market data
   */
  static async analyzeJobOutlook(
    jobTitle: string,
    location: string = 'Canada'
  ): Promise<JobOutlook> {
    const SYSTEM_PROMPT = `You are a labor market analyst and AI/automation expert specializing in Canadian and US job markets.

Analyze job outlook with:
1. 5-year demand and salary projections (year-by-year)
2. AI/automation risk assessment with timeline
3. Vulnerable vs. safe job tasks
4. Current market intelligence
5. Emerging and declining skills
6. Career recommendations and pivot opportunities

Use REAL data from:
- Statistics Canada
- US Bureau of Labor Statistics  
- LinkedIn Workforce Reports
- Indeed job market data
- McKinsey automation studies
- WEF Future of Jobs reports

OUTPUT ONLY valid JSON, no explanations.`

    const USER_PROMPT = `Analyze the job outlook for: "${jobTitle}" in ${location}

Provide comprehensive 5-year analysis including automation risk.

Return ONLY this JSON:
{
  "jobTitle": "${jobTitle}",
  "location": "${location}",
  "projections": [
    {
      "year": 2025,
      "demandTrend": "increasing",
      "salaryGrowth": 3.5,
      "jobOpenings": 15000
    }
  ],
  "automation": {
    "riskLevel": "medium",
    "riskScore": 45,
    "automationTimeline": "10-15 years",
    "vulnerableTasks": ["Task 1", "Task 2"],
    "safeTasks": ["Task 1", "Task 2"],
    "recommendations": ["Learn AI tools", "Focus on strategic thinking"]
  },
  "market": {
    "currentDemand": "high",
    "competitionLevel": "competitive",
    "emergingSkills": ["AI/ML", "Data Analysis"],
    "decliningSkills": ["Manual data entry"],
    "topIndustries": ["Technology", "Finance"],
    "averageSalary": {
      "min": 60000,
      "max": 120000,
      "median": 85000,
      "currency": "CAD"
    }
  },
  "recommendations": {
    "upskilling": ["Learn Python", "Get certified in X"],
    "pivotOpportunities": ["Data Analyst", "Product Manager"],
    "certifications": ["PMP", "AWS Cloud"],
    "safetyScore": 75
  },
  "metadata": {
    "analyzedAt": "${new Date().toISOString()}",
    "sources": ["Statistics Canada", "LinkedIn Workforce Report"],
    "confidence": "high"
  }
}`

    try {
      const response = await PerplexityIntelligenceService.customQuery({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: USER_PROMPT,
        temperature: 0.2,
        maxTokens: 3000
      })

      // Extract JSON from response.content
      let text = response.content.trim()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        text = jsonMatch[0]
      }

      const outlook = JSON.parse(text) as JobOutlook

      // Validate and provide defaults
      return {
        jobTitle: outlook.jobTitle || jobTitle,
        location: outlook.location || location,
        projections: outlook.projections || this.defaultProjections(),
        automation: outlook.automation || this.defaultAutomation(),
        market: outlook.market || this.defaultMarket(),
        recommendations: outlook.recommendations || this.defaultRecommendations(),
        metadata: outlook.metadata || {
          analyzedAt: new Date().toISOString(),
          sources: ['Perplexity AI'],
          confidence: 'medium'
        }
      }
    } catch (error) {
      console.error('[JOB OUTLOOK ANALYZER] Failed:', error)
      
      // Fallback to general outlook
      return this.fallbackOutlook(jobTitle, location)
    }
  }

  /**
   * Quick automation risk check (faster, less comprehensive)
   */
  static async quickAutomationRisk(jobTitle: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    riskScore: number
    summary: string
  }> {
    const QUICK_PROMPT = `What is the automation risk for "${jobTitle}" jobs? 
    
Return JSON:
{
  "riskLevel": "low|medium|high|critical",
  "riskScore": 0-100,
  "summary": "One sentence explanation"
}`

    try {
      const response = await PerplexityIntelligenceService.customQuery({
        systemPrompt: 'You assess job automation risk based on AI capabilities.',
        userPrompt: QUICK_PROMPT,
        temperature: 0.2,
        maxTokens: 300
      })

      const data = JSON.parse(response.content.match(/\{[\s\S]*\}/)![0])
      return data
    } catch {
      return {
        riskLevel: 'medium',
        riskScore: 50,
        summary: 'Unable to assess automation risk at this time.'
      }
    }
  }

  // Fallback data
  private static fallbackOutlook(jobTitle: string, location: string): JobOutlook {
    return {
      jobTitle,
      location,
      projections: this.defaultProjections(),
      automation: this.defaultAutomation(),
      market: this.defaultMarket(),
      recommendations: this.defaultRecommendations(),
      metadata: {
        analyzedAt: new Date().toISOString(),
        sources: ['Fallback data'],
        confidence: 'low'
      }
    }
  }

  private static defaultProjections() {
    return [2025, 2026, 2027, 2028, 2029].map((year, i) => ({
      year,
      demandTrend: 'stable' as const,
      salaryGrowth: 2.5 + i * 0.5,
      jobOpenings: 10000 + i * 1000
    }))
  }

  private static defaultAutomation() {
    return {
      riskLevel: 'medium' as const,
      riskScore: 50,
      automationTimeline: '10-15 years',
      vulnerableTasks: ['Routine data entry', 'Basic report generation'],
      safeTasks: ['Strategic planning', 'Client relationship management'],
      recommendations: [
        'Focus on soft skills and strategic thinking',
        'Learn to work with AI tools',
        'Develop leadership capabilities'
      ]
    }
  }

  private static defaultMarket() {
    return {
      currentDemand: 'moderate' as const,
      competitionLevel: 'competitive' as const,
      emergingSkills: ['AI/ML literacy', 'Data analysis', 'Cloud computing'],
      decliningSkills: ['Manual processes', 'Legacy systems'],
      topIndustries: ['Technology', 'Finance', 'Healthcare'],
      averageSalary: {
        min: 50000,
        max: 100000,
        median: 70000,
        currency: 'CAD'
      }
    }
  }

  private static defaultRecommendations() {
    return {
      upskilling: ['Learn AI tools', 'Improve data literacy', 'Develop soft skills'],
      pivotOpportunities: ['Data Analyst', 'Project Manager', 'Business Analyst'],
      certifications: ['PMP', 'Scrum Master', 'Google Analytics'],
      safetyScore: 65
    }
  }
}

