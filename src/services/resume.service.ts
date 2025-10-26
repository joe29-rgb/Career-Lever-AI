/**
 * Enterprise Resume Service
 * 
 * Provides centralized resume management with:
 * - Database operations with connection pooling
 * - Error handling and logging
 * - Data validation
 * - Transaction support
 * - Performance optimization
 */

import { Types } from 'mongoose'
import Resume, { IResume, ICustomizedResume } from '@/models/Resume'
import { dbService } from '@/lib/database'
import { dbLogger, logger } from '@/lib/logger'
import { InputValidator } from '@/lib/validation'

export interface CreateResumeDTO {
  userId: string
  originalFileName: string
  fileUrl?: string
  extractedText: string
  userName?: string
  contactEmail?: string
  contactPhone?: string
  yearsExperience?: number
}

export interface UpdateResumeDTO {
  originalFileName?: string
  fileUrl?: string
  extractedText?: string
  userName?: string
  contactEmail?: string
  contactPhone?: string
  yearsExperience?: number
}

export interface CreateCustomizedVersionDTO {
  jobApplicationId: string
  customizedText: string
  jobTitle: string
  companyName: string
  matchScore?: number
  fileName?: string
}

export interface ResumeQueryOptions {
  limit?: number
  skip?: number
  sortBy?: 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

class ResumeService {
  private static instance: ResumeService

  private constructor() {}

  static getInstance(): ResumeService {
    if (!ResumeService.instance) {
      ResumeService.instance = new ResumeService()
    }
    return ResumeService.instance
  }

  /**
   * Create a new resume
   */
  async createResume(data: CreateResumeDTO): Promise<IResume> {
    const startTime = Date.now()

    try {
      // Connect to database
      await dbService.connect()

      // Validate input
      this.validateCreateResumeData(data)

      // Sanitize text inputs
      const sanitizedData = {
        userId: new Types.ObjectId(data.userId),
        originalFileName: InputValidator.sanitizeText(data.originalFileName),
        fileUrl: data.fileUrl ? InputValidator.sanitizeText(data.fileUrl) : undefined,
        extractedText: data.extractedText, // Keep raw text for analysis
        userName: data.userName ? InputValidator.sanitizeText(data.userName) : undefined,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone ? InputValidator.sanitizeText(data.contactPhone) : undefined,
        yearsExperience: data.yearsExperience,
        customizedVersions: []
      }

      // Create resume
      const resume = new Resume(sanitizedData)
      await resume.save()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('CREATE', 'Resume', duration)
      logger.info('Resume created successfully', {
        resumeId: resume._id,
        userId: data.userId,
        duration
      })

      return resume
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('CREATE', 'Resume', error as Error)
      logger.error('Failed to create resume', {
        userId: data.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      })
      throw error
    }
  }

  /**
   * Get resume by ID
   */
  async getResumeById(resumeId: string): Promise<IResume | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(resumeId)) {
        throw new Error('Invalid resume ID format')
      }

      const resume = await Resume.findById(resumeId).lean<IResume>().exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('FIND_BY_ID', 'Resume', duration)

