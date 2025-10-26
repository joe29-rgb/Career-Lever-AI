/**
 * Job Search Cache Service
 * 
 * Manages job search caching with 3-week retention:
 * - Reduces API calls by reusing similar searches
 * - Tracks which jobs users have seen (adds "seen" indicator)
 * - Shares results across users with similar keywords
 * - Auto-expires after 3 weeks
 */

import { Types } from 'mongoose';
import JobSearchCache, { IJobSearchCache } from '@/models/JobSearchCache';
import { dbService } from '@/lib/database';

export interface CachedJob {
  jobId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  salary?: string;
  postedDate?: Date;
  workType?: string;
  skillMatchScore?: number;
  
  // User-specific tracking
  seen?: boolean; // Has current user seen this job?
  applied?: boolean; // Has current user applied?
  saved?: boolean; // Has current user saved?
  viewCount?: number; // How many users have viewed
}

export interface SearchCacheOptions {
  keywords: string | string[];
  location: string;
  workType?: 'remote' | 'hybrid' | 'onsite' | 'any';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  userId?: string; // For tracking user-specific data
}

class JobSearchCacheService {
  private static instance: JobSearchCacheService;

  private constructor() {}

  static getInstance(): JobSearchCacheService {
    if (!JobSearchCacheService.instance) {
      JobSearchCacheService.instance = new JobSearchCacheService();
    }
    return JobSearchCacheService.instance;
  }

  /**
   * Normalize keywords for consistent matching
   */
  private normalizeKeywords(keywords: string | string[]): string[] {
    const keywordArray = Array.isArray(keywords) 
      ? keywords 
      : keywords.split(',').map(k => k.trim());
    
    return keywordArray
      .map(k => k.toLowerCase().trim())
      .filter(Boolean)
      .sort();
  }

