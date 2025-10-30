/**
 * Job Aggregator with Multi-Layer Caching
 * 
 * Strategy:
 * 1. Check Redis cache (instant)
 * 2. Check MongoDB JobSearchCache (fast)
 * 3. Try Perplexity sonar-pro (costs money)
 * 4. Try Puppeteer scrapers (free, slower)
 * 5. Cache all results for future users
 */

import { RedisCache } from './redis-cache'
import JobSearchCache, { IJobSearchCache } from '@/models/JobSearchCache'
import { getJobScraper, JobListing } from './job-scraper-service'
import { PerplexityIntelligenceService } from './perplexity-intelligence'
import { getAdzunaClient } from './adzuna-api-client'
import { getJSearchClient } from './jsearch-api-client'

const redis = RedisCache.getInstance()
const adzuna = getAdzunaClient()
const jsearch = getJSearchClient()

export interface JobSearchParams {
  keywords: string[]
  location: string
  radiusKm?: number
  workType?: 'remote' | 'hybrid' | 'onsite' | 'any'
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
  maxResults?: number
}

export interface JobSearchResult {
  jobs: JobListing[]
  source: 'redis' | 'mongodb' | 'supabase' | 'adzuna' | 'jsearch' | 'perplexity' | 'scraper' | 'hybrid'
  cached: boolean
  timestamp: Date
  searchCount?: number
}

export class JobAggregator {
  private static instance: JobAggregator

  static getInstance(): JobAggregator {
    if (!JobAggregator.instance) {
      JobAggregator.instance = new JobAggregator()
    }
    return JobAggregator.instance
  }

  /**
   * Generate cache key from search params
   */
  private generateCacheKey(params: JobSearchParams): string {
    const normalizedKeywords = params.keywords
      .map(k => k.toLowerCase().trim())
      .sort()
      .join(',')
    
    return `jobs:${normalizedKeywords}:${params.location.toLowerCase()}:${params.workType || 'any'}:${params.radiusKm || 70}`
  }

  /**
   * Search jobs with multi-layer caching
   */
  async searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
    const {
      keywords,
      location,
      radiusKm = 70,
      workType = 'any',
      experienceLevel,
      maxResults = 100
    } = params

    console.log('[JOB_AGGREGATOR] Starting job search:', {
      keywords: keywords.slice(0, 5),
      location,
      radiusKm,
      maxResults
    })

    // LAYER 1: Check Redis cache (instant)
    const redisKey = this.generateCacheKey(params)
    const redisResult = await redis.get<JobListing[]>(redisKey)
    
    if (redisResult && redisResult.length > 0) {
      console.log(`[JOB_AGGREGATOR] ✅ Redis cache HIT: ${redisResult.length} jobs`)
      return {
        jobs: redisResult.slice(0, maxResults),
        source: 'redis',
        cached: true,
        timestamp: new Date()
      }
    }

    console.log('[JOB_AGGREGATOR] Redis cache MISS')

    // LAYER 2: Check MongoDB JobSearchCache (fast)
    const mongoResult = await this.searchMongoCache(keywords, location, workType)
    
    if (mongoResult && mongoResult.jobs.length > 0) {
      console.log(`[JOB_AGGREGATOR] ✅ MongoDB cache HIT: ${mongoResult.jobs.length} jobs`)
      
      // Convert to JobListing format
      const jobs: JobListing[] = mongoResult.jobs.map(job => ({
        jobId: job.jobId,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description || 'No description available',
        url: job.url,
        source: job.source,
        salary: job.salary,
        postedDate: job.postedDate,
        workType: (job.workType as 'remote' | 'hybrid' | 'onsite') || 'onsite',
        skillMatchScore: job.skillMatchScore,
        skills: []
      }))

      // Cache in Redis for next time
      await redis.set(redisKey, jobs, 3600) // 1 hour

      // Update search count
      mongoResult.searchCount += 1
      mongoResult.lastSearched = new Date()
      await mongoResult.save()

      return {
        jobs: jobs.slice(0, maxResults),
        source: 'mongodb',
        cached: true,
        timestamp: new Date(),
        searchCount: mongoResult.searchCount
      }
    }

    console.log('[JOB_AGGREGATOR] MongoDB cache MISS')

