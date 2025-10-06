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

  private readonly failureThreshold = 5
  private readonly recoveryTimeout = 30000 // 30 seconds
  private readonly cacheTTL = 3600000 // 1 hour

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

      // Check cache
      const cacheKey = this.generateCacheKey(params)
      const cached = this.getFromCache(cacheKey)
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

      // Cache successful result
      this.setCache(cacheKey, result.data)

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
    let lastError: Error

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
          { role: 'system', content: 'You are an expert resume writer...' },
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
      data: this.parseResponse(data),
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
    return crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex')
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.cacheTTL
    })
  }

  private buildPrompt(params: any): string {
    return `Optimize this resume for the ${params.jobTitle} position at ${params.companyName}...`
  }

  private parseResponse(data: any): any {
    // Parse AI response and extract relevant data
    return {
      customizedText: data.choices[0]?.message?.content || '',
      matchScore: Math.floor(Math.random() * 40) + 60 // Placeholder
    }
  }

  private calculateCost(usage: any): number {
    // Calculate actual cost based on token usage
    return 0.001 // Placeholder
  }
}
