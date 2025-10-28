/**
 * Job Aggregator Service
 * 
 * Main service that orchestrates:
 * 1. Source selection
 * 2. Multi-source querying
 * 3. Deduplication
 * 4. Weighted ranking
 * 5. Caching
 */

import { rapidAPIClient, type SearchParams, type QueryMetadata } from './rapidapi-client'
import { selectJobSources, estimateQueryCost, type UserProfile, type SearchPreferences } from './job-source-selector'
import { deduplicateJobs } from './job-deduplicator'
import { rankJobsByWeightedSkills, type RankedJob, type RankingParams } from './job-ranker'
import JobCache from '@/models/JobCache'

export interface AggregatorResult {
  jobs: RankedJob[]
  metadata: {
    query: QueryMetadata
    deduplication: {
      original: number
      unique: number
      removed: number
    }
    ranking: {
      averageMatch: number
      topMatch: number
      excellentMatches: number
    }
    caching: {
      cached: boolean
      cacheKey?: string
    }
    cost: number
    duration: number
  }
}

export class JobAggregatorService {
  /**
   * Search jobs across multiple sources with weighted ranking
   */
  static async searchJobs(params: {
    userId: string
    keywords: string[]
    location?: string
    remote?: boolean
    jobType?: string[]
    userProfile?: UserProfile
    searchPreferences?: SearchPreferences
    useCache?: boolean
  }): Promise<AggregatorResult> {
    const startTime = Date.now()
    
    console.log('[JOB_AGGREGATOR] Starting job search...')
    console.log('[JOB_AGGREGATOR] Keywords:', params.keywords)
    console.log('[JOB_AGGREGATOR] Location:', params.location)
    console.log('[JOB_AGGREGATOR] Remote:', params.remote)
    
    // STEP 1: Check cache
    if (params.useCache !== false) {
      const cached = await this.checkCache(params.userId, params.keywords.join(' '), params.location)
      if (cached) {
        console.log('[JOB_AGGREGATOR] ✅ Cache hit!')
        return cached
      }
    }
    
    // STEP 2: Select sources
    const sources = selectJobSources(params.userProfile, params.searchPreferences)
    const estimatedCost = estimateQueryCost(sources)
    
    console.log(`[JOB_AGGREGATOR] Selected ${sources.length} sources`)
    console.log(`[JOB_AGGREGATOR] Estimated cost: $${estimatedCost.toFixed(4)}`)
    
    // STEP 3: Query all sources in parallel
    const searchParams: SearchParams = {
      keywords: params.keywords,
      location: params.location,
      remote: params.remote,
      jobType: params.jobType
    }
    
    const { jobs: rawJobs, metadata: queryMetadata } = await rapidAPIClient.queryMultipleSources(
      sources,
      searchParams
    )
    
    console.log(`[JOB_AGGREGATOR] Fetched ${rawJobs.length} raw jobs`)
    
    // STEP 4: Deduplicate
    const uniqueJobs = deduplicateJobs(rawJobs)
    
    const deduplicationMetadata = {
      original: rawJobs.length,
      unique: uniqueJobs.length,
      removed: rawJobs.length - uniqueJobs.length
    }
    
    console.log(`[JOB_AGGREGATOR] Deduplicated to ${uniqueJobs.length} unique jobs`)
    
    // STEP 5: Rank by weighted skills
    let rankedJobs: RankedJob[] = uniqueJobs as RankedJob[]
    let rankingMetadata = {
      averageMatch: 0,
      topMatch: 0,
      excellentMatches: 0
    }
    
    if (params.userProfile?.skills?.weighted) {
      const { primarySkills = [], secondarySkills = [] } = params.userProfile.skills.weighted
      
      if (primarySkills.length > 0 || secondarySkills.length > 0) {
        const rankingParams: RankingParams = {
          primarySkills,
          secondarySkills,
          location: params.location,
          remote: params.remote
        }
        
        rankedJobs = rankJobsByWeightedSkills(uniqueJobs, rankingParams)
        
        rankingMetadata = {
          averageMatch: rankedJobs.reduce((sum, j) => sum + j.matchPercentage, 0) / rankedJobs.length,
          topMatch: rankedJobs[0]?.matchPercentage || 0,
          excellentMatches: rankedJobs.filter(j => j.matchPercentage >= 80).length
        }
        
        console.log(`[JOB_AGGREGATOR] Ranked jobs by weighted skills`)
        console.log(`[JOB_AGGREGATOR] Average match: ${rankingMetadata.averageMatch.toFixed(1)}%`)
      }
    }
    
    // STEP 6: Cache results
    const cacheKey = await this.cacheResults(
      params.userId,
      params.keywords.join(' '),
      params.location,
      params.remote,
      rankedJobs,
      queryMetadata,
      deduplicationMetadata
    )
    
    const totalDuration = Date.now() - startTime
    
    console.log(`[JOB_AGGREGATOR] ✅ Complete in ${totalDuration}ms`)
    console.log(`[JOB_AGGREGATOR] Cost: $${queryMetadata.totalCost.toFixed(4)}`)
    
    return {
      jobs: rankedJobs,
      metadata: {
        query: queryMetadata,
        deduplication: deduplicationMetadata,
        ranking: rankingMetadata,
        caching: {
          cached: false,
          cacheKey
        },
        cost: queryMetadata.totalCost,
        duration: totalDuration
      }
    }
  }
  
