/**
 * API RATE LIMITER
 * 
 * Prevents API throttling with:
 * - Request queue
 * - Configurable rate limits
 * - Automatic retry with backoff
 * - Per-API tracking
 */

interface QueuedRequest<T> {
  fn: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
  retries: number
  maxRetries: number
}

export class APIRateLimiter {
  private queues = new Map<string, QueuedRequest<any>[]>()
  private processing = new Map<string, boolean>()
  private lastRequest = new Map<string, number>()
  private requestCounts = new Map<string, number>()
  private windowStart = new Map<string, number>()

  constructor(
    private defaultRateLimit: number = 10, // requests per window
    private defaultWindow: number = 60000, // 1 minute
    private defaultDelay: number = 100 // ms between requests
  ) {}

  /**
   * Execute API request with rate limiting
   */
  async execute<T>(
    apiKey: string,
    fn: () => Promise<T>,
    options?: {
      rateLimit?: number
      window?: number
      delay?: number
      maxRetries?: number
    }
  ): Promise<T> {
    const rateLimit = options?.rateLimit || this.defaultRateLimit
    const window = options?.window || this.defaultWindow
    const delay = options?.delay || this.defaultDelay
    const maxRetries = options?.maxRetries || 3

    return new Promise((resolve, reject) => {
      // Add to queue
      if (!this.queues.has(apiKey)) {
        this.queues.set(apiKey, [])
      }

      this.queues.get(apiKey)!.push({
        fn,
        resolve,
        reject,
        retries: 0,
        maxRetries
      })

      // Start processing if not already
      if (!this.processing.get(apiKey)) {
        this.processQueue(apiKey, rateLimit, window, delay)
      }
    })
  }

  /**
   * Process queued requests
   */
  private async processQueue(
    apiKey: string,
    rateLimit: number,
    window: number,
    delay: number
  ): Promise<void> {
    this.processing.set(apiKey, true)
    const queue = this.queues.get(apiKey)!

    while (queue.length > 0) {
      // Check rate limit
      const now = Date.now()
      const windowStartTime = this.windowStart.get(apiKey) || now
      const requestCount = this.requestCounts.get(apiKey) || 0

      // Reset window if expired
      if (now - windowStartTime >= window) {
        this.windowStart.set(apiKey, now)
        this.requestCounts.set(apiKey, 0)
      }

      // Wait if rate limit exceeded
      if (requestCount >= rateLimit) {
        const waitTime = window - (now - windowStartTime)
        console.log(`[RATE_LIMITER] ${apiKey}: Rate limit reached, waiting ${waitTime}ms`)
        await this.sleep(waitTime)
        this.windowStart.set(apiKey, Date.now())
        this.requestCounts.set(apiKey, 0)
        continue
      }

      // Enforce delay between requests
      const lastReq = this.lastRequest.get(apiKey) || 0
      const timeSinceLastReq = now - lastReq
      if (timeSinceLastReq < delay) {
        await this.sleep(delay - timeSinceLastReq)
      }

      // Execute request
      const request = queue.shift()!
      this.lastRequest.set(apiKey, Date.now())
      this.requestCounts.set(apiKey, requestCount + 1)

      try {
        const result = await request.fn()
        request.resolve(result)
      } catch (error) {
        // Retry logic
        if (request.retries < request.maxRetries) {
          request.retries++
          const backoffDelay = Math.min(1000 * Math.pow(2, request.retries), 10000)
          console.log(`[RATE_LIMITER] ${apiKey}: Retry ${request.retries}/${request.maxRetries} after ${backoffDelay}ms`)
          await this.sleep(backoffDelay)
          queue.unshift(request) // Re-add to front of queue
        } else {
          request.reject(error as Error)
        }
      }
    }

    this.processing.set(apiKey, false)
  }

  /**
   * Get queue stats
   */
  getStats(apiKey: string): {
    queueLength: number
    requestCount: number
    processing: boolean
  } {
    return {
      queueLength: this.queues.get(apiKey)?.length || 0,
      requestCount: this.requestCounts.get(apiKey) || 0,
      processing: this.processing.get(apiKey) || false
    }
  }

  /**
   * Clear queue for specific API
   */
  clearQueue(apiKey: string): void {
    this.queues.delete(apiKey)
    this.processing.delete(apiKey)
    this.lastRequest.delete(apiKey)
    this.requestCounts.delete(apiKey)
    this.windowStart.delete(apiKey)
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
let rateLimiterInstance: APIRateLimiter | null = null

export function getRateLimiter(): APIRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new APIRateLimiter()
  }
  return rateLimiterInstance
}

export default getRateLimiter
