import { PerplexityIntelligenceService } from './perplexity-intelligence'

export class PerplexityJobSearchService {
  
  // Enhanced Canadian job search with better prompts
  static async searchCanadianJobs(keywords: string, location: string, options: {
    experienceLevel?: 'entry' | 'mid' | 'senior'
    remote?: boolean
    salaryMin?: number
    limit?: number
  } = {}) {
    const { experienceLevel, remote, salaryMin, limit = 20 } = options
    
    // Build enhanced search queries for Perplexity
    const queries = [
      // Job Bank Canada (government jobs)
      `site:jobbank.gc.ca "${keywords}" "${location}" ${experienceLevel ? `"${experienceLevel} level"` : ''} ${remote ? 'remote' : ''} after:2024-01-01`,
      
      // Indeed Canada  
      `site:ca.indeed.com "${keywords}" "${location}" ${salaryMin ? `salary:>${salaryMin}` : ''} ${remote ? 'remote' : ''} after:2024-01-01`,
      
      // LinkedIn Jobs Canada
      `site:linkedin.com/jobs "${keywords}" "${location}" Canada ${remote ? 'remote' : ''} after:2024-01-01`,
      
      // Workopolis (Canadian)
      `site:workopolis.com "${keywords}" "${location}" ${remote ? 'remote' : ''} after:2024-01-01`,
      
      // Glassdoor Canada
      `site:glassdoor.ca/Job "${keywords}" "${location}" ${remote ? 'remote' : ''} after:2024-01-01`
    ]
    
    const allResults: any[] = []
    
    for (const query of queries) {
      try {
        const results = await PerplexityIntelligenceService.jobQuickSearch(
          query, 
          [], // Let Perplexity determine domains
          Math.ceil(limit / queries.length), 
          'week'
        )
        allResults.push(...results)
      } catch (error) {
        console.error(`Perplexity job search failed for query: ${query}`, error)
      }
    }
    
    return this.deduplicateAndEnhance(allResults, limit)
  }
  
  // Enhanced job market analysis using Perplexity
  static async analyzeJobMarket(keywords: string, location: string) {
    const query = `Job market analysis for "${keywords}" roles in "${location}" Canada: current demand, salary ranges, required skills, growth trends, top hiring companies`
    
    try {
      const analysis = await PerplexityIntelligenceService.researchCompanyV2({
        company: `${keywords} job market ${location} Canada`,
        role: keywords,
        geo: location
      })
      
      return {
        demand: analysis.data.growth,
        salaries: analysis.data.salaries,
        skills: analysis.data.culture, // Repurpose for market skills
        companies: analysis.data.contacts, // Repurpose for hiring companies
        trends: analysis.data.financials // Repurpose for market trends
      }
    } catch (error) {
      console.error('Job market analysis failed:', error)
      return null
    }
  }
  
  // Get specific job details using Perplexity
  static async getJobDetails(jobUrl: string) {
    const query = `Extract job details from ${jobUrl}: title, company, location, salary, requirements, responsibilities, benefits, application deadline`
    
    try {
      const results = await PerplexityIntelligenceService.jobQuickSearch(
        query,
        [new URL(jobUrl).hostname],
        1,
        'day'
      )
      
      if (results.length > 0) {
        // Parse job details from Perplexity response
        return this.parseJobDetails(results[0])
      }
    } catch (error) {
      console.error('Job details extraction failed:', error)
    }
    
    return null
  }
  
  private static deduplicateAndEnhance(results: any[], limit: number) {
    // Remove duplicates by URL
    const seen = new Set()
    const unique = results.filter(job => {
      if (seen.has(job.url)) return false
      seen.add(job.url)
      return true
    })
    
    // Enhance with additional data
    const enhanced = unique.map(job => ({
      ...job,
      source: this.extractSource(job.url),
      isCanadian: this.isCanadianJobSite(job.url),
      estimatedSalary: this.estimateSalary(job.title, job.snippet),
      matchScore: this.calculateMatchScore(job.title, job.snippet)
    }))
    
    // Sort by relevance and recency
    enhanced.sort((a, b) => {
      if (a.isCanadian && !b.isCanadian) return -1
      if (b.isCanadian && !a.isCanadian) return 1
      return b.matchScore - a.matchScore
    })
    
    return enhanced.slice(0, limit)
  }
  
