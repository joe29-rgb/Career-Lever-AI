import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Application from '@/models/Application'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId, company, jobTitle, location, salary, recipient } = await req.json()
    
    if (!company || !jobTitle) {
      return NextResponse.json({ error: 'Company and job title are required' }, { status: 400 })
    }

    await dbConnect()

    const application = await Application.create({
      userId: session.user.id,
      jobId,
      company,
      jobTitle,
      location,
      salary,
      recipient: recipient || 'hiring@' + company.toLowerCase().replace(/\s+/g, '') + '.com',
      status: 'applied',
      appliedAt: new Date(),
      attachments: [],
      metadata: {}
    })

    console.log('[APPLICATIONS] ✅ Created application:', application._id, 'for', company)

    return NextResponse.json({ 
      success: true, 
      application: {
        id: application._id,
        company: application.company,
        jobTitle: application.jobTitle,
        status: application.status,
        appliedAt: application.appliedAt
      }
    })
  } catch (error) {
    console.error('[APPLICATIONS] ❌ Error creating application:', error)
    return NextResponse.json({ 
      error: 'Failed to create application',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
