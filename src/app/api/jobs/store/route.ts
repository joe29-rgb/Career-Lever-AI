/**
 * Store Selected Job API
 * Saves a job selection for analysis in the Career Finder workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import { SelectedJob } from '@/models/SelectedJob'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const jobData = await request.json()

    // Don't fail if database storage fails - job is already in localStorage
    try {
      await connectToDatabase()

      // ENTERPRISE FIX: Ensure all required fields have defaults
      const selectedJob = await SelectedJob.create({
        userId: session.user.email,
        jobData: {
          id: jobData.id || `job-${Date.now()}`,
          title: jobData.title || 'Untitled Position',
          company: jobData.company || 'Company Name Unavailable',
          location: jobData.location || 'Location Not Specified',
          salary: jobData.salary || 'Not Disclosed',
          description: jobData.description || jobData.summary || 'No description available for this position.',
          url: jobData.url || '',
          source: jobData.source || 'search',
          postedDate: jobData.postedDate || new Date().toISOString(),
          skills: jobData.skills || [],
          requirements: jobData.requirements || [],
        },
        selectedAt: new Date(),
        status: 'pending_analysis'
      })

      return NextResponse.json({
        success: true,
        jobId: selectedJob._id,
        message: 'Job stored successfully'
      })
    } catch (dbError: any) {
      // Database storage failed but job is in localStorage, so don't block user
      console.error('[API] Store job DB error (non-blocking):', dbError.message)
      return NextResponse.json({
        success: true,
        jobId: 'local-only',
        message: 'Job stored in browser (database unavailable)',
        warning: 'Job history not saved to account'
      })
    }
  } catch (error: any) {
    console.error('[API] Store job error:', error)
    // Even if this fails, the job is in localStorage, so return success
    return NextResponse.json({
      success: true,
      jobId: 'local-only',
      message: 'Job stored locally',
      warning: 'Could not save to account'
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Get user's most recent selected job
    const recentJob = await SelectedJob.findOne({ 
      userId: session.user.email 
    }).sort({ selectedAt: -1 })

    if (!recentJob) {
      return NextResponse.json({ job: null })
    }

    return NextResponse.json({
      success: true,
      job: recentJob.jobData
    })
  } catch (error: any) {
    console.error('[API] Get selected job error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve job', details: error.message },
      { status: 500 }
    )
  }
}

