/**
 * Progressive Job Aggregator
 * 
 * Shows results progressively instead of waiting for all sources:
 * - 0.5s: Google Jobs (520ms) - INSTANT
 * - +1s: Active Jobs DB (851ms)
 * - +2s: LinkedIn + Jobs API (1796ms, 1892ms)
 * - +3s: JSearch (3425ms)
 * 
 * User sees jobs immediately, then more trickle in!
 */

import { rapidAPIClient, type Job, type SearchParams } from './rapidapi-client'
import { deduplicateJobs } from './job-deduplicator'
import { rankJobsByWeightedSkills, type RankedJob, type RankingParams } from './job-ranker'
import type { UserProfile, SearchPreferences } from './job-source-selector'

export interface ProgressiveResult {
  jobs: RankedJob[]
  wave: number // Which wave of results (1, 2, 3, 4)
  totalJobs: number
  sources: string[]
  duration: number
  isComplete: boolean
}

export type ProgressCallback = (result: ProgressiveResult) => void

export class ProgressiveJobAggregator {
  /**
   * Search jobs progressively - call callback as results come in
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
    onProgress: ProgressCallback
  ): Promise<void> {
    const startTime = Date.now()
    let allJobs: Job[] = []
    let wave = 0
    
    console.log('[PROGRESSIVE] Starting progressive search...')
    
    // Get ranking params once
    const rankingParams: RankingParams | null = params.userProfile?.skills?.weighted
      ? {
          primarySkills: params.userProfile.skills.weighted.primarySkills || [],
          secondarySkills: params.userProfile.skills.weighted.secondarySkills || [],
          location: params.location,
          remote: params.remote,
          salaryMin: params.salaryMin
        }
      : null
    
    const searchParams: SearchParams = {
      keywords: params.keywords,
      location: params.location,
      remote: params.remote,
      jobType: params.jobType
    }
    
    // WAVE 1: Ultra-fast (Google Jobs - 520ms)
    try {
      wave++
      console.log('[PROGRESSIVE] Wave 1: Querying Google Jobs...')
      
      const { jobs: wave1Jobs } = await rapidAPIClient.queryMultipleSources(
        ['google-jobs'],
        searchParams
      )
      
      allJobs = [...allJobs, ...wave1Jobs]
      const dedupedJobs = deduplicateJobs(allJobs)
      const rankedJobs = rankingParams 
        ? rankJobsByWeightedSkills(dedupedJobs, rankingParams)
        : dedupedJobs as RankedJob[]
      
      onProgress({
        jobs: rankedJobs,
        wave: 1,
        totalJobs: rankedJobs.length,
        sources: ['google-jobs'],
        duration: Date.now() - startTime,
        isComplete: false
      })
      
      console.log(`[PROGRESSIVE] Wave 1 complete: ${rankedJobs.length} jobs in ${Date.now() - startTime}ms`)
    } catch (error) {
      console.error('[PROGRESSIVE] Wave 1 error:', error)
    }
    
    // WAVE 2: Fast (Active Jobs DB - 851ms)
    try {
      wave++
      console.log('[PROGRESSIVE] Wave 2: Querying Active Jobs DB...')
      
      const { jobs: wave2Jobs } = await rapidAPIClient.queryMultipleSources(
        ['active-jobs-db'],
        searchParams
      )
      
      allJobs = [...allJobs, ...wave2Jobs]
      const dedupedJobs = deduplicateJobs(allJobs)
      const rankedJobs = rankingParams 
        ? rankJobsByWeightedSkills(dedupedJobs, rankingParams)
        : dedupedJobs as RankedJob[]
      
      onProgress({
        jobs: rankedJobs,
        wave: 2,
        totalJobs: rankedJobs.length,
        sources: ['google-jobs', 'active-jobs-db'],
        duration: Date.now() - startTime,
        isComplete: false
      })
      
      console.log(`[PROGRESSIVE] Wave 2 complete: ${rankedJobs.length} jobs in ${Date.now() - startTime}ms`)
    } catch (error) {
      console.error('[PROGRESSIVE] Wave 2 error:', error)
    }
    
    // WAVE 3: Medium (LinkedIn + Jobs API - ~1800ms)
    try {
      wave++
      console.log('[PROGRESSIVE] Wave 3: Querying LinkedIn + Jobs API...')
      
      const { jobs: wave3Jobs } = await rapidAPIClient.queryMultipleSources(
        ['linkedin-jobs', 'jobs-api'],
        searchParams
      )
      
      allJobs = [...allJobs, ...wave3Jobs]
      const dedupedJobs = deduplicateJobs(allJobs)
      const rankedJobs = rankingParams 
        ? rankJobsByWeightedSkills(dedupedJobs, rankingParams)
        : dedupedJobs as RankedJob[]
      
      onProgress({
        jobs: rankedJobs,
        wave: 3,
        totalJobs: rankedJobs.length,
        sources: ['google-jobs', 'active-jobs-db', 'linkedin-jobs', 'jobs-api'],
        duration: Date.now() - startTime,
        isComplete: false
      })
      
      console.log(`[PROGRESSIVE] Wave 3 complete: ${rankedJobs.length} jobs in ${Date.now() - startTime}ms`)
    } catch (error) {
      console.error('[PROGRESSIVE] Wave 3 error:', error)
    }
    
    // WAVE 4: Slow (JSearch + conditional sources - 3425ms+)
    try {
      wave++
      console.log('[PROGRESSIVE] Wave 4: Querying JSearch + conditional sources...')
      
      const sources = ['jsearch']
      
      // Add conditional sources
      if (params.remote) {
        sources.push('remote-jobs')
      }
      
      if (params.searchPreferences?.includeFreelance) {
        sources.push('freelancer')
      }
      
      const { jobs: wave4Jobs } = await rapidAPIClient.queryMultipleSources(
        sources,
        searchParams
      )
      
      allJobs = [...allJobs, ...wave4Jobs]
      const dedupedJobs = deduplicateJobs(allJobs)
      const rankedJobs = rankingParams 
        ? rankJobsByWeightedSkills(dedupedJobs, rankingParams)
        : dedupedJobs as RankedJob[]
      
      onProgress({
        jobs: rankedJobs,
        wave: 4,
        totalJobs: rankedJobs.length,
        sources: ['google-jobs', 'active-jobs-db', 'linkedin-jobs', 'jobs-api', ...sources],
        duration: Date.now() - startTime,
        isComplete: true
      })
      
      console.log(`[PROGRESSIVE] Wave 4 complete: ${rankedJobs.length} jobs in ${Date.now() - startTime}ms`)
      console.log('[PROGRESSIVE] ✅ All waves complete!')
    } catch (error) {
      console.error('[PROGRESSIVE] Wave 4 error:', error)
      
      // Mark as complete even if wave 4 fails
      const dedupedJobs = deduplicateJobs(allJobs)
      const rankedJobs = rankingParams 
        ? rankJobsByWeightedSkills(dedupedJobs, rankingParams)
        : dedupedJobs as RankedJob[]
      
      onProgress({
        jobs: rankedJobs,
        wave: 4,
        totalJobs: rankedJobs.length,
        sources: ['google-jobs', 'active-jobs-db', 'linkedin-jobs', 'jobs-api'],
        duration: Date.now() - startTime,
        isComplete: true
      })
    }
  }
  
  /**
   * Search with fallback to Indeed if primary sources return < 10 jobs
   */
  static async searchWithFallback(
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
    onProgress: ProgressCallback
  ): Promise<void> {
    let finalJobCount = 0
    let allJobs: RankedJob[] = []
    
    // Wrap the progress callback to track job count and accumulate jobs
    const wrappedCallback: ProgressCallback = (result) => {
      finalJobCount = result.totalJobs
      allJobs = result.jobs
      onProgress(result)
    }
    
    // Run progressive search
    await this.searchProgressive(params, wrappedCallback)
    
    // FALLBACK: If we got < 10 jobs, try Indeed (slow but comprehensive)
    if (finalJobCount < 10) {
      console.log('[PROGRESSIVE] ⚠️ Only got', finalJobCount, 'jobs, trying Indeed fallback...')
      
      try {
        const searchParams: SearchParams = {
          keywords: params.keywords,
          location: params.location,
          remote: params.remote,
          jobType: params.jobType
        }
        
        const { jobs: indeedJobs } = await rapidAPIClient.queryMultipleSources(
          ['indeed'],
          searchParams
        )
        
        if (indeedJobs.length > 0) {
          console.log(`[PROGRESSIVE] Indeed fallback added ${indeedJobs.length} jobs`)
          
          // Merge with existing jobs and deduplicate
          const combinedJobs = [...allJobs, ...indeedJobs]
          const dedupedJobs = deduplicateJobs(combinedJobs)
          
          // Trigger one more progress update with Indeed results
          const rankingParams: RankingParams | null = params.userProfile?.skills?.weighted
            ? {
                primarySkills: params.userProfile.skills.weighted.primarySkills || [],
                secondarySkills: params.userProfile.skills.weighted.secondarySkills || [],
                location: params.location,
                remote: params.remote,
                salaryMin: params.salaryMin
              }
            : null
          
          const rankedJobs = rankingParams 
            ? rankJobsByWeightedSkills(dedupedJobs, rankingParams)
            : dedupedJobs as RankedJob[]
          
          onProgress({
            jobs: rankedJobs,
            wave: 5,
            totalJobs: rankedJobs.length,
            sources: ['indeed'],
            duration: 0,
            isComplete: true
          })
        }
      } catch (error) {
        console.error('[PROGRESSIVE] Indeed fallback error:', error)
      }
    }
  }
}
