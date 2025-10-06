// Enterprise AI Service with Circuit Breakers, Caching, and Retry Logic

import { RedisCache, CacheKeys } from './redis-cache'

interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
  cost: number
  model: string
}

interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  state: 'closed' | 'open' | 'half-open'
}

export class EnterpriseAIService {
  private static instance: EnterpriseAIService
  private circuitBreaker: Map<string, CircuitBreakerState> = new Map()
  private cache: Map<string, { data: any; expires: number }> = new Map()
  private redisCache: RedisCache
  
  private readonly failureThreshold = 5
  private readonly recoveryTimeout = 30000 // 30 seconds
  private readonly cacheTTL = 3600000 // 1 hour

  private constructor() {
    this.redisCache = RedisCache.getInstance()
  }

  static getInstance(): EnterpriseAIService {
    if (!EnterpriseAIService.instance) {
      EnterpriseAIService.instance = new EnterpriseAIService()
    }
    return EnterpriseAIService.instance
  }

  async customizeResume(params: {
    resumeText: string
    jobDescription: string
    jobTitle: string
    companyName: string
    options?: any
  }): Promise<AIResponse<{ customizedText: string; matchScore: number }>> {
    const operationKey = 'resume-customize'
    
    try {
      // Check circuit breaker
      if (!this.isCircuitClosed(operationKey)) {
        return {
          success: false,
          error: 'AI service temporarily unavailable',
          cost: 0,
          model: 'none'
        }
      }

      // Check cache (async now with Redis)
      const cacheKey = this.generateCacheKey(params)
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          cost: 0,
          model: 'cached'
        }
      }

      // Make AI request with retry logic
      const result = await this.makeAIRequestWithRetry(operationKey, params)
      
      // Cache successful result (async now with Redis)
      if (result.success && result.data) {
        await this.setCache(cacheKey, result.data)
      }
      
      // Reset circuit breaker on success
      this.resetCircuitBreaker(operationKey)
      
