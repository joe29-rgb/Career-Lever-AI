import { describe, it, expect, beforeEach } from 'vitest'
import { JobApplicationService } from '@/services/job-application.service'

describe('JobApplicationService', () => {
  const userId = '507f1f77bcf86cd799439011'
  let service: JobApplicationService

  beforeEach(() => {
    service = new JobApplicationService()
  })

  describe('create', () => {
    it('should create a new job application', async () => {
      const appData = {
        userId,
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Corp',
        jobDescription: 'Build awesome products',
        applicationStatus: 'applied' as const,
        appliedDate: new Date(),
      }

      const application = await service.create(appData)

      expect(application).toBeDefined()
      expect(application.jobTitle).toBe(appData.jobTitle)
      expect(application.applicationStatus).toBe('applied')
    })

    it('should set default status to draft', async () => {
      const appData = {
        userId,
        jobTitle: 'Developer',
        companyName: 'Startup',
      }

      const application = await service.create(appData)

      expect(application.applicationStatus).toBe('draft')
    })
  })

  describe('updateStatus', () => {
    it('should update application status', async () => {
      const application = await service.create({
        userId,
        jobTitle: 'Engineer',
        companyName: 'Company',
        applicationStatus: 'applied',
      })

      const updated = await service.updateStatus(
        application._id.toString(),
        'interviewing'
      )

      expect(updated).toBeDefined()
      expect(updated?.applicationStatus).toBe('interviewing')
      expect(updated?.statusHistory).toBeDefined()
      expect(updated?.statusHistory?.length).toBeGreaterThan(0)
    })

    it('should track status history', async () => {
      const application = await service.create({
        userId,
        jobTitle: 'Engineer',
        companyName: 'Company',
        applicationStatus: 'draft',
      })

      await service.updateStatus(application._id.toString(), 'applied')
      await service.updateStatus(application._id.toString(), 'interviewing')
      const final = await service.updateStatus(application._id.toString(), 'offer')

      expect(final?.statusHistory).toHaveLength(3)
    })
  })

  describe('addFollowUpDate', () => {
    it('should add follow-up date and note', async () => {
      const application = await service.create({
        userId,
        jobTitle: 'Engineer',
        companyName: 'Company',
      })

      const followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      const updated = await service.addFollowUpDate(
        application._id.toString(),
        followUpDate,
        'Check on application status'
      )

      expect(updated).toBeDefined()
      expect(updated?.followUpDates).toHaveLength(1)
      expect(updated?.followUpDates?.[0].note).toBe('Check on application status')
    })
  })

  describe('incrementMetric', () => {
    it('should increment application metrics', async () => {
      const application = await service.create({
        userId,
        jobTitle: 'Engineer',
        companyName: 'Company',
      })

      await service.incrementApplicationMetric(application._id.toString(), 'viewCount')
      await service.incrementApplicationMetric(application._id.toString(), 'viewCount')
      
      const updated = await service.findById(application._id.toString())

      expect(updated?.viewCount).toBe(2)
    })
  })

  describe('getStats', () => {
    beforeEach(async () => {
      await service.create({
        userId,
        jobTitle: 'Job 1',
        companyName: 'Company A',
        applicationStatus: 'applied',
      })
      
      await service.create({
        userId,
        jobTitle: 'Job 2',
        companyName: 'Company B',
        applicationStatus: 'interviewing',
      })
      
      await service.create({
        userId,
        jobTitle: 'Job 3',
        companyName: 'Company C',
        applicationStatus: 'offer',
      })
      
      await service.create({
        userId,
        jobTitle: 'Job 4',
        companyName: 'Company D',
        applicationStatus: 'rejected',
      })
    })

    it('should calculate user stats correctly', async () => {
      const stats = await service.getStats(userId)

      expect(stats.total).toBe(4)
      expect(stats.byStatus.applied).toBe(1)
      expect(stats.byStatus.interviewing).toBe(1)
      expect(stats.byStatus.offer).toBe(1)
      expect(stats.byStatus.rejected).toBe(1)
    })

    it('should calculate response rate', async () => {
      const stats = await service.getStats(userId)

      // 3 responses (interviewing + offer + rejected) out of 4 total
      expect(stats.responseRate).toBe(75)
    })
  })

  describe('findByFilters', () => {
    beforeEach(async () => {
      await service.create({
        userId,
        jobTitle: 'Frontend Engineer',
        companyName: 'Tech Corp',
        applicationStatus: 'applied',
        location: 'Toronto, ON',
        salaryMin: 80000,
        salaryMax: 100000,
      })
      
      await service.create({
        userId,
        jobTitle: 'Backend Engineer',
        companyName: 'Startup Inc',
        applicationStatus: 'interviewing',
        location: 'Vancouver, BC',
        salaryMin: 90000,
        salaryMax: 120000,
      })
    })

    it('should filter by status', async () => {
      const results = await service.findByFilters(userId, {
        status: 'applied',
      })

      expect(results.applications).toHaveLength(1)
      expect(results.applications[0].applicationStatus).toBe('applied')
    })

    it('should filter by location', async () => {
      const results = await service.findByFilters(userId, {
        location: 'Toronto',
      })

      expect(results.applications.length).toBeGreaterThan(0)
      expect(results.applications[0].location).toContain('Toronto')
    })

    it('should filter by salary range', async () => {
      const results = await service.findByFilters(userId, {
        salaryMin: 85000,
      })

      expect(results.applications.length).toBeGreaterThan(0)
      results.applications.forEach(app => {
        if (app.salaryMin) {
          expect(app.salaryMin).toBeGreaterThanOrEqual(85000)
        }
      })
    })

    it('should support pagination', async () => {
      const results = await service.findByFilters(userId, {}, {
        page: 1,
        limit: 1,
      })

      expect(results.applications).toHaveLength(1)
      expect(results.pagination.total).toBe(2)
      expect(results.pagination.pages).toBe(2)
    })
  })
})

