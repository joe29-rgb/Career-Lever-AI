import { describe, it, expect, beforeEach } from 'vitest'
import { ResumeService } from '@/services/resume.service'
import Resume from '@/models/Resume'

describe('ResumeService', () => {
  const userId = '507f1f77bcf86cd799439011'
  let resumeService: ResumeService

  beforeEach(() => {
    resumeService = new ResumeService()
  })

  describe('create', () => {
    it('should create a new resume successfully', async () => {
      const resumeData = {
        userId,
        originalFileName: 'test-resume.pdf',
        extractedText: 'John Doe\nSoftware Engineer\n5 years experience',
        extractionMethod: 'pdf-parse',
        extractionConfidence: 0.95,
      }

      const resume = await resumeService.create(resumeData)

      expect(resume).toBeDefined()
      expect(resume.userId.toString()).toBe(userId)
      expect(resume.extractedText).toBe(resumeData.extractedText)
      expect(resume.status).toBe('processed')
    })

    it('should sanitize input text', async () => {
      const maliciousData = {
        userId,
        originalFileName: '<script>alert("xss")</script>',
        extractedText: '<img src=x onerror=alert("xss")>',
        extractionMethod: 'pasted-text',
      }

      const resume = await resumeService.create(maliciousData)

      expect(resume.originalFileName).not.toContain('<script>')
      expect(resume.extractedText).not.toContain('onerror')
    })
  })

  describe('findByUserId', () => {
    it('should return user resumes', async () => {
      // Create test resumes
      await resumeService.create({
        userId,
        originalFileName: 'resume1.pdf',
        extractedText: 'Resume 1 content',
        extractionMethod: 'pdf-parse',
      })
      
      await resumeService.create({
        userId,
        originalFileName: 'resume2.pdf',
        extractedText: 'Resume 2 content',
        extractionMethod: 'pdf-parse',
      })

      const resumes = await resumeService.findByUserId(userId)

      expect(resumes).toHaveLength(2)
      expect(resumes[0].userId.toString()).toBe(userId)
    })
  })

  describe('update', () => {
    it('should update resume successfully', async () => {
      const resume = await resumeService.create({
        userId,
        originalFileName: 'test.pdf',
        extractedText: 'Original text',
        extractionMethod: 'pdf-parse',
      })

      const updated = await resumeService.update(resume._id.toString(), {
        extractedText: 'Updated text',
      })

      expect(updated).toBeDefined()
      expect(updated?.extractedText).toBe('Updated text')
    })
  })

  describe('addCustomizedVersion', () => {
    it('should add customized version to resume', async () => {
      const resume = await resumeService.create({
        userId,
        originalFileName: 'test.pdf',
        extractedText: 'Base resume',
        extractionMethod: 'pdf-parse',
      })

      const customized = await resumeService.addCustomizedVersion(
        resume._id.toString(),
        {
          jobApplicationId: '507f1f77bcf86cd799439012',
          customizedText: 'Customized for this job',
        }
      )

      expect(customized).toBeDefined()
      expect(customized?.customizedVersions).toHaveLength(1)
      expect(customized?.customizedVersions[0].customizedText).toBe('Customized for this job')
    })
  })

  describe('delete', () => {
    it('should soft delete resume', async () => {
      const resume = await resumeService.create({
        userId,
        originalFileName: 'test.pdf',
        extractedText: 'To be deleted',
        extractionMethod: 'pdf-parse',
      })

      const deleted = await resumeService.delete(resume._id.toString())

      expect(deleted).toBe(true)
      
      // Verify it's not returned in regular queries
      const resumes = await resumeService.findByUserId(userId)
      expect(resumes).toHaveLength(0)
    })
  })

  describe('search', () => {
    beforeEach(async () => {
      await resumeService.create({
        userId,
        originalFileName: 'frontend-resume.pdf',
        extractedText: 'React, Vue, Angular, JavaScript',
        extractionMethod: 'pdf-parse',
      })
      
      await resumeService.create({
        userId,
        originalFileName: 'backend-resume.pdf',
        extractedText: 'Node.js, Python, Django, MongoDB',
        extractionMethod: 'pdf-parse',
      })
    })

    it('should search resumes by text', async () => {
      const results = await resumeService.search('React')

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].extractedText).toContain('React')
    })

    it('should return empty array when no matches', async () => {
      const results = await resumeService.search('Blockchain')

      expect(results).toHaveLength(0)
    })
  })
})