  private static extractSource(url: string): string {
    try {
      const hostname = new URL(url).hostname.replace('www.', '')
      return hostname.includes('jobbank.gc.ca') ? 'Job Bank Canada' :
             hostname.includes('indeed.ca') ? 'Indeed Canada' :
             hostname.includes('linkedin.com') ? 'LinkedIn' :
             hostname.includes('workopolis.com') ? 'Workopolis' :
             hostname.includes('glassdoor.ca') ? 'Glassdoor Canada' :
             hostname
    } catch {
      return 'Unknown'
    }
  }
  
  private static isCanadianJobSite(url: string): boolean {
    return /jobbank\.gc\.ca|indeed\.ca|workopolis\.com|glassdoor\.ca/.test(url)
  }
  
  private static estimateSalary(title: string, snippet: string): string | null {
    const salaryRegex = /\$[\d,]+(?:\s*-\s*\$?[\d,]+)?(?:\s*(?:per|\/)\s*(?:hour|year|annum))?/gi
    const match = (title + ' ' + snippet).match(salaryRegex)
    return match ? match[0] : null
  }
  
  private static calculateMatchScore(title: string, snippet: string): number {
    // Simple relevance scoring based on keyword presence
    const content = (title + ' ' + snippet).toLowerCase()
    let score = 0
    
    // Boost for recent postings
    if (/\b(?:new|today|yesterday|hours?\s+ago|days?\s+ago)\b/i.test(content)) score += 20
    
    // Boost for full-time positions  
    if (/\b(?:full.?time|permanent|career)\b/i.test(content)) score += 15
    
    // Boost for Canadian companies
    if (/\b(?:canada|canadian|toronto|vancouver|montreal|calgary|ottawa|edmonton)\b/i.test(content)) score += 10
    
    return Math.min(100, score + Math.floor(Math.random() * 30)) // Add some randomization
  }
  
  private static parseJobDetails(result: any) {
    // Extract structured job details from Perplexity response
    const { title, snippet, url } = result
    
    return {
      title: title,
      company: this.extractCompany(snippet),
      location: this.extractLocation(snippet),  
      salary: this.extractSalary(snippet),
      requirements: this.extractRequirements(snippet),
      url: url,
      source: this.extractSource(url),
      parsedAt: new Date().toISOString()
    }
  }
  
  private static extractCompany(text: string): string | null {
    // Company name extraction logic
    const patterns = [
      /at\s+([A-Z][a-zA-Z\s&]+?)(?:\s+is\s+|\s+seeks\s+|\s+looking\s+|\.)/,
      /([A-Z][a-zA-Z\s&]+?)\s+is\s+(?:hiring|seeking|looking)/
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) return match[1].trim()
    }
    
    return null
  }
  
  private static extractLocation(text: string): string | null {
    const locationPattern = /(?:in|at|located)\s+([A-Z][a-zA-Z\s,]+?(?:,\s*[A-Z]{2})?)\b/
    const match = text.match(locationPattern)
    return match ? match[1].trim() : null
  }
  
  private static extractSalary(text: string): string | null {
    const salaryPattern = /\$[\d,]+(?:\s*-\s*\$?[\d,]+)?(?:\s*(?:per|\/)\s*(?:hour|year|annum))?/i
    const match = text.match(salaryPattern)
    return match ? match[0] : null
  }
  
  private static extractRequirements(text: string): string[] {
    // Extract key requirements from job snippet
    const requirements: string[] = []
    const skillPatterns = [
      /\b(?:experience with|knowledge of|proficient in|skilled in)\s+([^.,]+)/gi,
      /\b(?:must have|requires?|seeking)\s+([^.,]+)/gi
    ]
    
    for (const pattern of skillPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        requirements.push(match[1].trim())
      }
    }
    
    return requirements.slice(0, 5) // Limit to top 5
  }
}
