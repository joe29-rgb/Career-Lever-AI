/**
 * Enterprise Job Application Service
 * 
 * Centralized management for job applications with:
 * - CRUD operations with validation
 * - Status tracking and workflow
 * - Analytics and reporting
 * - Error handling and logging
 */

import { Types } from 'mongoose'
import JobApplication, { IJobApplication, ApplicationStatus } from '@/models/JobApplication'
import { dbService } from '@/lib/database'
import { dbLogger, logger } from '@/lib/logger'
import { InputValidator } from '@/lib/validation'

export interface CreateJobApplicationDTO {
  userId: string
  jobTitle: string
  companyName: string
  jobDescription: string
  jobUrl?: string
  applicationStatus?: ApplicationStatus
  notes?: string
  applicationSource?: string
}

export interface UpdateJobApplicationDTO {
  jobTitle?: string
  companyName?: string
  jobDescription?: string
  jobUrl?: string
  applicationStatus?: ApplicationStatus
  appliedDate?: Date | null
  notes?: string
  companyResearch?: string
  coverLetterId?: string
  resumeVersionId?: string
  variantUsed?: 'A' | 'B' | 'C'
}

export interface JobApplicationQueryOptions {
  status?: ApplicationStatus | ApplicationStatus[]
  limit?: number
  skip?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'appliedDate'
  sortOrder?: 'asc' | 'desc'
  companyName?: string
  jobTitle?: string
}

export interface JobApplicationStats {
  total: number
  byStatus: Record<ApplicationStatus, number>
  recentApplications: number
  interviewRate: number
  offerRate: number
}

class JobApplicationService {
  private static instance: JobApplicationService

  private constructor() {}

  static getInstance(): JobApplicationService {
    if (!JobApplicationService.instance) {
      JobApplicationService.instance = new JobApplicationService()
    }
    return JobApplicationService.instance
  }

  /**
   * Create a new job application
   */
  async createJobApplication(data: CreateJobApplicationDTO): Promise<IJobApplication> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      // Validate input
      this.validateCreateJobApplicationData(data)

      // Sanitize inputs
      const sanitizedData = {
        userId: new Types.ObjectId(data.userId),
        jobTitle: InputValidator.sanitizeText(data.jobTitle),
        companyName: InputValidator.sanitizeText(data.companyName),
        jobDescription: data.jobDescription, // Keep full text for analysis
        jobUrl: data.jobUrl ? InputValidator.sanitizeText(data.jobUrl) : undefined,
        applicationStatus: data.applicationStatus || 'saved',
        notes: data.notes ? InputValidator.sanitizeText(data.notes, 50000) : undefined,
        applicationSource: data.applicationSource ? InputValidator.sanitizeText(data.applicationSource) : undefined,
        followUpDates: [],
        appliedDate: data.applicationStatus === 'applied' ? new Date() : null
      }

      const jobApplication = new JobApplication(sanitizedData)
      await jobApplication.save()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('CREATE', 'JobApplication', duration)
      logger.info('Job application created successfully', {
        applicationId: jobApplication._id,
        userId: data.userId,
        companyName: data.companyName,
        duration
      })