      return resume
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('FIND_BY_ID', 'Resume', error as Error)
      throw error
    }
  }

  /**
   * Get all resumes for a user
   */
  async getResumesByUserId(
    userId: string,
    options: ResumeQueryOptions = {}
  ): Promise<IResume[]> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format')
      }

      const {
        limit = 50,
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options

      const query = Resume.find({ userId: new Types.ObjectId(userId) })
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean<IResume[]>()

      const resumes = await query.exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('FIND_BY_USER', 'Resume', duration)
      logger.debug(`Retrieved ${resumes.length} resumes for user`, {
        userId,
        count: resumes.length,
        duration
      })

      return resumes
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('FIND_BY_USER', 'Resume', error as Error)
      throw error
    }
  }

  /**
   * Get user's most recent resume
   */
  async getLatestResumeByUserId(userId: string): Promise<IResume | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format')
      }

      const resume = await Resume.findOne({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .lean<IResume>()
        .exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('FIND_LATEST', 'Resume', duration)

      return resume
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('FIND_LATEST', 'Resume', error as Error)
      throw error
    }
  }

  /**
   * Update resume
   */
  async updateResume(
    resumeId: string,
    data: UpdateResumeDTO
  ): Promise<IResume | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(resumeId)) {
        throw new Error('Invalid resume ID format')
      }

      // Sanitize inputs
      const sanitizedData: any = {}
      if (data.originalFileName) {
        sanitizedData.originalFileName = InputValidator.sanitizeText(data.originalFileName)
      }
      if (data.fileUrl) {
        sanitizedData.fileUrl = InputValidator.sanitizeText(data.fileUrl)
      }
      if (data.extractedText) {
        sanitizedData.extractedText = data.extractedText
      }
      if (data.userName) {
        sanitizedData.userName = InputValidator.sanitizeText(data.userName)
      }
      if (data.contactEmail) {
        if (!InputValidator.validateEmail(data.contactEmail)) {
          throw new Error('Invalid email format')
        }
        sanitizedData.contactEmail = data.contactEmail
      }
      if (data.contactPhone) {
        sanitizedData.contactPhone = InputValidator.sanitizeText(data.contactPhone)
      }
      if (data.yearsExperience !== undefined) {
        sanitizedData.yearsExperience = data.yearsExperience
      }

      const resume = await Resume.findByIdAndUpdate(
        resumeId,
        { $set: sanitizedData },
        { new: true, runValidators: true }
      ).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('UPDATE', 'Resume', duration)
      logger.info('Resume updated successfully', {
        resumeId,
        duration
      })

      return resume
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('UPDATE', 'Resume', error as Error)
      logger.error('Failed to update resume', {
        resumeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Delete resume
   */
  async deleteResume(resumeId: string): Promise<boolean> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(resumeId)) {
        throw new Error('Invalid resume ID format')
      }

      const result = await Resume.findByIdAndDelete(resumeId).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('DELETE', 'Resume', duration)
      logger.info('Resume deleted successfully', {
        resumeId,
        duration
      })

      return !!result
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('DELETE', 'Resume', error as Error)
      logger.error('Failed to delete resume', {
        resumeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Add customized version to resume
   */
  async addCustomizedVersion(
    resumeId: string,
    data: CreateCustomizedVersionDTO
  ): Promise<IResume | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(resumeId)) {
        throw new Error('Invalid resume ID format')
      }
      if (!Types.ObjectId.isValid(data.jobApplicationId)) {
        throw new Error('Invalid job application ID format')
      }

      const customizedVersion = {
        jobApplicationId: new Types.ObjectId(data.jobApplicationId),
        customizedText: data.customizedText,
        jobTitle: InputValidator.sanitizeText(data.jobTitle),
        companyName: InputValidator.sanitizeText(data.companyName),
        matchScore: data.matchScore || 0,
        fileName: data.fileName ? InputValidator.sanitizeText(data.fileName) : undefined
      }

      const resume = await Resume.findByIdAndUpdate(
        resumeId,
        { $push: { customizedVersions: customizedVersion } },
        { new: true, runValidators: true }
      ).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('ADD_CUSTOMIZED_VERSION', 'Resume', duration)
      logger.info('Customized resume version added', {
        resumeId,
        jobApplicationId: data.jobApplicationId,
        duration
      })

      return resume
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('ADD_CUSTOMIZED_VERSION', 'Resume', error as Error)
      logger.error('Failed to add customized version', {
        resumeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Get customized version by job application ID
   */
  async getCustomizedVersion(
    resumeId: string,
    jobApplicationId: string
  ): Promise<ICustomizedResume | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(resumeId)) {
        throw new Error('Invalid resume ID format')
      }
      if (!Types.ObjectId.isValid(jobApplicationId)) {
        throw new Error('Invalid job application ID format')
      }

      const resume = await Resume.findById(resumeId).lean<IResume>().exec()
      if (!resume) {
        return null
      }

      const customizedVersion = resume.customizedVersions.find(
        (v: any) => v.jobApplicationId.toString() === jobApplicationId
      ) as ICustomizedResume | undefined

      const duration = Date.now() - startTime
      dbLogger.dbQuery('GET_CUSTOMIZED_VERSION', 'Resume', duration)

      return customizedVersion || null
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('GET_CUSTOMIZED_VERSION', 'Resume', error as Error)
      throw error
    }
  }

  /**
   * Count total resumes for a user
   */
  async countResumesByUserId(userId: string): Promise<number> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format')
      }

      const count = await Resume.countDocuments({
        userId: new Types.ObjectId(userId)
      }).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('COUNT', 'Resume', duration)

      return count
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('COUNT', 'Resume', error as Error)
      throw error
    }
  }

  /**
   * Search resumes by text content
   */
  async searchResumes(
    userId: string,
    searchTerm: string,
    options: ResumeQueryOptions = {}
  ): Promise<IResume[]> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format')
      }

      const {
        limit = 50,
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options

      const searchRegex = new RegExp(searchTerm, 'i')

      const resumes = await Resume.find({
        userId: new Types.ObjectId(userId),
        $or: [
          { extractedText: searchRegex },
          { userName: searchRegex },
          { originalFileName: searchRegex }
        ]
      })
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean<IResume[]>()
        .exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('SEARCH', 'Resume', duration)
      logger.debug(`Found ${resumes.length} resumes matching search`, {
        userId,
        searchTerm,
        count: resumes.length,
        duration
      })

      return resumes
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('SEARCH', 'Resume', error as Error)
      throw error
    }
  }

  /**
   * Validate create resume data
   */
  private validateCreateResumeData(data: CreateResumeDTO): void {
    if (!data.userId || !Types.ObjectId.isValid(data.userId)) {
      throw new Error('Valid userId is required')
    }

    if (!data.originalFileName || data.originalFileName.trim().length === 0) {
      throw new Error('originalFileName is required')
    }

    if (!data.extractedText || data.extractedText.trim().length === 0) {
      throw new Error('extractedText is required')
    }

    if (data.contactEmail && !InputValidator.validateEmail(data.contactEmail)) {
      throw new Error('Invalid email format')
    }

    if (data.fileUrl && !InputValidator.validateURL(data.fileUrl)) {
      throw new Error('Invalid fileUrl format')
    }

    if (data.yearsExperience !== undefined && (data.yearsExperience < 0 || data.yearsExperience > 100)) {
      throw new Error('yearsExperience must be between 0 and 100')
    }
  }
}

// Export singleton instance
export const resumeService = ResumeService.getInstance()