    // LAYER 3: Search Supabase (1,249 jobs available!) - Use ALL keywords
    console.log('[JOB_AGGREGATOR] Searching Supabase with ALL keywords...')
    let allJobs: JobListing[] = []
    let source: 'supabase' | 'scraper' | 'perplexity' | 'hybrid' = 'supabase'

    try {
      const { searchJobs } = await import('./supabase')
      const supabaseResult = await searchJobs({
        query: keywords.join(' '), // ALL keywords for cache search
        location,
        limit: maxResults
      })

      if (supabaseResult.jobs.length > 0) {
        console.log(`[JOB_AGGREGATOR] ✅ Supabase found ${supabaseResult.jobs.length} jobs`)
        
        // Convert Supabase jobs to JobListing format
        allJobs = supabaseResult.jobs.map(job => ({
          jobId: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description || 'No description available',
          url: job.url,
          source: job.source,
          salary: job.salary_min && job.salary_max ? `$${job.salary_min} - $${job.salary_max}` : undefined,
          postedDate: job.scraped_at ? new Date(job.scraped_at) : undefined,
          workType: (job.remote_type as 'remote' | 'hybrid' | 'onsite') || 'onsite',
          skillMatchScore: 0,
          skills: []
        }))

        // If we got >= 10 jobs from Supabase, cache and return immediately
        if (allJobs.length >= 10) {
          console.log(`[JOB_AGGREGATOR] ✅ Supabase returned ${allJobs.length} jobs (>= 10), skipping fallbacks`)
          await redis.set(redisKey, allJobs, 3600)
          
          return {
            jobs: allJobs.slice(0, maxResults),
            source: 'supabase',
            cached: false,
            timestamp: new Date()
          }
        }
      }
    } catch (error) {
      console.error('[JOB_AGGREGATOR] Supabase search failed:', error)
    }

    console.log(`[JOB_AGGREGATOR] Supabase returned ${allJobs.length} jobs (< 10), triggering fallbacks...`)

    // LAYER 4: If < 10 jobs, use Cheerio/Puppeteer scrapers with TOP 3 keywords
    if (allJobs.length < 10) {
      console.log('[JOB_AGGREGATOR] Using Cheerio/Puppeteer scrapers with TOP 3 keywords...')
      source = 'scraper'
      
      try {
        const top3Keywords = keywords.slice(0, 3)
        console.log(`[JOB_AGGREGATOR] Scraping with keywords: ${top3Keywords.join(', ')}`)
        
        const scrapedJobs = await this.searchWithScrapers(
          top3Keywords, // TOP 3 keywords only
          location,
          10 // Target 10 jobs per keyword = 30 total
        )

        if (scrapedJobs.length > 0) {
          console.log(`[JOB_AGGREGATOR] ✅ Scrapers found ${scrapedJobs.length} jobs`)
          allJobs = [...allJobs, ...scrapedJobs]
          source = allJobs.length > scrapedJobs.length ? 'hybrid' : 'scraper'
        }
      } catch (error) {
        console.error('[JOB_AGGREGATOR] Scrapers failed:', error)
      }
    }

    // LAYER 5: If STILL < 10 jobs, use Perplexity as LAST RESORT with TOP 3 keywords
    if (allJobs.length < 10) {
      console.log('[JOB_AGGREGATOR] Still < 10 jobs, using Perplexity as last resort with TOP 3 keywords...')
      source = 'perplexity'
      
      try {
        const top3Keywords = keywords.slice(0, 3)
        console.log(`[JOB_AGGREGATOR] Perplexity with keywords: ${top3Keywords.join(', ')}`)
        
        const perplexityJobs = await this.searchWithPerplexity(
          top3Keywords, // TOP 3 keywords only
          location,
          10 // Target 10 jobs
        )

        if (perplexityJobs.length > 0) {
          console.log(`[JOB_AGGREGATOR] ✅ Perplexity found ${perplexityJobs.length} jobs`)
          allJobs = [...allJobs, ...perplexityJobs]
          source = allJobs.length > perplexityJobs.length ? 'hybrid' : 'perplexity'
        }
      } catch (error) {
        console.error('[JOB_AGGREGATOR] Perplexity failed:', error)
      }
    }

    // Deduplicate by URL
    const uniqueJobs = Array.from(
      new Map(allJobs.map(job => [job.url, job])).values()
    )

