import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import JobBoardIntegration from '@/models/JobBoardIntegration'
import { authOptions } from '@/lib/auth'
import { createJobBoardService } from '@/lib/job-board-service'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'
import { isSameOrigin } from '@/lib/security'

interface JobSubmission {
  jobBoard: string
  jobUrl: string
  applicationId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  submittedAt?: Date
  errorMessage?: string
  applicationData: {
    resumeId: string
    coverLetterId?: string
    customizations?: Record<string, any>
  }
}

interface JobBoardConfig {
  name: string
  baseUrl: string
  selectors: {
    applyButton: string
    resumeUpload: string
    coverLetterField?: string
    submitButton: string
  }
  loginRequired: boolean
  automationLevel: 'full' | 'partial' | 'manual'
}

const JOB_BOARDS: Record<string, JobBoardConfig> = {
  indeed: {
    name: 'Indeed',
    baseUrl: 'https://www.indeed.com',
    selectors: {
      applyButton: '[data-jk] .jobsearch-IndeedApplyButton-buttonWrapper button, .jobsearch-IndeedApplyButton-newDesign',
      resumeUpload: 'input[type="file"]',
      coverLetterField: 'textarea[name*="cover"], textarea[placeholder*="cover"]',
      submitButton: 'button[type="submit"], .jobsearch-IndeedApplyButton-submitButton'
    },
    loginRequired: false,
    automationLevel: 'partial'
  },
  linkedin: {
    name: 'LinkedIn',
    baseUrl: 'https://www.linkedin.com',
    selectors: {
      applyButton: '.jobs-apply-button, .job-card-container__apply-button',
      resumeUpload: 'input[type="file"]',
      coverLetterField: 'textarea[name*="message"], textarea[placeholder*="message"]',
      submitButton: '.jobs-apply-form__submit-button'
    },
    loginRequired: true,
    automationLevel: 'partial'
  },
  glassdoor: {
    name: 'Glassdoor',
    baseUrl: 'https://www.glassdoor.com',
    selectors: {
      applyButton: '.apply-button, .job-apply-button',
      resumeUpload: 'input[type="file"]',
      coverLetterField: 'textarea[name*="cover"], textarea[placeholder*="cover"]',
      submitButton: '.submit-button, button[type="submit"]'
    },
    loginRequired: true,
    automationLevel: 'partial'
  },
  monster: {
    name: 'Monster',
    baseUrl: 'https://www.monster.com',
    selectors: {
      applyButton: '.apply-button, .job-apply-btn',
      resumeUpload: 'input[type="file"]',
      coverLetterField: 'textarea[name*="cover"], textarea[placeholder*="cover"]',
      submitButton: 'button[type="submit"], .submit-btn'
    },
    loginRequired: false,
    automationLevel: 'partial'
  },
  dice: {
    name: 'Dice',
    baseUrl: 'https://www.dice.com',
    selectors: {
      applyButton: '.apply-btn, .job-apply-button',
      resumeUpload: 'input[type="file"]',
      coverLetterField: 'textarea[name*="cover"], textarea[placeholder*="cover"]',
      submitButton: 'button[type="submit"], .submit-button'
    },
    loginRequired: false,
    automationLevel: 'partial'
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 400 })
    }

    const limiter = isRateLimited((session.user as any).id, 'jobboards:submit:post')
    if (limiter.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })

    const schema = z.object({
      jobApplicationId: z.string().min(1),
      jobBoards: z.array(z.string().min(2)).min(1),
      resumeId: z.string().min(1).optional(),
      coverLetterId: z.string().min(1).optional(),
      customizations: z.record(z.any()).default({})
    })
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { jobApplicationId, jobBoards, resumeId, coverLetterId, customizations } = parsed.data as any

    await connectToDatabase()

    // Get job application
    const jobApplication = await JobApplication.findOne({
      _id: jobApplicationId,
      userId: session.user.id
    })

    if (!jobApplication) {
      return NextResponse.json(
        { error: 'Job application not found' },
        { status: 404 }
      )
    }

    // Validate resume if provided
    let resume = null
    if (resumeId) {
      const Resume = (await import('@/models/Resume')).default
      resume = await Resume.findOne({
        _id: resumeId,
        userId: session.user.id
      })
      if (!resume) {
        return NextResponse.json(
          { error: 'Resume not found' },
          { status: 404 }
        )
      }
    }

    // Validate cover letter if provided
    let coverLetter = null
    if (coverLetterId) {
      // Assuming there's a CoverLetter model - for now we'll skip validation
      // In a real implementation, you'd validate the cover letter exists
    }

    // Submit to multiple job boards
    const submissions = await Promise.allSettled(
      jobBoards.map((board: string) => submitToJobBoard({
        jobBoard: board,
        jobApplication,
        resume,
        coverLetter,
        customizations,
        userId: session.user.id
      }))
    )

    const results = submissions.map((result, index) => ({
      jobBoard: jobBoards[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))

    const successfulSubmissions = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      message: `Submitted to ${successfulSubmissions} out of ${jobBoards.length} job boards`,
      results,
      summary: {
        total: jobBoards.length,
        successful: successfulSubmissions,
        failed: jobBoards.length - successfulSubmissions
      }
    })

  } catch (error) {
    console.error('Job board submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit applications' },
      { status: 500 }
    )
  }
}

