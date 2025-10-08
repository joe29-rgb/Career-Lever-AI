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

    await connectToDatabase()

    // Create selected job record
    const selectedJob = await SelectedJob.create({
      userId: session.user.email,
      jobData: {
        id: jobData.id || `job-${Date.now()}`,
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        salary: jobData.salary,
        description: jobData.description,
        url: jobData.url,
        source: jobData.source || 'search',
        postedDate: jobData.postedDate,
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
  } catch (error: any) {
    console.error('[API] Store job error:', error)
    return NextResponse.json(
      { error: 'Failed to store job', details: error.message },
      { status: 500 }
    )
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