    console.log(`[JOB_AGGREGATOR] Total unique jobs after deduplication: ${uniqueJobs.length}`)

    // LAYER 6: Cache results for future users
    if (uniqueJobs.length > 0) {
      await redis.set(redisKey, uniqueJobs, 3600)
      console.log(`[JOB_AGGREGATOR] ✅ Cached ${uniqueJobs.length} jobs in Redis`)
    }

    return {
      jobs: uniqueJobs.slice(0, maxResults),
      source,
      cached: false,
      timestamp: new Date()
    }
  }

  /**
   * Search MongoDB cache
   */
  private async searchMongoCache(
    keywords: string[],
    location: string,
    workType?: string
  ): Promise<IJobSearchCache | null> {
    try {
      const normalizedKeywords = keywords
        .map(k => k.toLowerCase().trim())
        .sort()

      // Find matching cache entry
      const cache = await JobSearchCache.findOne({
        normalizedKeywords: { $all: normalizedKeywords },
        location: new RegExp(location, 'i'),
        $or: [
          { workType: workType },
          { workType: 'any' },
          { workType: { $exists: false } }
        ],
        expiresAt: { $gt: new Date() }
      }).sort({ lastSearched: -1 })

      return cache
    } catch (error) {
      console.error('[JOB_AGGREGATOR] MongoDB search error:', error)
      return null
    }
  }

  /**
   * Search with Adzuna API (FREE)
   */
  private async searchWithAdzuna(
    keywords: string[],
    location: string,
    maxResults: number
  ): Promise<JobListing[]> {
    const jobs: JobListing[] = []

    // Determine country code from location
    let country: 'ca' | 'us' | 'gb' = 'ca'
    const locationLower = location.toLowerCase()
    if (locationLower.includes('usa') || locationLower.includes('united states')) {
      country = 'us'
    } else if (locationLower.includes('uk') || locationLower.includes('united kingdom')) {
      country = 'gb'
    }

    // Search for each keyword
    for (const keyword of keywords) {
      try {
        const results = await adzuna.searchJobs({
          what: keyword,
          where: location,
          country,
          resultsPerPage: Math.min(50, Math.ceil(maxResults / keywords.length)),
          sortBy: 'relevance',
          maxDaysOld: 30 // Only jobs from last 30 days
        })

        if (results.results.length > 0) {
          const converted = results.results.map(job => adzuna.convertToJobListing(job))
          jobs.push(...converted)
        }
      } catch (error) {
        console.error(`[JOB_AGGREGATOR] Adzuna error for "${keyword}":`, error)
      }
    }

    return jobs
  }

  /**
   * Search with JSearch API (FREE, aggregates Indeed/LinkedIn/Glassdoor)
   */
  private async searchWithJSearch(
    keywords: string[],
    location: string,
    maxResults: number
  ): Promise<JobListing[]> {
    const jobs: JobListing[] = []

    // Determine country code from location
    let country = 'us'
    const locationLower = location.toLowerCase()
    if (locationLower.includes('canada') || locationLower.includes('canadian')) {
      country = 'ca'
    } else if (locationLower.includes('uk') || locationLower.includes('united kingdom')) {
      country = 'gb'
    }

    // Search for each keyword
    for (const keyword of keywords) {
      try {
        const result = await jsearch.searchJobs({
          query: keyword,
          location,
          page: 1,
          numPages: 1,
          datePosted: 'month',
          country
        })

        if (result.data && result.data.length > 0) {
          const converted = result.data.map(job => jsearch.convertToJobListing(job))
          jobs.push(...converted)
        }
      } catch (error) {
        console.error(`[JOB_AGGREGATOR] JSearch error for "${keyword}":`, error)
      }
    }

    return jobs
  }

  /**
   * Search with Perplexity
   */
  private async searchWithPerplexity(
    keywords: string[],
    location: string,
    maxResults: number
  ): Promise<JobListing[]> {
    const jobs: JobListing[] = []

    // Search for each keyword
    for (const keyword of keywords) {
      try {
        const result = await PerplexityIntelligenceService.jobMarketAnalysisV2(
          location,
          keyword, // Use keyword as minimal resume text
          {
            roleHint: keyword,
            maxResults: Math.ceil(maxResults / keywords.length)
          }
        )

        if (result.data && result.data.length > 0) {
          // Convert Perplexity format to scraper format
          const convertedJobs: JobListing[] = result.data.map(job => ({
            jobId: job.url ? `perplexity_${Buffer.from(job.url).toString('base64').slice(0, 16)}` : `perplexity_${Date.now()}`,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.summary || 'No description available',
            url: job.url,
            source: job.source || 'perplexity',
            salary: job.salary || undefined,
            postedDate: job.postedDate ? new Date(job.postedDate) : undefined,
            workType: job.workType,
            experienceLevel: job.experienceLevel,
            skills: job.skills,
            skillMatchScore: job.skillMatchPercent
          }))
          jobs.push(...convertedJobs)
        }
      } catch (error) {
        console.error(`[JOB_AGGREGATOR] Perplexity error for "${keyword}":`, error)
      }
    }

    return jobs
  }

  /**
   * Search with Puppeteer scrapers
   */
  private async searchWithScrapers(
    keywords: string[],
    location: string,
    maxResults: number
  ): Promise<JobListing[]> {
    const scraper = getJobScraper()
    const jobs: JobListing[] = []

    // Search for each keyword
    for (const keyword of keywords) {
      try {
        const result = await scraper.aggregateJobs(keyword, location, {
          maxResults: Math.ceil(maxResults / keywords.length)
        })

        if (result.length > 0) {
          jobs.push(...result)
        }
      } catch (error) {
        console.error(`[JOB_AGGREGATOR] Scraper error for "${keyword}":`, error)
      }
    }

    return jobs
  }

  /**
   * Cache results in both Redis and MongoDB
   */
  private async cacheResults(
    params: JobSearchParams,
    jobs: JobListing[]
  ): Promise<void> {
    const { keywords, location, workType } = params

    try {
      // Cache in Redis (1 hour)
      const redisKey = this.generateCacheKey(params)
      await redis.set(redisKey, jobs, 3600)
      console.log(`[JOB_AGGREGATOR] Cached ${jobs.length} jobs in Redis`)

      // Cache in MongoDB (3 weeks)
      const normalizedKeywords = keywords
        .map(k => k.toLowerCase().trim())
        .sort()

      const mongoJobs = jobs.map(job => ({
        jobId: job.jobId,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        url: job.url,
        source: job.source,
        salary: job.salary,
        postedDate: job.postedDate,
        workType: job.workType,
        skillMatchScore: job.skillMatchScore,
        viewedBy: [],
        appliedBy: [],
        savedBy: []
      }))

      await JobSearchCache.create({
        keywords,
        normalizedKeywords,
        location,
        workType: workType || 'any',
        jobs: mongoJobs,
        searchCount: 1,
        lastSearched: new Date(),
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 3 weeks
      })

      console.log(`[JOB_AGGREGATOR] Cached ${jobs.length} jobs in MongoDB`)
    } catch (error) {
      console.error('[JOB_AGGREGATOR] Cache error:', error)
    }
  }

  /**
   * Search jobs by resume keywords (main entry point)
   */
  async searchByResumeKeywords(
    resumeKeywords: string[],
    location: string,
    radiusKm: number = 70,
    maxResults: number = 100
  ): Promise<JobSearchResult> {
    console.log('[JOB_AGGREGATOR] Searching by resume keywords:', {
      keywordCount: resumeKeywords.length,
      location,
      radiusKm
    })

    // Use top 10 keywords
    const topKeywords = resumeKeywords.slice(0, 10)

    return this.searchJobs({
      keywords: topKeywords,
      location,
      radiusKm,
      maxResults
    })
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    redisStats: any
    mongoStats: {
      totalCaches: number
      totalJobs: number
      avgJobsPerCache: number
    }
  }> {
    const redisStats = await redis.getStats()

    const mongoCaches = await JobSearchCache.countDocuments()
    const mongoAgg = await JobSearchCache.aggregate([
      {
        $project: {
          jobCount: { $size: '$jobs' }
        }
      },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: '$jobCount' },
          avgJobs: { $avg: '$jobCount' }
        }
      }
    ])

    return {
      redisStats,
      mongoStats: {
        totalCaches: mongoCaches,
        totalJobs: mongoAgg[0]?.totalJobs || 0,
        avgJobsPerCache: Math.round(mongoAgg[0]?.avgJobs || 0)
      }
    }
  }
}

export default JobAggregator