async function submitToJobBoard({
  jobBoard,
  jobApplication,
  resume,
  coverLetter,
  customizations,
  userId
}: {
  jobBoard: string
  jobApplication: any
  resume: any
  coverLetter: any
  customizations: Record<string, any>
  userId: string
}): Promise<any> {
  // First, try to use real API integration
  try {
    const integration = await JobBoardIntegration.findOne({
      userId: userId,
      boardName: jobBoard,
      status: 'connected'
    })

    if (integration && integration.accessToken) {
      // Check if token is expired
      if (integration.isTokenExpired && integration.refreshToken) {
        // Try to refresh token
        try {
          const jobBoardService = createJobBoardService(jobBoard)
          const tokenData = await jobBoardService.refreshToken(integration.refreshToken)

          // Update integration with new tokens
          integration.accessToken = tokenData.access_token
          integration.refreshToken = tokenData.refresh_token || integration.refreshToken
          integration.tokenExpiresAt = tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : undefined
          await integration.save()
        } catch (error) {
          console.warn(`Token refresh failed for ${jobBoard}:`, error)
          integration.status = 'error'
          integration.errorMessage = 'Token refresh failed'
          await integration.save()
          throw error
        }
      }

      // Check rate limits
      const jobBoardService = createJobBoardService(jobBoard)
      const withinRateLimit = await jobBoardService.checkRateLimit(integration)

      if (!withinRateLimit) {
        throw new Error('Rate limit exceeded')
      }

      // Attempt API-based application
      try {
        const applicationData = {
          jobId: extractJobIdFromUrl(jobApplication.jobUrl, jobBoard),
          resume: resume ? {
            content: resume.content,
            filename: `${resume.filename || 'resume'}.pdf`
          } : undefined,
          coverLetter: coverLetter ? coverLetter.content : undefined,
          customizations
        }

        const result = await jobBoardService.applyToJob(integration.accessToken, applicationData.jobId, applicationData)

        // Update integration stats
        await integration.incrementApplications(true)
        await jobBoardService.updateRateLimit(integration)

        return {
          jobBoard,
          status: 'success',
          method: 'api',
          applicationId: result.applicationId,
          trackingUrl: result.trackingUrl,
          message: `Successfully applied via ${jobBoardService.getConfig().displayName} API`
        }

      } catch (apiError) {
        console.warn(`API application failed for ${jobBoard}:`, apiError)

        // Update integration stats for failed attempt
        await integration.incrementApplications(false)
        await jobBoardService.updateRateLimit(integration)

        // Fall back to web scraping if API fails
        if (apiError instanceof Error && apiError.message !== 'Rate limit exceeded') {
          console.log(`Falling back to web scraping for ${jobBoard}`)
        } else {
          throw apiError // Don't fall back for rate limit errors
        }
      }
    }
  } catch (integrationError) {
    console.log(`API integration not available for ${jobBoard}, using web scraping:`, integrationError instanceof Error ? integrationError.message : 'Unknown error')
  }

  // Fall back to web scraping approach
  const boardConfig = JOB_BOARDS[jobBoard]
  if (!boardConfig) {
    throw new Error(`Unsupported job board: ${jobBoard}`)
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  })

  try {
    const page = await browser.newPage()

    // Set user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.setViewport({ width: 1366, height: 768 })

    // Navigate to job posting
    await page.goto(jobApplication.jobUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // Wait for page to load
    await new Promise(r => setTimeout(r, 3000))

    // Try to find and click apply button
    try {
      const applyButton = await page.$(boardConfig.selectors.applyButton)
      if (applyButton) {
        await applyButton.click()
        await new Promise(r => setTimeout(r, 2000))
      } else {
        // Try alternative selectors
        const alternativeSelectors = [
          'button:contains("Apply")',
          'a:contains("Apply")',
          '.apply-button',
          '.job-apply-button'
        ]

        for (const selector of alternativeSelectors) {
          try {
            await page.click(selector)
            await new Promise(r => setTimeout(r, 2000))
            break
          } catch {
            continue
          }
        }
      }
    } catch (error) {
      console.log(`Apply button not found on ${jobBoard}, might be external application`)
    }

    // Handle file uploads if present
    try {
      const fileInput = await page.$(boardConfig.selectors.resumeUpload)
      if (fileInput) {
        // In a real implementation, we'd upload the actual resume file
        // For now, we'll just note that file upload is supported
        console.log(`File upload supported on ${jobBoard}`)
      }
    } catch (error) {
      console.log(`File upload not found on ${jobBoard}`)
    }

    // Fill cover letter if present
    if (coverLetter && boardConfig.selectors.coverLetterField) {
      try {
        const coverLetterField = await page.$(boardConfig.selectors.coverLetterField)
        if (coverLetterField) {
          // In a real implementation, we'd fetch and insert the cover letter
          await page.type(boardConfig.selectors.coverLetterField, 'Generated cover letter would go here...')
        }
      } catch (error) {
        console.log(`Cover letter field not found on ${jobBoard}`)
      }
    }

    // Note: In a production system, we would NOT actually submit applications
    // as this could violate terms of service and be considered spam
    // Instead, we'd prepare the application data and guide the user

    return {
      jobBoard,
      status: 'prepared',
      message: `Application prepared for ${boardConfig.name}. User can complete submission manually.`,
      supportedFeatures: {
        fileUpload: !!boardConfig.selectors.resumeUpload,
        coverLetter: !!boardConfig.selectors.coverLetterField,
        autoSubmit: boardConfig.automationLevel === 'full'
      }
    }

  } catch (error) {
    console.error(`Error submitting to ${jobBoard}:`, error)
    throw new Error(`Failed to submit to ${jobBoard}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    await browser.close()
  }
}

// Get supported job boards
export async function GET() {
  try {
    const jobBoards = Object.keys(JOB_BOARDS).map(key => ({
      id: key,
      name: JOB_BOARDS[key].name,
      automationLevel: JOB_BOARDS[key].automationLevel,
      loginRequired: JOB_BOARDS[key].loginRequired,
      features: {
        fileUpload: !!JOB_BOARDS[key].selectors.resumeUpload,
        coverLetter: !!JOB_BOARDS[key].selectors.coverLetterField,
        autoSubmit: JOB_BOARDS[key].automationLevel === 'full'
      }
    }))

    return NextResponse.json({
      success: true,
      jobBoards
    })

  } catch (error) {
    console.error('Get job boards error:', error)
    return NextResponse.json(
      { error: 'Failed to get job boards' },
      { status: 500 }
    )
  }
}

// Helper function to extract job ID from job URL
function extractJobIdFromUrl(url: string, boardName: string): string {
  try {
    const urlObj = new URL(url)

    switch (boardName) {
      case 'linkedin':
        // LinkedIn job URLs: https://www.linkedin.com/jobs/view/1234567890
        const linkedinMatch = url.match(/\/jobs\/view\/(\d+)/)
        return linkedinMatch ? linkedinMatch[1] : url

      case 'indeed':
        // Indeed job URLs: https://www.indeed.com/viewjob?jk=1234567890
        const indeedMatch = url.match(/[?&]jk=([^&]+)/)
        return indeedMatch ? indeedMatch[1] : url

      case 'ziprecruiter':
        // ZipRecruiter job URLs: https://www.ziprecruiter.com/job/12345678
        const zipMatch = url.match(/\/job\/([^/?]+)/)
        return zipMatch ? zipMatch[1] : url

      case 'monster':
        // Monster job URLs: https://www.monster.com/job-openings/123456789
        const monsterMatch = url.match(/\/job-openings\/([^/?]+)/)
        return monsterMatch ? monsterMatch[1] : url

      case 'careerbuilder':
        // CareerBuilder job URLs: https://www.careerbuilder.com/job/1234567890
        const cbMatch = url.match(/\/job\/([^/?]+)/)
        return cbMatch ? cbMatch[1] : url

      default:
        // Fallback: try to extract any numeric ID from the URL
        const idMatch = url.match(/(\d{8,12})/)
        return idMatch ? idMatch[1] : url
    }
  } catch (error) {
    console.warn('Failed to parse job URL:', url, error)
    return url
  }
}