  /**
   * Check cache for existing results
   */
  private static async checkCache(
    userId: string,
    searchQuery: string,
    location?: string
  ): Promise<AggregatorResult | null> {
    try {
      const cached = await JobCache.findOne({
        userId,
        searchQuery: { $regex: new RegExp(searchQuery, 'i') },
        ...(location && { location: { $regex: new RegExp(location, 'i') } }),
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 })
      
      if (!cached) return null
      
      // Check if cache is still valid (< 24 hours)
      const age = Date.now() - cached.createdAt.getTime()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      
      if (age > maxAge) {
        console.log('[JOB_AGGREGATOR] Cache expired')
        return null
      }
      
      console.log(`[JOB_AGGREGATOR] Cache hit (${(age / 1000 / 60).toFixed(0)} minutes old)`)
      
      return {
        jobs: cached.jobs as RankedJob[],
        metadata: {
          query: cached.metadata.sources as unknown as QueryMetadata,
          deduplication: {
            original: cached.metadata.totalJobs,
            unique: cached.metadata.uniqueJobs,
            removed: cached.metadata.totalJobs - cached.metadata.uniqueJobs
          },
          ranking: {
            averageMatch: cached.jobs.reduce((sum, j) => sum + (j.matchPercentage || 0), 0) / cached.jobs.length,
            topMatch: cached.jobs[0]?.matchPercentage || 0,
            excellentMatches: cached.jobs.filter(j => (j.matchPercentage || 0) >= 80).length
          },
          caching: {
            cached: true
          },
          cost: cached.metadata.totalCost,
          duration: cached.metadata.duration
        }
      }
    } catch (error) {
      console.error('[JOB_AGGREGATOR] Cache check error:', error)
      return null
    }
  }
  
  /**
   * Cache search results
   */
  private static async cacheResults(
    userId: string,
    searchQuery: string,
    location: string | undefined,
    remote: boolean | undefined,
    jobs: RankedJob[],
    queryMetadata: QueryMetadata,
    deduplicationMetadata: { original: number; unique: number; removed: number }
  ): Promise<string | undefined> {
    try {
      const cache = await JobCache.create({
        userId,
        searchQuery,
        location,
        remote,
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
          sources: queryMetadata.sources,
          totalJobs: deduplicationMetadata.original,
          uniqueJobs: deduplicationMetadata.unique,
          duration: queryMetadata.duration,
          totalCost: queryMetadata.totalCost,
          rankedBy: 'weighted-skills'
        }
      })
      
      console.log('[JOB_AGGREGATOR] ✅ Results cached:', cache._id)
      
      return String(cache._id)
    } catch (error) {
      console.error('[JOB_AGGREGATOR] Cache save error:', error)
      return undefined
    }
  }
  
  /**
   * Clear expired caches (run periodically)
   */
  static async clearExpiredCaches(): Promise<number> {
    try {
      const result = await JobCache.deleteMany({
        expiresAt: { $lt: new Date() }
      })
      const count = result.deletedCount || 0
      console.log(`[JOB_AGGREGATOR] Cleared ${count} expired caches`)
      return count
    } catch (error) {
      console.error('[JOB_AGGREGATOR] Clear expired error:', error)
      return 0
    }
  }
}
