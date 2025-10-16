/**
 * Database Retry Logic with Exponential Backoff
 * Prevents timeouts from breaking the application flow
 */

export interface RetryOptions {
  maxRetries?: number
  timeoutMs?: number
  initialDelayMs?: number
}

/**
 * Execute a database operation with retry logic and timeout
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    timeoutMs = 10000, // 10 seconds per attempt
    initialDelayMs = 1000
  } = options

  let attempt = 0
  let lastError: Error | null = null

  while (attempt < maxRetries) {
    try {
      // Wrap operation with timeout
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
        )
      ])

      console.log(`[DB_RETRY] ✅ Operation succeeded on attempt ${attempt + 1}`)
      return result

    } catch (error) {
      lastError = error as Error
      attempt++

      console.warn(`[DB_RETRY] ⚠️ Attempt ${attempt}/${maxRetries} failed:`, lastError.message)

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = initialDelayMs * Math.pow(2, attempt - 1)
        console.log(`[DB_RETRY] Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error(`[DB_RETRY] ❌ All ${maxRetries} attempts failed`)
  throw lastError || new Error('Database operation failed after retries')
}

/**
 * Execute a non-critical database operation
 * Returns null on failure instead of throwing
 */
export async function withRetryOptional<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T | null> {
  try {
    return await withRetry(operation, options)
  } catch (error) {
    console.warn('[DB_RETRY] Optional operation failed, returning null:', error)
    return null
  }
}
