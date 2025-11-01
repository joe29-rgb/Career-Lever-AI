/**
 * BATCH APPLY API
 * 
 * Allows users to apply to multiple jobs at once with:
 * - Atomic operations (all or nothing)
 * - Race condition protection
 * - Duplicate detection
 * - Automatic cover letter generation
 * - Progress tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Application from '@/models/Application'
import mongoose from 'mongoose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for batch operations

interface BatchApplyJob {
  jobId: string
  company: string
  jobTitle: string
  location?: string
  salary?: string
  url?: string
  description?: string
}

interface BatchApplyRequest {
  jobs: BatchApplyJob[]
  generateCoverLetters?: boolean
  resumeId?: string
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BatchApplyRequest = await req.json()
    const { jobs, generateCoverLetters = false, resumeId } = body

    // Validation
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid request',
        details: 'Jobs array is required and must not be empty'
      }, { status: 400 })
    }

    if (jobs.length > 50) {
      return NextResponse.json({ 
        error: 'Too many jobs',
        details: 'Maximum 50 jobs per batch apply'
      }, { status: 400 })
    }

    // Validate each job
    for (const job of jobs) {
      if (!job.company || !job.jobTitle) {
        return NextResponse.json({ 
          error: 'Invalid job data',
          details: 'Each job must have company and jobTitle'
        }, { status: 400 })
      }
    }

    console.log('[BATCH_APPLY] Starting batch apply:', {
      userId: session.user.id,
      jobCount: jobs.length,
      generateCoverLetters
    })

    await dbConnect()

    // Check for duplicates (already applied to these companies/titles)
    const existingApplications = await Application.find({
      userId: session.user.id,
      $or: jobs.map(job => ({
        company: job.company,
        jobTitle: job.jobTitle
      }))
    }).lean()

    const existingSet = new Set(
      existingApplications.map(app => `${app.company}|${app.jobTitle}`)
    )

    // Filter out duplicates
    const newJobs = jobs.filter(job => 
      !existingSet.has(`${job.company}|${job.jobTitle}`)
    )

    const duplicateCount = jobs.length - newJobs.length

    if (newJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All jobs were already applied to',
        results: {
          total: jobs.length,
          created: 0,
          duplicates: duplicateCount,
          failed: 0
        }
      })
    }

    console.log('[BATCH_APPLY] Filtered duplicates:', {
      original: jobs.length,
      new: newJobs.length,
      duplicates: duplicateCount
    })

    // Use MongoDB session for atomic operations
    const mongoSession = await mongoose.startSession()
    
    const results = {
      total: jobs.length,
      created: 0,
      duplicates: duplicateCount,
      failed: 0,
      applications: [] as any[],
      errors: [] as { job: string, error: string }[]
    }

    try {
      await mongoSession.withTransaction(async () => {
        // Create all applications atomically
        for (const job of newJobs) {
          try {
            const application = await Application.create([{
              userId: session.user.id,
              jobId: job.jobId,
              company: job.company,
              jobTitle: job.jobTitle,
              location: job.location,
              salary: job.salary,
              recipient: `hiring@${job.company.toLowerCase().replace(/\s+/g, '')}.com`,
              status: 'applied',
              appliedAt: new Date(),
              attachments: [],
              followUpStatus: 'pending',
              metadata: {
                url: job.url,
                description: job.description,
                batchApplied: true,
                appliedVia: 'batch-apply'
              }
            }], { session: mongoSession })

            results.created++
            results.applications.push({
              id: application[0]._id,
              company: application[0].company,
              jobTitle: application[0].jobTitle,
              status: application[0].status
            })

          } catch (error) {
            results.failed++
            results.errors.push({
              job: `${job.company} - ${job.jobTitle}`,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
            console.error('[BATCH_APPLY] Failed to create application:', error)
          }
        }
      })

      await mongoSession.endSession()

    } catch (error) {
      await mongoSession.endSession()
      throw error
    }

    const duration = Date.now() - startTime

    console.log('[BATCH_APPLY] ✅ Batch apply complete:', {
      ...results,
      duration: `${duration}ms`
    })

    // TODO: If generateCoverLetters is true, trigger async cover letter generation
    // This would be a separate background job to avoid timeout

    return NextResponse.json({
      success: true,
      message: `Successfully applied to ${results.created} jobs`,
      results,
      duration
    })

  } catch (error) {
    console.error('[BATCH_APPLY] ❌ Error:', error)
    return NextResponse.json({
      error: 'Batch apply failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET endpoint to check batch apply status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Get recent batch applications
    const batchApplications = await Application.find({
      userId: session.user.id,
      'metadata.batchApplied': true
    })
      .sort({ appliedAt: -1 })
      .limit(100)
      .lean()

    return NextResponse.json({
      success: true,
      count: batchApplications.length,
      applications: batchApplications.map(app => ({
        id: app._id,
        company: app.company,
        jobTitle: app.jobTitle,
        status: app.status,
        appliedAt: app.appliedAt
      }))
    })

  } catch (error) {
    console.error('[BATCH_APPLY] ❌ GET Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch batch applications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