  /**
   * Generate unique job ID for deduplication
   */
  private generateJobId(title: string, company: string, location: string): string {
    const normalized = `${title}-${company}-${location}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    
    return normalized;
  }

  /**
   * Find cached search results
   */
  async findCachedSearch(options: SearchCacheOptions): Promise<IJobSearchCache | null> {
    try {
      await dbService.connect();

      const normalizedKeywords = this.normalizeKeywords(options.keywords);
      
      const cache = await JobSearchCache.findOne({
        normalizedKeywords: { $all: normalizedKeywords },
        location: new RegExp(options.location, 'i'),
        $or: [
          { workType: options.workType },
          { workType: 'any' },
          { workType: { $exists: false } }
        ],
        expiresAt: { $gt: new Date() } // Not expired
      })
      .sort({ lastSearched: -1 }) // Most recent first
      .exec();

      if (cache) {
        console.log(`[JOB_CACHE] ✅ Found cached search with ${cache.jobs.length} jobs`);
      }

      return cache;
    } catch (error) {
      console.error('[JOB_CACHE] Error finding cached search:', error);
      return null;
    }
  }

  /**
   * Get cached jobs with user-specific tracking
   */
  async getCachedJobs(
    options: SearchCacheOptions
  ): Promise<CachedJob[] | null> {
    try {
      const cache = await this.findCachedSearch(options);
      
      if (!cache) {
        return null;
      }

      const userId = options.userId ? new Types.ObjectId(options.userId) : null;

      // Map jobs with user-specific data
      const jobs: CachedJob[] = cache.jobs.map((job: any) => ({
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
        
        // User-specific tracking
        seen: userId ? job.viewedBy.some((id: any) => id.equals(userId)) : false,
        applied: userId ? job.appliedBy.some((id: any) => id.equals(userId)) : false,
        saved: userId ? job.savedBy.some((id: any) => id.equals(userId)) : false,
        viewCount: job.viewedBy.length
      }));

      // Update search count and last searched
      cache.searchCount += 1;
      cache.lastSearched = new Date();
      await cache.save();

      console.log(`[JOB_CACHE] ✅ Returning ${jobs.length} cached jobs (${jobs.filter(j => j.seen).length} seen by user)`);

      return jobs;
    } catch (error) {
      console.error('[JOB_CACHE] Error getting cached jobs:', error);
      return null;
    }
  }

  /**
   * Cache new search results
   */
  async cacheSearchResults(
    options: SearchCacheOptions,
    jobs: any[]
  ): Promise<void> {
    try {
      await dbService.connect();

      // CRITICAL FIX: Validate and clean jobs BEFORE caching
      const validJobs = jobs.filter(job => {
        // Ensure all required fields exist
        if (!job.title || !job.company || !job.location || !job.url) {
          console.log(`[JOB_CACHE] ❌ Skipping invalid job: missing required fields`);
          return false;
        }
        
        // Ensure description exists (set default if empty)
        if (!job.description || job.description.trim() === '') {
          job.description = 'No description available';
        }
        
        // Ensure source exists
        if (!job.source) {
          job.source = 'Unknown';
        }
        
        return true;
      });

      console.log(`[JOB_CACHE] Validated ${validJobs.length}/${jobs.length} jobs for caching`);

      const normalizedKeywords = this.normalizeKeywords(options.keywords);

      // Check if cache already exists
      const existing = await this.findCachedSearch(options);

      if (existing) {
        // Merge new jobs with existing (avoid duplicates)
        const existingJobIds = new Set(existing.jobs.map((j: any) => j.jobId));
        
        const newJobs = validJobs
          .filter(job => {
            const jobId = this.generateJobId(job.title, job.company, job.location);
            return !existingJobIds.has(jobId);
          })
          .map(job => ({
            jobId: this.generateJobId(job.title, job.company, job.location),
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description || '',
            url: job.url || job.link || '',
            source: job.source || 'Unknown',
            salary: job.salary,
            postedDate: job.postedDate || job.datePosted,
            workType: job.workType || job.remote ? 'remote' : undefined,
            skillMatchScore: job.skillMatchScore,
            viewedBy: [],
            appliedBy: [],
            savedBy: []
          }));

        if (newJobs.length > 0) {
          existing.jobs.push(...newJobs);
          existing.lastSearched = new Date();
          existing.searchCount += 1;
          await existing.save();
          
          console.log(`[JOB_CACHE] ✅ Added ${newJobs.length} new jobs to existing cache`);
        } else {
          console.log(`[JOB_CACHE] ℹ️ No new jobs to add (all duplicates)`);
        }
      } else {
        // Create new cache entry
        const cacheEntry = new JobSearchCache({
          keywords: Array.isArray(options.keywords) ? options.keywords : [options.keywords],
          normalizedKeywords,
          location: options.location,
          workType: options.workType || 'any',
          experienceLevel: options.experienceLevel,
          jobs: validJobs.map(job => ({
            jobId: this.generateJobId(job.title, job.company, job.location),
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description || '',
            url: job.url || job.link || '',
            source: job.source || 'Unknown',
            salary: job.salary,
            postedDate: job.postedDate || job.datePosted,
            workType: job.workType || job.remote ? 'remote' : undefined,
            skillMatchScore: job.skillMatchScore,
            viewedBy: [],
            appliedBy: [],
            savedBy: []
          })),
          searchCount: 1,
          lastSearched: new Date(),
          expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 3 weeks
        });

        await cacheEntry.save();
        console.log(`[JOB_CACHE] ✅ Created new cache with ${validJobs.length} jobs`);
      }
    } catch (error) {
      console.error('[JOB_CACHE] Error caching search results:', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Mark job as viewed by user
   */
  async markJobViewed(
    jobId: string,
    userId: string
  ): Promise<void> {
    try {
      await dbService.connect();

      const userObjectId = new Types.ObjectId(userId);

      await JobSearchCache.updateOne(
        { 'jobs.jobId': jobId },
        { 
          $addToSet: { 'jobs.$.viewedBy': userObjectId }
        }
      );

      console.log(`[JOB_CACHE] ✅ Marked job ${jobId} as viewed by user ${userId}`);
    } catch (error) {
      console.error('[JOB_CACHE] Error marking job as viewed:', error);
    }
  }

  /**
   * Mark job as applied by user
   */
  async markJobApplied(
    jobId: string,
    userId: string
  ): Promise<void> {
    try {
      await dbService.connect();

      const userObjectId = new Types.ObjectId(userId);

      await JobSearchCache.updateOne(
        { 'jobs.jobId': jobId },
        { 
          $addToSet: { 
            'jobs.$.appliedBy': userObjectId,
            'jobs.$.viewedBy': userObjectId // Also mark as viewed
          }
        }
      );

      console.log(`[JOB_CACHE] ✅ Marked job ${jobId} as applied by user ${userId}`);
    } catch (error) {
      console.error('[JOB_CACHE] Error marking job as applied:', error);
    }
  }

  /**
   * Mark job as saved by user
   */
  async markJobSaved(
    jobId: string,
    userId: string,
    saved: boolean = true
  ): Promise<void> {
    try {
      await dbService.connect();

      const userObjectId = new Types.ObjectId(userId);

      if (saved) {
        await JobSearchCache.updateOne(
          { 'jobs.jobId': jobId },
          { 
            $addToSet: { 
              'jobs.$.savedBy': userObjectId,
              'jobs.$.viewedBy': userObjectId // Also mark as viewed
            }
          }
        );
      } else {
        await JobSearchCache.updateOne(
          { 'jobs.jobId': jobId },
          { 
            $pull: { 'jobs.$.savedBy': userObjectId }
          }
        );
      }

      console.log(`[JOB_CACHE] ✅ Marked job ${jobId} as ${saved ? 'saved' : 'unsaved'} by user ${userId}`);
    } catch (error) {
      console.error('[JOB_CACHE] Error marking job as saved:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalCaches: number;
    totalJobs: number;
    averageJobsPerCache: number;
    oldestCache: Date | null;
    newestCache: Date | null;
  }> {
    try {
      await dbService.connect();

      const caches = await JobSearchCache.find({
        expiresAt: { $gt: new Date() }
      }).exec();

      const totalJobs = caches.reduce((sum, cache) => sum + cache.jobs.length, 0);

      return {
        totalCaches: caches.length,
        totalJobs,
        averageJobsPerCache: caches.length > 0 ? Math.round(totalJobs / caches.length) : 0,
        oldestCache: caches.length > 0 
          ? new Date(Math.min(...caches.map(c => c.createdAt.getTime())))
          : null,
        newestCache: caches.length > 0
          ? new Date(Math.max(...caches.map(c => c.createdAt.getTime())))
          : null
      };
    } catch (error) {
      console.error('[JOB_CACHE] Error getting cache stats:', error);
      return {
        totalCaches: 0,
        totalJobs: 0,
        averageJobsPerCache: 0,
        oldestCache: null,
        newestCache: null
      };
    }
  }
}

export const jobSearchCacheService = JobSearchCacheService.getInstance();
