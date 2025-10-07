/**
 * Retry Utility with Exponential Backoff
 * For resilient API calls and operations
 */

import { errorTracker } from './error-tracking'
import { logger } from './logger'

export interface RetryOptions {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryableErrors?: (error: any) => boolean
  onRetry?: (attempt: number, error: any) => void
  context?: string
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryableErrors' | 'onRetry' | 'context'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
}

/**
 * Execute an operation with retry logic and exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation()
      
      // Log success after retry
      if (attempt > 1) {
        logger.info(`Operation succeeded after ${attempt} attempts`, {
          context: options.context || 'retry',
          attempts: attempt
        })
      }
      
      return result
    } catch (error) {
      lastError = error
      
      // Check if error is retryable
      if (options.retryableErrors && !options.retryableErrors(error)) {
        throw error
      }
      
      // If this was the last attempt, don't wait or retry
      if (attempt === config.maxAttempts) {
        break
      }
      
      // Calculate delay with exponential backoff
      const baseDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1)
      const jitter = Math.random() * 0.3 * baseDelay // Add jitter to prevent thundering herd
      const delay = Math.min(baseDelay + jitter, config.maxDelayMs)
      
      // Log retry attempt
      logger.warn(`Operation failed, retrying...`, {
        context: options.context || 'retry',
        attempt,
        maxAttempts: config.maxAttempts,
        delayMs: Math.round(delay),
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Track error
      errorTracker.trackError(error as Error, {
        context: options.context || 'retry',
        severity: 'medium',
        tags: ['retry', `attempt-${attempt}`],
        metadata: {
          attempt,
          maxAttempts: config.maxAttempts,
          willRetry: attempt < config.maxAttempts
        }
      })
      
      // Call onRetry callback if provided
      if (options.onRetry) {
        options.onRetry(attempt, error)
      }
      
      // Wait before retrying
      await sleep(delay)
    }
  }
  
  // All retries failed
  const finalError = new Error(
    `Operation failed after ${config.maxAttempts} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  )
  
  errorTracker.trackError(finalError, {
    context: options.context || 'retry',
    severity: 'high',
    tags: ['retry-failed', 'max-attempts-reached'],
    metadata: {
      attempts: config.maxAttempts,
      originalError: lastError instanceof Error ? lastError.message : String(lastError)
    }
  })
  
  throw finalError
}

/**
 * Helper to determine if an error is retryable based on HTTP status
 */
export function isRetryableHttpError(error: any): boolean {
  // Retry on network errors
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return true
  }
  
  // Retry on specific HTTP status codes
  const retryableStatuses = [408, 429, 500, 502, 503, 504]
  if (error.status && retryableStatuses.includes(error.status)) {
    return true
  }
  
  // Retry on timeout errors
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return true
  }
  
  return false
}

/**
 * Helper to determine if an error is retryable for database operations
 */
export function isRetryableDatabaseError(error: any): boolean {
  // Retry on connection errors
  if (error.name === 'MongoNetworkError' || error.message?.includes('ECONNREFUSED')) {
    return true
  }
  
  // Retry on timeout errors
  if (error.name === 'MongoServerSelectionError' || error.message?.includes('timed out')) {
    return true
  }
  
  // Don't retry on validation or duplicate key errors
  if (error.name === 'ValidationError' || error.code === 11000) {
    return false
  }
  
  return false
}

/**
 * Retry specifically for fetch/API calls
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retryOptions?: Omit<RetryOptions, 'context' | 'retryableErrors'>
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(url, init)
      
      // Throw error for non-OK responses so they can be retried
      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`)
        error.status = response.status
        error.response = response
        throw error
      }
      
      return response
    },
    {
      ...retryOptions,
      context: `fetch:${url}`,
      retryableErrors: isRetryableHttpError
    }
  )
}

/**
 * Simple sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Batch retry - retry multiple operations with shared config
 */
export async function batchRetry<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<Array<{ success: boolean; result?: T; error?: any }>> {
  const results = await Promise.allSettled(
    operations.map(op => withRetry(op, options))
  )
  
  return results.map(result => {
    if (result.status === 'fulfilled') {
      return { success: true, result: result.value }
    } else {
      return { success: false, error: result.reason }
    }
  })
}

/**
 * Circuit breaker state for repeated failures
 */
class CircuitBreaker {
  private failures = 0
  private lastFailureTime: number | null = null
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private threshold: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should be half-open (try to recover)
    if (this.state === 'open' && this.shouldReset()) {
      this.state = 'half-open'
    }
    
    // Reject if circuit is open
    if (this.state === 'open') {
      throw new Error('Circuit breaker is OPEN - too many recent failures')
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }
  
  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.threshold) {
      this.state = 'open'
      logger.error('Circuit breaker opened due to repeated failures', {
        failures: this.failures,
        threshold: this.threshold
      })
    }
  }
  
  private shouldReset(): boolean {
    if (!this.lastFailureTime) return false
    return Date.now() - this.lastFailureTime > this.resetTimeoutMs
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}

// Global circuit breakers for common operations
export const circuitBreakers = {
  perplexityAPI: new CircuitBreaker(5, 60000),
  database: new CircuitBreaker(10, 30000),
  redis: new CircuitBreaker(5, 30000)
}

