/**
 * Performance Optimization Utilities
 * Fixes ISSUE #9: Slow performance
 */

/**
 * Debounce function calls to prevent excessive API requests
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function calls to limit execution rate
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Simple in-memory cache with TTL
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  get<T>(key: string, ttlMs = 300000): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      return null
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > ttlMs) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  has(key: string, ttlMs = 300000): boolean {
    return this.get(key, ttlMs) !== null
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  delete(key: string): void {
    this.cache.delete(key)
  }
}

export const apiCache = new SimpleCache()

/**
 * Cached fetch wrapper
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheTtlMs = 300000
): Promise<T> {
  const cacheKey = `${url}::${JSON.stringify(options.body || '')}`
  
  // Check cache
  const cached = apiCache.get<T>(cacheKey, cacheTtlMs)
  if (cached) {
    console.log('[CACHE] HIT:', url)
    return cached
  }
  
  // Fetch from API
  console.log('[CACHE] MISS:', url)
  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  const data = await response.json() as T
  
  // Cache result
  apiCache.set(cacheKey, data)
  
  return data
}

/**
 * Batch processor for API calls
 */
export class BatchProcessor<T> {
  private queue: Array<() => Promise<T>> = []
  private processing = false
  private batchSize: number
  private delayMs: number
  
  constructor(batchSize = 3, delayMs = 2000) {
    this.batchSize = batchSize
    this.delayMs = delayMs
  }
  
  add(operation: () => Promise<T>): void {
    this.queue.push(operation)
    
    if (!this.processing) {
      this.process()
    }
  }
  
  private async process(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false
      return
    }
    
    this.processing = true
    
    // Process batch
    const batch = this.queue.splice(0, this.batchSize)
    
    console.log(`[BATCH] Processing ${batch.length} operations`)
    
    try {
      await Promise.all(batch.map(op => op().catch(err => {
        console.error('[BATCH] Operation failed:', err)
        return null
      })))
    } catch (error) {
      console.error('[BATCH] Batch error:', error)
    }
    
    // Wait before next batch
    if (this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs))
      this.process()
    } else {
      this.processing = false
    }
  }
  
  clear(): void {
    this.queue = []
    this.processing = false
  }
  
  get queueLength(): number {
    return this.queue.length
  }
}
