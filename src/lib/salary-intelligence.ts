/**
 * Salary Intelligence Service
 * 
 * Provides salary data and insights for job positions
 */

import { PerplexityService } from './perplexity-service'

export interface SalaryData {
  jobTitle: string
  location: string
  salaryRange: {
    min: number
    max: number
    median: number
    currency: string
  }
  percentiles: {
    p25: number
    p50: number
    p75: number
    p90: number
  }
  benefits: string[]
  totalCompensation: {
    base: number
    bonus: number
    equity: number
    total: number
  }
  sources: string[]
  confidence: number
  lastUpdated: string
}

export class SalaryIntelligenceService {
  /**
   * Get salary data for a job position
   */
  static async getSalaryData(jobTitle: string, location: string, company?: string): Promise<SalaryData> {
    try {
      const client = new PerplexityService()
      
      const prompt = `Find comprehensive salary data for this position:

Job Title: ${jobTitle}
Location: ${location}
${company ? `Company: ${company}` : ''}

Search these sources:
1. Glassdoor salary data
2. Payscale.com
3. Levels.fyi (for tech roles)
4. Indeed salary insights
5. LinkedIn salary data
6. Company-specific data if available

Return ONLY valid JSON:
{
  "jobTitle": "${jobTitle}",
  "location": "${location}",
  "salaryRange": {
    "min": 70000,
    "max": 120000,
    "median": 95000,
    "currency": "USD"
  },
  "percentiles": {
    "p25": 75000,
    "p50": 95000,
    "p75": 110000,
    "p90": 125000
  },
  "benefits": ["Health insurance", "401k match", "PTO", "Remote work"],
  "totalCompensation": {
    "base": 95000,
    "bonus": 10000,
    "equity": 20000,
    "total": 125000
  },
  "sources": ["Glassdoor", "Payscale", "LinkedIn"],
  "confidence": 0.85,
  "lastUpdated": "${new Date().toISOString()}"
}

REQUIREMENTS:
- Use real salary data from multiple sources
- Include location-adjusted salaries
- Show percentile breakdown
- List common benefits
- Calculate total compensation
- Provide confidence score based on data availability`

      const response = await client.makeRequest(
        'You are a salary research analyst. Provide accurate, data-driven salary information from multiple sources.',
        prompt,
        {
          temperature: 0.2,
          maxTokens: 2000,
          model: 'sonar-pro'
        }
      )

      // Parse response
      let cleanedContent = response.content.trim()
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
      
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      }

      const parsed = JSON.parse(cleanedContent) as SalaryData

      return parsed
    } catch (error) {
      console.error('[SALARY_INTEL] Failed to get salary data:', error)
      
      // Return fallback
      return {
        jobTitle,
        location,
        salaryRange: {
          min: 0,
          max: 0,
          median: 0,
          currency: 'USD'
        },
        percentiles: {
          p25: 0,
          p50: 0,
          p75: 0,
          p90: 0
        },
        benefits: [],
        totalCompensation: {
          base: 0,
          bonus: 0,
          equity: 0,
          total: 0
        },
        sources: [],
        confidence: 0,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * Compare salary to market rate
   */
  static compareSalary(offeredSalary: number, marketData: SalaryData): {
    percentile: number
    comparison: 'below' | 'at' | 'above'
    difference: number
    recommendation: string
  } {
    const median = marketData.salaryRange.median
    const difference = offeredSalary - median
    const percentageDiff = (difference / median) * 100

    let percentile = 50
    if (offeredSalary >= marketData.percentiles.p90) percentile = 90
    else if (offeredSalary >= marketData.percentiles.p75) percentile = 75
    else if (offeredSalary >= marketData.percentiles.p50) percentile = 50
    else if (offeredSalary >= marketData.percentiles.p25) percentile = 25
    else percentile = 10

    let comparison: 'below' | 'at' | 'above' = 'at'
    if (percentageDiff < -10) comparison = 'below'
    else if (percentageDiff > 10) comparison = 'above'

    let recommendation = ''
    if (comparison === 'below') {
      recommendation = `This offer is ${Math.abs(percentageDiff).toFixed(1)}% below market rate. Consider negotiating for $${median.toLocaleString()} (market median).`
    } else if (comparison === 'above') {
      recommendation = `This offer is ${percentageDiff.toFixed(1)}% above market rate. Excellent compensation!`
    } else {
      recommendation = `This offer is competitive with market rates.`
    }

    return {
      percentile,
      comparison,
      difference,
      recommendation
    }
  }

  /**
   * Get salary negotiation tips
   */
  static getNegotiationTips(salaryData: SalaryData, offeredSalary?: number): string[] {
    const tips = [
      `Market median for ${salaryData.jobTitle} in ${salaryData.location} is $${salaryData.salaryRange.median.toLocaleString()}`,
      `Top performers (75th percentile) earn $${salaryData.percentiles.p75.toLocaleString()}`,
      `Consider total compensation including bonus and equity: $${salaryData.totalCompensation.total.toLocaleString()}`
    ]

    if (offeredSalary) {
      const comparison = this.compareSalary(offeredSalary, salaryData)
      tips.push(comparison.recommendation)
    }

    tips.push(
      'Research company-specific compensation on Glassdoor and Levels.fyi',
      'Negotiate benefits if base salary is fixed (PTO, remote work, signing bonus)',
      'Ask about performance bonuses and equity grants',
      'Request salary review timeline (6 months, 1 year)'
    )

    return tips
  }
}
