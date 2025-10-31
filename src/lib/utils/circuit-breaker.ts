/**
 * CIRCUIT BREAKER PATTERN
 * Prevents cascading failures by stopping requests to failing services
 */

export class CircuitBreaker {
  private failures = 0
  private readonly threshold: number
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private nextAttempt: number = Date.now()
  private readonly timeout: number

  constructor(threshold = 3, timeout = 60000) {
    this.threshold = threshold
    this.timeout = timeout
  }

  async execute<T>(fn: () => Promise<T>): Promise<T | null> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        console.log('[CIRCUIT BREAKER] Circuit is OPEN, request blocked')
        return null
      }
      // Try half-open
      this.state = 'half-open'
      console.log('[CIRCUIT BREAKER] Trying half-open state')
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    if (this.state === 'half-open') {
      this.state = 'closed'
      console.log('[CIRCUIT BREAKER] Circuit closed - service recovered')
    }
  }

  private onFailure() {
    this.failures++
    console.log(`[CIRCUIT BREAKER] Failure ${this.failures}/${this.threshold}`)
    
    if (this.failures >= this.threshold) {
      this.state = 'open'
      this.nextAttempt = Date.now() + this.timeout
      console.log(`[CIRCUIT BREAKER] Circuit opened - cooling down for ${this.timeout}ms`)
    }
  }

  getState() {
    return this.state
  }

  reset() {
    this.failures = 0
    this.state = 'closed'
    this.nextAttempt = Date.now()
  }
}
