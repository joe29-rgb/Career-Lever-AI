/**
 * PERPLEXITY AUDIT FIX - PHASE 2: Retry Logic with Exponential Backoff
 * Based on 2024 industry best practices for resilient API integrations
 */

export interface RetryConfig {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
}

/**
 * Executes an operation with exponential backoff retry logic
 * 
 * @param operation - Async function to retry
 * @param config - Retry configuration
 * @param operationName - Name for logging
 * @returns Result of the operation
 * @throws Last error if all attempts fail
 */
export async function withRetryAndBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {},
  operationName: string = 'operation'
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  let lastError: unknown
  
  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      const result = await operation()
      
      if (attempt > 1) {
        console.log(`[RETRY] ${operationName} succeeded on attempt ${attempt}/${cfg.maxAttempts}`)
      }
      
      return result
    } catch (err) {
      lastError = err
      
      // Don't retry on last attempt
      if (attempt === cfg.maxAttempts) {
        console.error(`[RETRY] ${operationName} failed after ${cfg.maxAttempts} attempts:`, err)
        break
      }
      
      // Calculate delay with exponential backoff: 1s, 2s, 4s, 8s (capped at maxDelayMs)
      const delay = Math.min(
        cfg.initialDelayMs * Math.pow(cfg.backoffMultiplier, attempt - 1),
        cfg.maxDelayMs
      )
      
      console.warn(`[RETRY] ${operationName} attempt ${attempt}/${cfg.maxAttempts} failed, retrying in ${delay}ms:`, 
        (err as Error).message || err)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // All attempts failed
  if (lastError instanceof Error) {
    throw lastError
  }
  throw new Error(`${operationName} failed after ${cfg.maxAttempts} attempts`)
}

/**
 * Retry logic specifically for Perplexity API calls
 * Uses more aggressive retry strategy for rate limits and timeouts
 */
export async function withPerplexityRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'perplexity-operation'
): Promise<T> {
  return withRetryAndBackoff(
    operation,
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 8000,
      backoffMultiplier: 2
    },
    operationName
  )
}

