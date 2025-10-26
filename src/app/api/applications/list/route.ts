import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Application from '@/models/Application'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 })
    }

    await dbConnect()

    const applications = await Application.find({ userId: session.user.id })
      .sort({ appliedAt: -1 })
      .limit(50)
      .lean()

    console.log('[APPLICATIONS] ✅ Found', applications.length, 'applications for user')

    return NextResponse.json(applications.map(app => ({
      id: app._id,
      company: app.company,
      jobTitle: app.jobTitle,
      location: app.location,
      salary: app.salary,
      status: app.status,
      appliedAt: app.appliedAt,
      interviewDate: app.interviewDate,
      hasInterviewPrep: !!app.interviewPrep,
      hasSalaryData: !!app.salaryData
    })))
  } catch (error) {
    console.error('[APPLICATIONS] ❌ Error fetching applications:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch applications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
