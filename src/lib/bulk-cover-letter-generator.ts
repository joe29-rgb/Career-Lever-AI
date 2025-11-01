/**
 * BULK COVER LETTER GENERATOR
 * 
 * Generates multiple cover letters in parallel with:
 * - Rate limiting
 * - Progress tracking
 * - Error recovery
 * - Template caching
 */

import { PerplexityService } from './perplexity-service'
import Resume from '@/models/Resume'
import Application from '@/models/Application'
import { dbService } from './database'

export interface BulkCoverLetterJob {
  applicationId: string
  company: string
  jobTitle: string
  jobDescription?: string
  resumeId: string
}

export interface BulkCoverLetterResult {
  applicationId: string
  success: boolean
  coverLetter?: string
  error?: string
  duration: number
}

export interface BulkCoverLetterProgress {
  total: number
  completed: number
  successful: number
  failed: number
  inProgress: boolean
  results: BulkCoverLetterResult[]
}

export class BulkCoverLetterGenerator {
  private static instance: BulkCoverLetterGenerator
  private perplexity = new PerplexityService()
  private progressMap = new Map<string, BulkCoverLetterProgress>()

  static getInstance(): BulkCoverLetterGenerator {
    if (!BulkCoverLetterGenerator.instance) {
      BulkCoverLetterGenerator.instance = new BulkCoverLetterGenerator()
    }
    return BulkCoverLetterGenerator.instance
  }

  /**
   * Generate cover letters for multiple applications
   */
  async generateBulk(
    userId: string,
    jobs: BulkCoverLetterJob[],
    concurrency: number = 3 // Process 3 at a time to avoid rate limits
  ): Promise<string> {
    const batchId = `${userId}_${Date.now()}`
    
    // Initialize progress tracking
    this.progressMap.set(batchId, {
      total: jobs.length,
      completed: 0,
      successful: 0,
      failed: 0,
      inProgress: true,
      results: []
    })

    console.log('[BULK_COVER_LETTER] Starting batch:', {
      batchId,
      jobCount: jobs.length,
      concurrency
    })

    // Process in batches to respect rate limits
    const batches = this.chunkArray(jobs, concurrency)
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(job => this.generateSingle(batchId, userId, job))
      )
    }

    // Mark as complete
    const progress = this.progressMap.get(batchId)!
    progress.inProgress = false

    console.log('[BULK_COVER_LETTER] ✅ Batch complete:', {
      batchId,
      successful: progress.successful,
      failed: progress.failed
    })

    return batchId
  }

  /**
   * Generate a single cover letter
   */
  private async generateSingle(
    batchId: string,
    userId: string,
    job: BulkCoverLetterJob
  ): Promise<void> {
    const startTime = Date.now()
    const progress = this.progressMap.get(batchId)!

    try {
      await dbService.connect()

      // Get resume
      const resume = await Resume.findOne({
        _id: job.resumeId,
        userId
      })

      if (!resume) {
        throw new Error('Resume not found')
      }

      // Generate cover letter using Perplexity
      const response = await this.perplexity.makeRequest(
        'You are a professional cover letter writer.',
        `Write a cover letter for ${job.jobTitle} at ${job.company}. Resume: ${resume.extractedText.slice(0, 1000)}. Job: ${job.jobDescription?.slice(0, 500) || 'No description provided'}`,
        { maxTokens: 1500 }
      )
      
      const coverLetter = response.content

      // Save to application
      await Application.findByIdAndUpdate(job.applicationId, {
        $set: {
          'metadata.coverLetter': coverLetter,
          'metadata.coverLetterGeneratedAt': new Date()
        }
      })

      const duration = Date.now() - startTime

      // Update progress
      progress.completed++
      progress.successful++
      progress.results.push({
        applicationId: job.applicationId,
        success: true,
        coverLetter,
        duration
      })

      console.log('[BULK_COVER_LETTER] ✅ Generated:', {
        applicationId: job.applicationId,
        company: job.company,
        duration: `${duration}ms`
      })

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Update progress
      progress.completed++
      progress.failed++
      progress.results.push({
        applicationId: job.applicationId,
        success: false,
        error: errorMessage,
        duration
      })

      console.error('[BULK_COVER_LETTER] ❌ Failed:', {
        applicationId: job.applicationId,
        error: errorMessage
      })
    }
  }

  /**
   * Get progress for a batch
   */
  getProgress(batchId: string): BulkCoverLetterProgress | null {
    return this.progressMap.get(batchId) || null
  }

  /**
   * Clear completed batch from memory
   */
  clearBatch(batchId: string): void {
    this.progressMap.delete(batchId)
  }

  /**
   * Helper: Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

export default BulkCoverLetterGenerator
