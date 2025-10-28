/**
 * API Request Caching and Deduplication
 * 
 * Prevents duplicate API calls and provides in-memory caching
 * for frequently accessed data.
 */

// In-flight request tracking
const pendingRequests = new Map<string, Promise<unknown>>()

// In-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>()

interface CacheOptions {
  ttl?: number // Time to live in milliseconds (default: 5 minutes)
  dedupe?: boolean // Enable request deduplication (default: true)
}

/**
 * Cached fetch with request deduplication
 * 
 * @param key - Unique cache key
 * @param fetcher - Function that returns a Promise
 * @param options - Cache options
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 5 * 60 * 1000, dedupe = true } = options

  // Check cache first
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < ttl) {
    console.log(`[CACHE] Hit: ${key}`)
    return cached.data as T
  }

  // Check if request is already in-flight
  if (dedupe && pendingRequests.has(key)) {
    console.log(`[CACHE] Deduped: ${key}`)
    return pendingRequests.get(key)! as Promise<T>
  }

  // Make new request
  console.log(`[CACHE] Miss: ${key}`)
  const promise = fetcher()
    .then((data) => {
      // Store in cache
      cache.set(key, { data, timestamp: Date.now() })
      return data
    })
    .finally(() => {
      // Remove from pending
      pendingRequests.delete(key)
    })

  // Track pending request
  if (dedupe) {
    pendingRequests.set(key, promise)
  }

  return promise
}

/**
 * Clear cache for a specific key or all keys
 */
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key)
    console.log(`[CACHE] Cleared: ${key}`)
  } else {
    cache.clear()
    console.log('[CACHE] Cleared all')
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    pending: pendingRequests.size,
    keys: Array.from(cache.keys()),
  }
}

/**
 * Prefetch data and store in cache
 */
export async function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<void> {
  try {
    const data = await fetcher()
    cache.set(key, { data, timestamp: Date.now() })
    console.log(`[CACHE] Prefetched: ${key}`)
  } catch (error) {
    console.error(`[CACHE] Prefetch failed: ${key}`, error)
  }
}

/**
 * Batch multiple requests with deduplication
 */
export async function batchFetch<T>(
  requests: Array<{ key: string; fetcher: () => Promise<T> }>,
  options: CacheOptions = {}
): Promise<T[]> {
  return Promise.all(
    requests.map(({ key, fetcher }) => cachedFetch(key, fetcher, options))
  )
}
