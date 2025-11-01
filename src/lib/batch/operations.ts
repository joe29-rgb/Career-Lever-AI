/**
 * Batch Operations Service
 * Handles bulk operations for applications, cover letters, and follow-ups
 */

import Application from '@/models/Application'
import FollowUp from '@/models/FollowUp'
import Resume from '@/models/Resume'
import { dbService } from '@/lib/database'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export interface BatchApplyResult {
  successful: number
  failed: number
  results: Array<{
    jobId: string
    success: boolean
    applicationId?: string
    error?: string
  }>
}

export interface BatchCoverLetterResult {
  successful: number
  failed: number
  coverLetters: Array<{
    jobId: string
    success: boolean
    coverLetter?: string
    error?: string
  }>
}

export interface BatchFollowUpResult {
  successful: number
  failed: number
  followUps: Array<{
    applicationId: string
    success: boolean
    followUpId?: string
    scheduledFor?: Date
    error?: string
  }>
}

export interface BatchExportResult {
  success: boolean
  data?: string
  format: 'csv' | 'pdf' | 'json'
  recordCount: number
  error?: string
}

/**
 * Batch apply to multiple jobs
 */
export async function batchApplyToJobs(
  userId: string,
  jobIds: string[],
  resumeVariant?: string
): Promise<BatchApplyResult> {
  await dbService.connect()

  const results: BatchApplyResult['results'] = []
  let successful = 0
  let failed = 0

  // Get resume
  const resume = await Resume.findOne({
    _id: resumeVariant || undefined,
    userId
  }).sort({ createdAt: -1 })

  if (!resume) {
    return {
      successful: 0,
      failed: jobIds.length,
      results: jobIds.map(jobId => ({
        jobId,
        success: false,
        error: 'Resume not found'
      }))
    }
  }

  // Process each job
  for (const jobId of jobIds) {
    try {
      // In a real implementation, you'd fetch job details from your job database
      // For now, we'll create a placeholder application
      const application = new Application({
        userId,
        jobId,
        company: 'Unknown', // Would be fetched from job data
        jobTitle: 'Unknown', // Would be fetched from job data
        recipient: 'hiring@company.com', // Would be fetched from job data
        status: 'applied',
        appliedAt: new Date(),
        attachments: [resume._id.toString()],
        followUpStatus: 'pending'
      })

      await application.save()

      results.push({
        jobId,
        success: true,
        applicationId: application._id.toString()
      })
      successful++
    } catch (error) {
      results.push({
        jobId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      failed++
    }
  }

  return {
    successful,
    failed,
    results
  }
}

/**
 * Batch generate cover letters for multiple jobs
 */
export async function batchGenerateCovers(
  userId: string,
  jobIds: string[]
): Promise<BatchCoverLetterResult> {
  await dbService.connect()

  const coverLetters: BatchCoverLetterResult['coverLetters'] = []
  let successful = 0
  let failed = 0

  // Get user's resume
  const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 })
  if (!resume) {
    return {
      successful: 0,
      failed: jobIds.length,
      coverLetters: jobIds.map(jobId => ({
        jobId,
        success: false,
        error: 'Resume not found'
      }))
    }
  }

  const resumeText = resume.extractedText

  // Process each job (with rate limiting to avoid API throttling)
  for (const jobId of jobIds) {
    try {
      // In real implementation, fetch job details
      // For now, generate a generic cover letter
      const coverLetter = await PerplexityIntelligenceService.customQuery({
        systemPrompt: 'You are a professional cover letter writer. Write a concise, compelling cover letter.',
        userPrompt: `Write a cover letter for this candidate:\n\nResume: ${resumeText.slice(0, 1000)}\n\nJob ID: ${jobId}`,
        temperature: 0.7,
        maxTokens: 500
      })

      coverLetters.push({
        jobId,
        success: true,
        coverLetter: coverLetter.content
      })
      successful++

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      coverLetters.push({
        jobId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      failed++
    }
  }

  return {
    successful,
    failed,
    coverLetters
  }
}

/**
 * Batch schedule follow-ups for multiple applications
 */
export async function batchScheduleFollowUps(
  applicationIds: string[],
  daysAfter: number = 7
): Promise<BatchFollowUpResult> {
  await dbService.connect()

  const followUps: BatchFollowUpResult['followUps'] = []
  let successful = 0
  let failed = 0

  for (const applicationId of applicationIds) {
    try {
      const application = await Application.findById(applicationId)
      
      if (!application) {
        followUps.push({
          applicationId,
          success: false,
          error: 'Application not found'
        })
        failed++
        continue
      }

      // Check if follow-up already exists
      const existingFollowUp = await FollowUp.findOne({
        applicationId,
        status: { $in: ['scheduled', 'sent'] }
      })

      if (existingFollowUp) {
        followUps.push({
          applicationId,
          success: false,
          error: 'Follow-up already scheduled'
        })
        failed++
        continue
      }

      // Calculate scheduled date
      const scheduledFor = new Date(application.appliedAt)
      scheduledFor.setDate(scheduledFor.getDate() + daysAfter)

      // Generate follow-up email template
      const emailTemplate = generateFollowUpTemplate(
        application.company,
        application.jobTitle,
        application.recipient
      )

      // Create follow-up
      const followUp = new FollowUp({
        applicationId: application._id,
        userId: application.userId,
        scheduledFor,
        emailTemplate,
        emailSubject: `Following up on ${application.jobTitle} application`,
        status: 'scheduled',
        metadata: {
          recipientEmail: application.recipient,
          companyName: application.company,
          jobTitle: application.jobTitle,
          originalApplicationDate: application.appliedAt,
          daysAfterApplication: daysAfter
        }
      })

      await followUp.save()

      // Update application
      application.followUpStatus = 'scheduled'
      application.followUpScheduledAt = scheduledFor
      await application.save()

      followUps.push({
        applicationId,
        success: true,
        followUpId: followUp._id.toString(),
        scheduledFor
      })
      successful++
    } catch (error) {
      followUps.push({
        applicationId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      failed++
    }
  }

  return {
    successful,
    failed,
    followUps
  }
}

/**
 * Batch export applications in various formats
 */
export async function batchExportApplications(
  userId: string,
  format: 'csv' | 'pdf' | 'json'
): Promise<BatchExportResult> {
  await dbService.connect()

  try {
    const applications = await Application.find({ userId })
      .sort({ appliedAt: -1 })
      .lean()

    if (applications.length === 0) {
      return {
        success: false,
        format,
        recordCount: 0,
        error: 'No applications found'
      }
    }

    let data: string

    switch (format) {
      case 'csv':
        data = exportToCSV(applications)
        break
      case 'json':
        data = JSON.stringify(applications, null, 2)
        break
      case 'pdf':
        // For PDF, we'd use a library like pdfkit or puppeteer
        // For now, return a formatted text version
        data = exportToFormattedText(applications)
        break
      default:
        throw new Error(`Unsupported format: ${format}`)
    }

    return {
      success: true,
      data,
      format,
      recordCount: applications.length
    }
  } catch (error) {
    return {
      success: false,
      format,
      recordCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper functions

function generateFollowUpTemplate(
  company: string,
  jobTitle: string,
  recipient: string
): string {
  return `Dear Hiring Manager,

I hope this email finds you well. I wanted to follow up on my application for the ${jobTitle} position at ${company}, which I submitted recently.

I remain very interested in this opportunity and believe my skills and experience would be a great fit for your team. I would welcome the chance to discuss how I can contribute to ${company}'s success.

Please let me know if you need any additional information from me. I look forward to hearing from you.

Best regards`
}

function exportToCSV(applications: any[]): string {
  const headers = [
    'Company',
    'Job Title',
    'Location',
    'Salary',
    'Status',
    'Applied Date',
    'Interview Date',
    'Follow-up Status'
  ]

  const rows = applications.map(app => [
    app.company,
    app.jobTitle,
    app.location || '',
    app.salary || '',
    app.status,
    new Date(app.appliedAt).toLocaleDateString(),
    app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : '',
    app.followUpStatus || 'pending'
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

function exportToFormattedText(applications: any[]): string {
  const lines = [
    'JOB APPLICATIONS REPORT',
    '======================',
    '',
    `Total Applications: ${applications.length}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    '---',
    ''
  ]

  applications.forEach((app, index) => {
    lines.push(`${index + 1}. ${app.company} - ${app.jobTitle}`)
    lines.push(`   Status: ${app.status}`)
    lines.push(`   Applied: ${new Date(app.appliedAt).toLocaleDateString()}`)
    if (app.location) lines.push(`   Location: ${app.location}`)
    if (app.salary) lines.push(`   Salary: ${app.salary}`)
    if (app.interviewDate) {
      lines.push(`   Interview: ${new Date(app.interviewDate).toLocaleDateString()}`)
    }
    lines.push(`   Follow-up: ${app.followUpStatus || 'pending'}`)
    lines.push('')
  })

  return lines.join('\n')
}