      return jobApplication
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('CREATE', 'JobApplication', error as Error)
      logger.error('Failed to create job application', {
        userId: data.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      })
      throw error
    }
  }

  /**
   * Get job application by ID
   */
  async getJobApplicationById(applicationId: string): Promise<IJobApplication | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(applicationId)) {
        throw new Error('Invalid application ID format')
      }

      const application = await JobApplication.findById(applicationId)
        .populate('companyResearch')
        .populate('coverLetterId')
        .lean<IJobApplication>()
        .exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('FIND_BY_ID', 'JobApplication', duration)

      return application
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('FIND_BY_ID', 'JobApplication', error as Error)
      throw error
    }
  }

  /**
   * Get job applications for a user with filtering
   */
  async getJobApplicationsByUserId(
    userId: string,
    options: JobApplicationQueryOptions = {}
  ): Promise<IJobApplication[]> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format')
      }

      const {
        status,
        limit = 50,
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        companyName,
        jobTitle
      } = options

      // Build query
      const query: any = { userId: new Types.ObjectId(userId) }

      if (status) {
        query.applicationStatus = Array.isArray(status) ? { $in: status } : status
      }

      if (companyName) {
        query.companyName = new RegExp(companyName, 'i')
      }

      if (jobTitle) {
        query.jobTitle = new RegExp(jobTitle, 'i')
      }

      const applications = await JobApplication.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean<IJobApplication[]>()
        .exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('FIND_BY_USER', 'JobApplication', duration)
      logger.debug(`Retrieved ${applications.length} job applications`, {
        userId,
        count: applications.length,
        duration
      })

      return applications
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('FIND_BY_USER', 'JobApplication', error as Error)
      throw error
    }
  }

  /**
   * Update job application
   */
  async updateJobApplication(
    applicationId: string,
    data: UpdateJobApplicationDTO
  ): Promise<IJobApplication | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(applicationId)) {
        throw new Error('Invalid application ID format')
      }

      // Sanitize inputs
      const updateData: any = {}

      if (data.jobTitle) {
        updateData.jobTitle = InputValidator.sanitizeText(data.jobTitle)
      }
      if (data.companyName) {
        updateData.companyName = InputValidator.sanitizeText(data.companyName)
      }
      if (data.jobDescription) {
        updateData.jobDescription = data.jobDescription
      }
      if (data.jobUrl) {
        if (!InputValidator.validateURL(data.jobUrl)) {
          throw new Error('Invalid job URL format')
        }
        updateData.jobUrl = InputValidator.sanitizeText(data.jobUrl)
      }
      if (data.applicationStatus) {
        updateData.applicationStatus = data.applicationStatus
        // Auto-set appliedDate when status changes to 'applied'
        if (data.applicationStatus === 'applied' && data.appliedDate === undefined) {
          updateData.appliedDate = new Date()
        }
      }
      if (data.appliedDate !== undefined) {
        updateData.appliedDate = data.appliedDate
      }
      if (data.notes) {
        updateData.notes = InputValidator.sanitizeText(data.notes, 50000)
      }
      if (data.companyResearch && Types.ObjectId.isValid(data.companyResearch)) {
        updateData.companyResearch = new Types.ObjectId(data.companyResearch)
      }
      if (data.coverLetterId && Types.ObjectId.isValid(data.coverLetterId)) {
        updateData.coverLetterId = new Types.ObjectId(data.coverLetterId)
      }
      if (data.resumeVersionId && Types.ObjectId.isValid(data.resumeVersionId)) {
        updateData.resumeVersionId = new Types.ObjectId(data.resumeVersionId)
      }
      if (data.variantUsed) {
        updateData.variantUsed = data.variantUsed
      }

      const application = await JobApplication.findByIdAndUpdate(
        applicationId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('UPDATE', 'JobApplication', duration)
      logger.info('Job application updated successfully', {
        applicationId,
        duration
      })

      return application
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('UPDATE', 'JobApplication', error as Error)
      logger.error('Failed to update job application', {
        applicationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Delete job application
   */
  async deleteJobApplication(applicationId: string): Promise<boolean> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(applicationId)) {
        throw new Error('Invalid application ID format')
      }

      const result = await JobApplication.findByIdAndDelete(applicationId).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('DELETE', 'JobApplication', duration)
      logger.info('Job application deleted successfully', {
        applicationId,
        duration
      })

      return !!result
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('DELETE', 'JobApplication', error as Error)
      logger.error('Failed to delete job application', {
        applicationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Add follow-up date to application
   */
  async addFollowUpDate(applicationId: string, followUpDate: Date): Promise<IJobApplication | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(applicationId)) {
        throw new Error('Invalid application ID format')
      }

      const application = await JobApplication.findByIdAndUpdate(
        applicationId,
        { $push: { followUpDates: followUpDate } },
        { new: true }
      ).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('ADD_FOLLOWUP', 'JobApplication', duration)
      logger.info('Follow-up date added to application', {
        applicationId,
        followUpDate: followUpDate.toISOString(),
        duration
      })

      return application
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('ADD_FOLLOWUP', 'JobApplication', error as Error)
      throw error
    }
  }

  /**
   * Update application status
   */
  async updateStatus(
    applicationId: string,
    newStatus: ApplicationStatus
  ): Promise<IJobApplication | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(applicationId)) {
        throw new Error('Invalid application ID format')
      }

      const updateData: any = { applicationStatus: newStatus }

      // Set appliedDate when status changes to 'applied'
      if (newStatus === 'applied') {
        updateData.appliedDate = new Date()
      }

      const application = await JobApplication.findByIdAndUpdate(
        applicationId,
        { $set: updateData },
        { new: true }
      ).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('UPDATE_STATUS', 'JobApplication', duration)
      logger.info('Application status updated', {
        applicationId,
        newStatus,
        duration
      })

      return application
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('UPDATE_STATUS', 'JobApplication', error as Error)
      throw error
    }
  }

  /**
   * Increment metrics (views, interviews, offers)
   */
  async incrementMetric(
    applicationId: string,
    metric: 'views' | 'interviews' | 'offers'
  ): Promise<IJobApplication | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(applicationId)) {
        throw new Error('Invalid application ID format')
      }

      const application = await JobApplication.findByIdAndUpdate(
        applicationId,
        { $inc: { [metric]: 1 } },
        { new: true }
      ).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('INCREMENT_METRIC', 'JobApplication', duration)

      return application
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('INCREMENT_METRIC', 'JobApplication', error as Error)
      throw error
    }
  }

  /**
   * Get application statistics for a user
   */
  async getApplicationStats(userId: string): Promise<JobApplicationStats> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format')
      }

      const applications = await JobApplication.find({
        userId: new Types.ObjectId(userId)
      })
        .lean<IJobApplication[]>()
        .exec()

      // Calculate statistics
      const byStatus: Record<ApplicationStatus, number> = {
        saved: 0,
        applied: 0,
        interviewing: 0,
        offer: 0,
        rejected: 0,
        withdrawn: 0
      }

      let totalInterviews = 0
      let totalOffers = 0

      applications.forEach((app) => {
        byStatus[app.applicationStatus]++
        totalInterviews += app.interviews || 0
        totalOffers += app.offers || 0
      })

      // Recent applications (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentApplications = applications.filter(
        (app) => new Date(app.createdAt) > sevenDaysAgo
      ).length

      // Calculate rates
      const appliedCount = byStatus.applied + byStatus.interviewing + byStatus.offer + byStatus.rejected
      const interviewRate = appliedCount > 0 ? (totalInterviews / appliedCount) * 100 : 0
      const offerRate = appliedCount > 0 ? (totalOffers / appliedCount) * 100 : 0

      const stats: JobApplicationStats = {
        total: applications.length,
        byStatus,
        recentApplications,
        interviewRate: Math.round(interviewRate * 10) / 10,
        offerRate: Math.round(offerRate * 10) / 10
      }

      const duration = Date.now() - startTime
      dbLogger.dbQuery('GET_STATS', 'JobApplication', duration)
      logger.debug('Retrieved application statistics', {
        userId,
        total: stats.total,
        duration
      })

      return stats
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('GET_STATS', 'JobApplication', error as Error)
      throw error
    }
  }

  /**
   * Count applications by user
   */
  async countApplicationsByUserId(userId: string): Promise<number> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format')
      }

      const count = await JobApplication.countDocuments({
        userId: new Types.ObjectId(userId)
      }).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('COUNT', 'JobApplication', duration)

      return count
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('COUNT', 'JobApplication', error as Error)
      throw error
    }
  }

  /**
   * Search applications by text
   */
  async searchApplications(
    userId: string,
    searchTerm: string,
    options: JobApplicationQueryOptions = {}
  ): Promise<IJobApplication[]> {
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

      const applications = await JobApplication.find({
        userId: new Types.ObjectId(userId),
        $or: [
          { jobTitle: searchRegex },
          { companyName: searchRegex },
          { jobDescription: searchRegex },
          { notes: searchRegex }
        ]
      })
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean<IJobApplication[]>()
        .exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('SEARCH', 'JobApplication', duration)
      logger.debug(`Found ${applications.length} applications matching search`, {
        userId,
        searchTerm,
        count: applications.length,
        duration
      })

      return applications
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('SEARCH', 'JobApplication', error as Error)
      throw error
    }
  }

  /**
   * Validate create job application data
   */
  private validateCreateJobApplicationData(data: CreateJobApplicationDTO): void {
    if (!data.userId || !Types.ObjectId.isValid(data.userId)) {
      throw new Error('Valid userId is required')
    }

    if (!data.jobTitle || data.jobTitle.trim().length === 0) {
      throw new Error('jobTitle is required')
    }

    if (!data.companyName || data.companyName.trim().length === 0) {
      throw new Error('companyName is required')
    }

    if (!data.jobDescription || data.jobDescription.trim().length === 0) {
      throw new Error('jobDescription is required')
    }

    if (data.jobUrl && !InputValidator.validateURL(data.jobUrl)) {
      throw new Error('Invalid jobUrl format')
    }

    if (data.applicationStatus && 
        !['saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'].includes(data.applicationStatus)) {
      throw new Error('Invalid applicationStatus value')
    }
  }
}

// Export singleton instance
export const jobApplicationService = JobApplicationService.getInstance()

