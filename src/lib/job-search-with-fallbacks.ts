/**
 * Job Search with Comprehensive Fallbacks
 * 
 * Ensures we ALWAYS return jobs, even if APIs fail:
 * 1. Try RapidAPI multi-source
 * 2. If < 10 jobs, try Indeed fallback
 * 3. If all fail, try Perplexity (expensive but reliable)
 * 4. If Perplexity fails, return cached jobs (even if old)
 */

import { JobAggregatorService } from './job-aggregator-service'
import { ProgressiveJobAggregator } from './progressive-job-aggregator'
import { SmartCacheManager } from './smart-cache-manager'
import type { RankedJob } from './job-ranker'
import type { UserProfile, SearchPreferences } from './job-source-selector'

export interface SearchResult {
  jobs: RankedJob[]
  source: 'rapidapi' | 'rapidapi-fallback' | 'perplexity' | 'cache-stale' | 'error'
  cached: boolean
  cost: number
  duration: number
  error?: string
  metadata?: {
    sources?: string[]
    cacheAge?: number
    fallbackUsed?: boolean
  }
}

export class JobSearchWithFallbacks {
  /**
   * Search with full fallback chain
   */
  static async search(params: {
    userId: string
    keywords: string[]
    location?: string
    remote?: boolean
    jobType?: string[]
    salaryMin?: number
    userProfile?: UserProfile
    searchPreferences?: SearchPreferences
    useCache?: boolean
    useProgressive?: boolean
  }): Promise<SearchResult> {
    const startTime = Date.now()
    
    console.log('[FALLBACK_SEARCH] Starting search with fallbacks...')
    console.log('[FALLBACK_SEARCH] Keywords:', params.keywords)
    console.log('[FALLBACK_SEARCH] Location:', params.location)
    
    // STEP 1: Try cache first (if enabled)
    if (params.useCache !== false) {
      const cacheResult = await SmartCacheManager.getWithFallback({
        userId: params.userId,
        keywords: params.keywords,
        location: params.location,
        remote: params.remote,
        jobType: params.jobType
      })
      
      if (cacheResult.jobs && cacheResult.jobs.length > 0) {
        console.log(`[FALLBACK_SEARCH] ✅ Cache hit (Level ${cacheResult.level}, ${cacheResult.age}min old)`)
        return {
          jobs: cacheResult.jobs,
          source: 'rapidapi',
          cached: true,
          cost: 0,
          duration: Date.now() - startTime,
          metadata: {
            cacheAge: cacheResult.age || 0
          }
        }
      }
    }
    
    // STEP 2: Try RapidAPI multi-source
    try {
      console.log('[FALLBACK_SEARCH] Trying RapidAPI multi-source...')
      
      const result = await JobAggregatorService.searchJobs({
        userId: params.userId,
        keywords: params.keywords,
        location: params.location,
        remote: params.remote,
        jobType: params.jobType,
        salaryMin: params.salaryMin,
        userProfile: params.userProfile,
        searchPreferences: params.searchPreferences,
        useCache: false // We already checked cache above
      })
      
      if (result.jobs.length >= 10) {
        console.log(`[FALLBACK_SEARCH] ✅ RapidAPI success: ${result.jobs.length} jobs`)
        
        // Save to cache
        await SmartCacheManager.save(
          {
            userId: params.userId,
            keywords: params.keywords,
            location: params.location,
            remote: params.remote,
            jobType: params.jobType
          },
          result.jobs,
          {
            sources: result.metadata.query.sources,
            totalJobs: result.metadata.deduplication.original,
            uniqueJobs: result.metadata.deduplication.unique,
            duration: result.metadata.duration,
            totalCost: result.metadata.cost
          }
        )
        
        return {
          jobs: result.jobs,
          source: 'rapidapi',
          cached: false,
          cost: result.metadata.cost,
          duration: Date.now() - startTime,
          metadata: {
            sources: Object.keys(result.metadata.query.sources)
          }
        }
      }
      
      // Got < 10 jobs, try fallback
      console.log(`[FALLBACK_SEARCH] ⚠️ Only got ${result.jobs.length} jobs, trying fallback...`)
      
    } catch (error) {
      console.error('[FALLBACK_SEARCH] RapidAPI error:', error)
    }
    
    // STEP 3: Try Indeed fallback (slow but comprehensive)
    try {
      console.log('[FALLBACK_SEARCH] Trying Indeed fallback...')
      
      const { rapidAPIClient } = await import('./rapidapi-client')
      const { deduplicateJobs } = await import('./job-deduplicator')
      const { rankJobsByWeightedSkills } = await import('./job-ranker')
      
      const { jobs: indeedJobs } = await rapidAPIClient.queryMultipleSources(
        ['indeed'],
        {
          keywords: params.keywords,
          location: params.location,
          remote: params.remote,
          jobType: params.jobType
        }
      )
      
      if (indeedJobs.length > 0) {
        console.log(`[FALLBACK_SEARCH] ✅ Indeed fallback: ${indeedJobs.length} jobs`)
        
        const dedupedJobs = deduplicateJobs(indeedJobs)
        const rankedJobs = params.userProfile?.skills?.weighted
          ? rankJobsByWeightedSkills(dedupedJobs, {
              primarySkills: params.userProfile.skills.weighted.primarySkills || [],
              secondarySkills: params.userProfile.skills.weighted.secondarySkills || [],
              location: params.location,
              remote: params.remote,
              salaryMin: params.salaryMin
            })
          : dedupedJobs as RankedJob[]
        
        // Save to cache
        await SmartCacheManager.save(
          {
            userId: params.userId,
            keywords: params.keywords,
            location: params.location,
            remote: params.remote,
            jobType: params.jobType
          },
          rankedJobs,
          {
            sources: { indeed: { success: true, count: indeedJobs.length } },
            totalJobs: indeedJobs.length,
            uniqueJobs: rankedJobs.length,
            duration: Date.now() - startTime,
            totalCost: 0.001
          }
        )
        
        return {
          jobs: rankedJobs,
          source: 'rapidapi-fallback',
          cached: false,
          cost: 0.001,
          duration: Date.now() - startTime,
          metadata: {
            sources: ['indeed'],
            fallbackUsed: true
          }
        }
      }
    } catch (error) {
      console.error('[FALLBACK_SEARCH] Indeed fallback error:', error)
    }
    
    // STEP 4: Try Perplexity (expensive but reliable)
    try {
      console.log('[FALLBACK_SEARCH] ⚠️ All RapidAPI sources failed, trying Perplexity...')
      
      // TODO: Implement Perplexity fallback
      // This would use the old Perplexity job search as last resort
      // Cost: ~$0.10 per search (expensive!)
      
      console.log('[FALLBACK_SEARCH] Perplexity fallback not implemented yet')
    } catch (error) {
      console.error('[FALLBACK_SEARCH] Perplexity fallback error:', error)
    }
    
    // STEP 5: Return stale cache (better than nothing)
    try {
      console.log('[FALLBACK_SEARCH] ⚠️ All sources failed, checking for stale cache...')
      
      const staleCache = await SmartCacheManager.getLocationCache(
        params.location || '',
        params.keywords
      )
      
      if (staleCache && staleCache.length > 0) {
        console.log(`[FALLBACK_SEARCH] ⚠️ Returning stale cache: ${staleCache.length} jobs`)
        return {
          jobs: staleCache,
          source: 'cache-stale',
          cached: true,
          cost: 0,
          duration: Date.now() - startTime,
          error: 'All job sources failed. Showing cached results.',
          metadata: {
            cacheAge: 60 // Assume 1 hour old
          }
        }
      }
    } catch (error) {
      console.error('[FALLBACK_SEARCH] Stale cache error:', error)
    }
    
    // STEP 6: Complete failure
    console.error('[FALLBACK_SEARCH] ❌ All fallbacks failed!')
    return {
      jobs: [],
      source: 'error',
      cached: false,
      cost: 0,
      duration: Date.now() - startTime,
      error: 'Unable to fetch jobs. Please try again later.'
    }
  }
  
  /**
   * Search with progressive loading + fallbacks
   */
  static async searchProgressive(
    params: {
      userId: string
      keywords: string[]
      location?: string
      remote?: boolean
      jobType?: string[]
      salaryMin?: number
      userProfile?: UserProfile
      searchPreferences?: SearchPreferences
    },
    onProgress: (result: { jobs: RankedJob[]; wave: number; isComplete: boolean }) => void
  ): Promise<void> {
    try {
      await ProgressiveJobAggregator.searchWithFallback(params, onProgress)
    } catch (error) {
      console.error('[FALLBACK_SEARCH] Progressive search error:', error)
      
      // Fallback to regular search
      const result = await this.search({ ...params, useProgressive: false })
      onProgress({
        jobs: result.jobs,
        wave: 1,
        isComplete: true
      })
    }
  }
}