      return result

    } catch (error) {
      // Record failure
      this.recordFailure(operationKey)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI service error',
        cost: 0,
        model: 'error'
      }
    }
  }

  private async makeAIRequestWithRetry(operationKey: string, params: any, maxRetries = 3): Promise<AIResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Exponential backoff
        if (attempt > 1) {
          const delay = Math.pow(2, attempt - 1) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        // Make actual AI request
        const result = await this.makePerplexityRequest(params)
        return result

      } catch (error) {
        lastError = error as Error
        
        // Don't retry on certain errors
        if (error instanceof Error && error.message.includes('401')) {
          break
        }
      }
    }

    throw lastError!
  }

  private async makePerplexityRequest(params: any): Promise<AIResponse> {
    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      throw new Error('Perplexity API key not configured')
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are an expert resume writer and ATS optimization specialist.' },
          { role: 'user', content: this.buildPrompt(params) }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: this.parseResponse(data, params),
      cost: this.calculateCost(data.usage),
      model: 'sonar-pro'
    }
  }

  private isCircuitClosed(key: string): boolean {
    const state = this.circuitBreaker.get(key)
    if (!state) return true

    if (state.state === 'open') {
      if (Date.now() - state.lastFailureTime > this.recoveryTimeout) {
        state.state = 'half-open'
        return true
      }
      return false
    }

    return true
  }

  private recordFailure(key: string): void {
    const state = this.circuitBreaker.get(key) || { failures: 0, lastFailureTime: 0, state: 'closed' as const }
    
    state.failures++
    state.lastFailureTime = Date.now()
    
    if (state.failures >= this.failureThreshold) {
      state.state = 'open'
    }
    
    this.circuitBreaker.set(key, state)
  }

  private resetCircuitBreaker(key: string): void {
    this.circuitBreaker.set(key, { failures: 0, lastFailureTime: 0, state: 'closed' })
  }

  private generateCacheKey(params: any): string {
    const crypto = require('crypto')
    const normalized = {
      resume: params.resumeText.substring(0, 1000),
      job: params.jobDescription.substring(0, 500),
      title: params.jobTitle,
      company: params.companyName
    }
    return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
  }

  private async getFromCache(key: string): Promise<any | null> {
    // Try Redis first (distributed cache)
    if (this.redisCache.isAvailable()) {
      const redisKey = CacheKeys.aiResponse(key)
      const cached = await this.redisCache.get(redisKey)
      if (cached) {
        return cached
      }
    }

    // Fallback to in-memory cache
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private async setCache(key: string, data: any): Promise<void> {
    // Set in Redis (distributed cache) with 1-hour TTL
    if (this.redisCache.isAvailable()) {
      const redisKey = CacheKeys.aiResponse(key)
      await this.redisCache.set(redisKey, data, 3600) // 1 hour
    }

    // Also set in memory cache as fallback
    this.cache.set(key, {
      data,
      expires: Date.now() + this.cacheTTL
    })
  }

  private buildPrompt(params: any): string {
    // Use custom prompt if provided
    if (params.prompt) {
      return params.prompt
    }

    // Default resume customization prompt
    return `Optimize this resume for the ${params.jobTitle} position at ${params.companyName}.

Job Description:
${params.jobDescription}

Current Resume:
${params.resumeText}

Requirements:
- Match keywords from the job description
- Optimize for ATS systems
- Maintain authenticity
- Keep the same general structure
- Quantify achievements where possible

Return only the optimized resume text.`
  }

  private parseResponse(data: any, params: any): any {
    const customizedText = data.choices[0]?.message?.content || ''
    
    // Calculate match score based on keyword overlap
    const jdKeywords = this.extractKeywords(params.jobDescription)
    const resumeKeywords = this.extractKeywords(customizedText)
    const matchScore = this.calculateMatchScore(jdKeywords, resumeKeywords)
    
    return {
      customizedText,
      matchScore
    }
  }

  private extractKeywords(text: string): Set<string> {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
    return new Set(words)
  }

  private calculateMatchScore(jdKeywords: Set<string>, resumeKeywords: Set<string>): number {
    let matches = 0
    for (const keyword of jdKeywords) {
      if (resumeKeywords.has(keyword)) {
        matches++
      }
    }
    const score = (matches / Math.max(jdKeywords.size, 1)) * 100
    return Math.min(100, Math.round(score))
  }

  private calculateCost(usage: any): number {
    // Sonar-pro pricing: ~$1 per 1M tokens
    const totalTokens = (usage?.total_tokens || 0)
    return (totalTokens / 1000000) * 1.0
  }

  // Additional AI operations

  async generateCoverLetter(params: {
    resumeText: string
    jobDescription: string
    jobTitle: string
    companyName: string
    companyResearch?: string
  }): Promise<AIResponse<{ coverLetter: string }>> {
    const operationKey = 'cover-letter-generate'
    
    try {
      if (!this.isCircuitClosed(operationKey)) {
        return {
          success: false,
          error: 'AI service temporarily unavailable',
          cost: 0,
          model: 'none'
        }
      }

      const cacheKey = this.generateCacheKey(params)
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          cost: 0,
          model: 'cached'
        }
      }

      const prompt = `Write a compelling cover letter for the ${params.jobTitle} position at ${params.companyName}.

Job Description:
${params.jobDescription}

Candidate Resume:
${params.resumeText}

${params.companyResearch ? `Company Research:\n${params.companyResearch}\n\n` : ''}

Requirements:
- Address specific job requirements
- Show genuine interest in the company
- Highlight relevant achievements
- Professional tone
- 300-400 words

Return only the cover letter text.`

      const result = await this.makeAIRequestWithRetry(operationKey, { ...params, prompt })
      
      if (result.success && result.data) {
        await this.setCache(cacheKey, result.data)
      }
      
      this.resetCircuitBreaker(operationKey)
      return result

    } catch (error) {
      this.recordFailure(operationKey)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI service error',
        cost: 0,
        model: 'error'
      }
    }
  }

  async analyzeJobFit(params: {
    resumeText: string
    jobDescription: string
    jobTitle: string
  }): Promise<AIResponse<{ 
    matchScore: number
    strengths: string[]
    gaps: string[]
    recommendations: string[]
  }>> {
    const operationKey = 'job-fit-analysis'
    
    try {
      if (!this.isCircuitClosed(operationKey)) {
        return {
          success: false,
          error: 'AI service temporarily unavailable',
          cost: 0,
          model: 'none'
        }
      }

      const cacheKey = this.generateCacheKey(params)
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          cost: 0,
          model: 'cached'
        }
      }

      const prompt = `Analyze the fit between this candidate and job posting.

Job Title: ${params.jobTitle}

Job Description:
${params.jobDescription}

Candidate Resume:
${params.resumeText}

Provide:
1. Overall match score (0-100)
2. Top 3 strengths (why they're a good fit)
3. Top 3 gaps (what they're missing)
4. Top 3 recommendations (how to improve match)

Return as JSON: { "matchScore": number, "strengths": string[], "gaps": string[], "recommendations": string[] }`

      const result = await this.makeAIRequestWithRetry(operationKey, { ...params, prompt })
      
      if (result.success && result.data) {
        // Parse JSON response
        try {
          const parsed = JSON.parse(result.data.customizedText || '{}')
          result.data = parsed
          await this.setCache(cacheKey, parsed)
        } catch {
          result.data = {
            matchScore: 50,
            strengths: ['Experience in relevant field'],
            gaps: ['Unable to analyze - please try again'],
            recommendations: ['Review job description carefully']
          }
        }
      }
      
      this.resetCircuitBreaker(operationKey)
      return result

    } catch (error) {
      this.recordFailure(operationKey)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI service error',
        cost: 0,
        model: 'error'
      }
    }
  }

  async generateInterviewQuestions(params: {
    jobDescription: string
    jobTitle: string
    companyName: string
  }): Promise<AIResponse<{ 
    technicalQuestions: string[]
    behavioralQuestions: string[]
    companyQuestions: string[]
  }>> {
    const operationKey = 'interview-questions'
    
    try {
      if (!this.isCircuitClosed(operationKey)) {
        return {
          success: false,
          error: 'AI service temporarily unavailable',
          cost: 0,
          model: 'none'
        }
      }

      const cacheKey = this.generateCacheKey(params)
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          cost: 0,
          model: 'cached'
        }
      }

      const prompt = `Generate interview questions for a ${params.jobTitle} position at ${params.companyName}.

Job Description:
${params.jobDescription}

Provide:
1. 5 technical/skills-based questions
2. 5 behavioral (STAR method) questions
3. 5 company-specific questions to ask

Return as JSON: { "technicalQuestions": string[], "behavioralQuestions": string[], "companyQuestions": string[] }`

      const result = await this.makeAIRequestWithRetry(operationKey, { ...params, prompt })
      
      if (result.success && result.data) {
        try {
          const parsed = JSON.parse(result.data.customizedText || '{}')
          result.data = parsed
          this.setCache(cacheKey, parsed)
        } catch {
          result.data = {
            technicalQuestions: ['Tell me about your experience with the key technologies for this role'],
            behavioralQuestions: ['Describe a time when you overcame a significant challenge'],
            companyQuestions: ['What are the team\'s current priorities?']
          }
        }
      }
      
      this.resetCircuitBreaker(operationKey)
      return result

    } catch (error) {
      this.recordFailure(operationKey)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI service error',
        cost: 0,
        model: 'error'
      }
    }
  }

  // Clean up expired cache entries
  public cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (value.expires < now) {
        this.cache.delete(key)
      }
    }
  }

  // Get statistics
  public getStats(): {
    cacheSize: number
    circuitBreakerStates: Record<string, CircuitBreakerState>
    cacheHitRate?: number
  } {
    const states: Record<string, CircuitBreakerState> = {}
    for (const [key, value] of this.circuitBreaker.entries()) {
      states[key] = value
    }

    return {
      cacheSize: this.cache.size,
      circuitBreakerStates: states
    }
  }

  // Clear all caches
  public clearCache(): void {
    this.cache.clear()
  }
}
