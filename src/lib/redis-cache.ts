// Enterprise Redis Cache Service
// Provides distributed caching with TTL, key patterns, and fallback

import Redis from 'ioredis'
import { Logger } from './logger'

const logger = Logger.getInstance('REDIS')

export class RedisCache {
  private static instance: RedisCache
  private client: Redis | null = null
  private isConnected: boolean = false
  private readonly defaultTTL = 3600 // 1 hour in seconds

  private constructor() {
    this.initialize()
  }

  static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache()
    }
    return RedisCache.instance
  }

  private initialize(): void {
    try {
      const redisUrl = process.env.REDIS_URL

      if (!redisUrl) {
        logger.warn('REDIS_URL not configured, caching will be disabled')
        return
      }

      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        reconnectOnError(err) {
          const targetError = 'READONLY'
          if (err.message.includes(targetError)) {
            return true
          }
          return false
        }
      })

      this.client.on('connect', () => {
        logger.info('Redis connected successfully')
        this.isConnected = true
      })

      this.client.on('error', (error) => {
        logger.error('Redis connection error', { error: error.message })
        this.isConnected = false
      })

      this.client.on('close', () => {
        logger.warn('Redis connection closed')
        this.isConnected = false
      })

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...')
      })

    } catch (error) {
      logger.error('Failed to initialize Redis', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null
    }

    try {
      const value = await this.client.get(key)
      
      if (!value) {
        return null
      }

      return JSON.parse(value) as T
    } catch (error) {
      logger.error('Redis GET error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  // Set value in cache with optional TTL
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      const serialized = JSON.stringify(value)
      const expiry = ttl || this.defaultTTL

      await this.client.setex(key, expiry, serialized)
      return true
    } catch (error) {
      logger.error('Redis SET error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  // Delete specific key
  async delete(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.del(key)
      return true
    } catch (error) {
      logger.error('Redis DELETE error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  // Delete keys by pattern
  async deletePattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      const keys = await this.client.keys(pattern)
      
      if (keys.length === 0) {
        return 0
      }

      await this.client.del(...keys)
      return keys.length
    } catch (error) {
      logger.error('Redis DELETE PATTERN error', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return 0
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Redis EXISTS error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  // Get remaining TTL for a key
  async ttl(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return -1
    }

    try {
      return await this.client.ttl(key)
    } catch (error) {
      logger.error('Redis TTL error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return -1
    }
  }

  // Increment a counter
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      return await this.client.incrby(key, amount)
    } catch (error) {
      logger.error('Redis INCREMENT error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return 0
    }
  }

  // Get multiple keys at once
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.client || !this.isConnected || keys.length === 0) {
      return keys.map(() => null)
    }

    try {
      const values = await this.client.mget(...keys)
      return values.map(v => v ? JSON.parse(v) as T : null)
    } catch (error) {
      logger.error('Redis MGET error', {
        keysCount: keys.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return keys.map(() => null)
    }
  }

  // Set multiple keys at once
  async mset(entries: Record<string, any>, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      const pipeline = this.client.pipeline()
      const expiry = ttl || this.defaultTTL

      for (const [key, value] of Object.entries(entries)) {
        const serialized = JSON.stringify(value)
        pipeline.setex(key, expiry, serialized)
      }

      await pipeline.exec()
      return true
    } catch (error) {
      logger.error('Redis MSET error', {
        keysCount: Object.keys(entries).length,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  // Clear all cache (use with caution!)
  async flush(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.flushdb()
      logger.warn('Redis cache flushed')
      return true
    } catch (error) {
      logger.error('Redis FLUSH error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    connected: boolean
    keys: number
    memory: string
    hitRate?: number
  }> {
    if (!this.client || !this.isConnected) {
      return {
        connected: false,
        keys: 0,
        memory: '0B'
      }
    }

    try {
      const info = await this.client.info('stats')
      const dbsize = await this.client.dbsize()
      const memory = await this.client.info('memory')

      // Parse memory usage
      const memoryMatch = memory.match(/used_memory_human:([^\r\n]+)/)
      const memoryUsed = memoryMatch ? memoryMatch[1] : 'Unknown'

      // Parse hit rate
      const hitsMatch = info.match(/keyspace_hits:(\d+)/)
      const missesMatch = info.match(/keyspace_misses:(\d+)/)
      
      let hitRate: number | undefined
      if (hitsMatch && missesMatch) {
        const hits = parseInt(hitsMatch[1])
        const misses = parseInt(missesMatch[1])
        const total = hits + misses
        hitRate = total > 0 ? (hits / total) * 100 : 0
      }

      return {
        connected: true,
        keys: dbsize,
        memory: memoryUsed,
        hitRate
      }
    } catch (error) {
      logger.error('Redis STATS error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return {
        connected: this.isConnected,
        keys: 0,
        memory: 'Unknown'
      }
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit()
        logger.info('Redis disconnected gracefully')
      } catch (error) {
        logger.error('Redis disconnect error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  // Check if Redis is available
  isAvailable(): boolean {
    return this.isConnected && this.client !== null
  }
}

// Cache key builders for consistency
export const CacheKeys = {
  resume: (userId: string, resumeId: string) => `resume:${userId}:${resumeId}`,
  resumeList: (userId: string) => `resume:list:${userId}`,
  jobApplication: (userId: string, appId: string) => `app:${userId}:${appId}`,
  jobApplicationList: (userId: string) => `app:list:${userId}`,
  companyResearch: (companyName: string) => `company:${companyName.toLowerCase().replace(/\s+/g, '-')}`,
  aiResponse: (hash: string) => `ai:${hash}`,
  userProfile: (userId: string) => `profile:${userId}`,
  jobSearch: (query: string) => `jobs:${query}`,
  
  // Pattern matchers for bulk operations
  patterns: {
    userResumes: (userId: string) => `resume:${userId}:*`,
    userApps: (userId: string) => `app:${userId}:*`,
    allCompanies: () => `company:*`,
    allAI: () => `ai:*`
  }
}

