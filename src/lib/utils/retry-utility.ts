/**
 * STANDARDIZED RETRY LOGIC - ENTERPRISE GRADE
 * 
 * Consolidated from multiple implementations across the codebase.
 * Based on architecture consolidation plan - Decision 4.
 * 
 * Features:
 * - Exponential backoff with jitter
 * - Configurable max attempts
 * - Type-safe generic implementation
 * - Detailed logging for debugging
 * - Special handling for rate limits
 */

export interface RetryConfig {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  onRetry?: (attempt: number, error: Error) => void
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  onRetry: () => {}
}

/**
 * Execute an operation with exponential backoff retry logic
 * 
 * @param operation - Async function to retry
 * @param config - Retry configuration
 * @returns Result of the operation
 * @throws Last error if all attempts fail
 * 
 * @example
 * const result = await withRetry(
 *   () => fetchData(),
 *   { maxAttempts: 5, baseDelay: 500 }
 * )
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  let lastError: Error | unknown

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      const result = await operation()
      
      if (attempt > 1) {
        console.log(`[RETRY] Operation succeeded on attempt ${attempt}/${cfg.maxAttempts}`)
      }
      
      return result
    } catch (error) {
      lastError = error
      
      // Don't retry on last attempt
      if (attempt === cfg.maxAttempts) {
        console.error(`[RETRY] All ${cfg.maxAttempts} attempts failed`)
        break
      }
      
      // Calculate exponential backoff: 1s, 2s, 4s, 8s (capped)
      const delay = Math.min(
        cfg.baseDelay * Math.pow(2, attempt - 1),
        cfg.maxDelay
      )
      
      // Add jitter to prevent thundering herd (±25%)
      const jitter = delay * (0.75 + Math.random() * 0.5)
      
      console.warn(
        `[RETRY] Attempt ${attempt}/${cfg.maxAttempts} failed, retrying in ${Math.round(jitter)}ms`,
        error instanceof Error ? error.message : error
      )
      
      cfg.onRetry(attempt, error instanceof Error ? error : new Error(String(error)))
      
      await new Promise(resolve => setTimeout(resolve, jitter))
    }
  }

  throw lastError instanceof Error 
    ? lastError 
    : new Error('Operation failed after all retry attempts')
}

/**
 * Perplexity-specific retry with optimized settings
 * 
 * @param operation - Async function to retry
 * @param operationName - Name for logging
 * @returns Result of the operation
 */
export async function withPerplexityRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'perplexity-operation'
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    onRetry: (attempt, error) => {
      console.log(`[PERPLEXITY_RETRY] ${operationName} - attempt ${attempt} failed:`, error.message)
    }
  })
}

/**
 * Retry with custom error handling
 * 
 * @param operation - Async function to retry
 * @param shouldRetry - Function to determine if error is retryable
 * @param config - Retry configuration
 * @returns Result of the operation
 */
export async function withConditionalRetry<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  config: RetryConfig = {}
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  let lastError: Error | unknown

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      const err = error instanceof Error ? error : new Error(String(error))
      
      // Check if we should retry this error
      if (!shouldRetry(err)) {
        console.log('[RETRY] Error is not retryable, failing immediately')
        throw err
      }
      
      if (attempt === cfg.maxAttempts) {
        break
      }
      
      const delay = Math.min(
        cfg.baseDelay * Math.pow(2, attempt - 1),
        cfg.maxDelay
      )
      
      const jitter = delay * (0.75 + Math.random() * 0.5)
      
      console.warn(`[RETRY] Retryable error on attempt ${attempt}, waiting ${Math.round(jitter)}ms`)
      
      cfg.onRetry(attempt, err)
      
      await new Promise(resolve => setTimeout(resolve, jitter))
    }
  }

  throw lastError instanceof Error 
    ? lastError 
    : new Error('Operation failed after all retry attempts')
}

/**
 * Check if an error is retryable (network, timeout, rate limit)
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()
  
  // Network errors
  if (message.includes('econnrefused') || 
      message.includes('enotfound') || 
      message.includes('etimedout') ||
      message.includes('network')) {
    return true
  }
  
  // Rate limit errors
  if (message.includes('429') || message.includes('rate limit')) {
    return true
  }
  
  // Timeout errors
  if (message.includes('timeout')) {
    return true
  }
  
  // Temporary server errors
  if (message.includes('503') || message.includes('502')) {
    return true
  }
  
  // Don't retry authentication or validation errors
  if (message.includes('401') || 
      message.includes('403') || 
      message.includes('400')) {
    return false
  }
  
  return false
}

