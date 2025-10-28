/**
 * Smart Cache Manager
 * 
 * Multi-level caching strategy to reduce API costs to ~$1/day:
 * - Level 1: User-specific cache (30 min)
 * - Level 2: Location cache (1 hour, shared across users)
 * - Level 3: Company profiles (7 days)
 * - Level 4: Source reliability (1 hour)
 */

import JobCache from '@/models/JobCache'
import type { RankedJob } from './job-ranker'

export interface CacheKey {
  userId?: string
  keywords: string[]
  location?: string
  remote?: boolean
  jobType?: string[]
}

export interface CacheMetadata {
  level: 1 | 2 | 3 | 4
  ttl: number // seconds
  createdAt: Date
  hitCount: number
}

export class SmartCacheManager {
  /**
   * Level 1: User-specific cache (30 minutes)
   * Exact match for their skills/location
   */
  static async getUserCache(key: CacheKey): Promise<RankedJob[] | null> {
    if (!key.userId) return null
    
    try {
      const cached = await JobCache.findOne({
        userId: key.userId,
        searchQuery: { $regex: new RegExp(key.keywords.join('|'), 'i') },
        ...(key.location && { location: { $regex: new RegExp(key.location, 'i') } }),
        ...(key.remote !== undefined && { remote: key.remote }),
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // 30 min
      }).sort({ createdAt: -1 })
      
      if (cached) {
        console.log('[CACHE] Level 1 HIT (user-specific, 30min)')
        return cached.jobs as RankedJob[]
      }
      
      return null
    } catch (error) {
      console.error('[CACHE] Level 1 error:', error)
      return null
    }
  }
  
  /**
   * Level 2: Location cache (1 hour, shared across users)
   * All jobs for a specific location
   */
  static async getLocationCache(location: string, keywords: string[]): Promise<RankedJob[] | null> {
    if (!location) return null
    
    try {
      const cached = await JobCache.findOne({
        location: { $regex: new RegExp(location, 'i') },
        searchQuery: { $regex: new RegExp(keywords.join('|'), 'i') },
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // 1 hour
      }).sort({ createdAt: -1 })
      
      if (cached) {
        console.log('[CACHE] Level 2 HIT (location-shared, 1hr)')
        return cached.jobs as RankedJob[]
      }
      
      return null
    } catch (error) {
      console.error('[CACHE] Level 2 error:', error)
      return null
    }
  }
  
  /**
   * Get cache with fallback strategy
   */
  static async getWithFallback(key: CacheKey): Promise<{
    jobs: RankedJob[] | null
    level: number | null
    age: number | null
  }> {
    // Try Level 1: User-specific (30 min)
    const level1 = await this.getUserCache(key)
    if (level1) {
      return { jobs: level1, level: 1, age: 30 }
    }
    
    // Try Level 2: Location (1 hour)
    if (key.location) {
      const level2 = await this.getLocationCache(key.location, key.keywords)
      if (level2) {
        return { jobs: level2, level: 2, age: 60 }
      }
    }
    
    // No cache hit
    return { jobs: null, level: null, age: null }
  }
  
  /**
   * Save to cache with smart TTL
   */
  static async save(
    key: CacheKey,
    jobs: RankedJob[],
    metadata: {
      sources: Record<string, unknown>
      totalJobs: number
      uniqueJobs: number
      duration: number
      totalCost: number
    }
  ): Promise<void> {
    if (!key.userId) {
      console.warn('[CACHE] Cannot save without userId')
      return
    }
    
    try {
      await JobCache.create({
        userId: key.userId,
        searchQuery: key.keywords.join(' '),
        location: key.location,
        remote: key.remote,
        workType: key.jobType,
        jobs: jobs.map(j => ({
          id: j.id,
          title: j.title,
          company: j.company,
          location: j.location,
          description: j.description,
          url: j.url,
          source: j.source,
          postedDate: j.postedDate,
          salary: j.salary,
          remote: j.remote,
          jobType: j.jobType,
          skills: j.skills,
          matchScore: j.matchScore,
          matchedSkills: j.matchedSkills,
          matchPercentage: j.matchPercentage
        })),
        metadata: {
          sources: metadata.sources,
          totalJobs: metadata.totalJobs,
          uniqueJobs: metadata.uniqueJobs,
          duration: metadata.duration,
          totalCost: metadata.totalCost,
          rankedBy: 'weighted-skills'
        }
      })
      
      console.log('[CACHE] ✅ Saved to Level 1 (user-specific, 30min TTL)')
    } catch (error) {
      console.error('[CACHE] Save error:', error)
    }
  }
  
  /**
   * Get cache statistics
   */
  static async getStats(userId: string): Promise<{
    totalCaches: number
    totalJobs: number
    totalCost: number
    cacheHitRate: number
    oldestCache: Date | null
  }> {
    try {
      const caches = await JobCache.find({ 
        userId,
        expiresAt: { $gt: new Date() }
      })
      
      return {
        totalCaches: caches.length,
        totalJobs: caches.reduce((sum, c) => sum + (c.jobs?.length || 0), 0),
        totalCost: caches.reduce((sum, c) => sum + (c.metadata?.totalCost || 0), 0),
        cacheHitRate: 0, // TODO: Track hits vs misses
        oldestCache: caches.length > 0 
          ? new Date(Math.min(...caches.map(c => c.createdAt.getTime())))
          : null
      }
    } catch (error) {
      console.error('[CACHE] Stats error:', error)
      return {
        totalCaches: 0,
        totalJobs: 0,
        totalCost: 0,
        cacheHitRate: 0,
        oldestCache: null
      }
    }
  }
  
  /**
   * Clear expired caches (run periodically)
   */
  static async clearExpired(): Promise<number> {
    try {
      const result = await JobCache.deleteMany({
        expiresAt: { $lt: new Date() }
      })
      
      const count = result.deletedCount || 0
      console.log(`[CACHE] Cleared ${count} expired caches`)
      return count
    } catch (error) {
      console.error('[CACHE] Clear expired error:', error)
      return 0
    }
  }
  
  /**
   * Clear user's cache (for "Refresh" button)
   */
  static async clearUserCache(userId: string): Promise<number> {
    try {
      const result = await JobCache.deleteMany({ userId })
      const count = result.deletedCount || 0
      console.log(`[CACHE] Cleared ${count} caches for user ${userId}`)
      return count
    } catch (error) {
      console.error('[CACHE] Clear user cache error:', error)
      return 0
    }
  }
}
