import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import Resume from '@/models/Resume'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const resumes = await Resume.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      resumes: resumes.map(r => ({
        _id: r._id,
        originalFileName: r.originalFileName,
        fileUrl: r.fileUrl,
        extractedText: r.extractedText,
        customizedVersions: r.customizedVersions,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }))
    })
  } catch (error) {
    console.error('List resumes error:', error)
    return NextResponse.json({ error: 'Failed to list resumes' }, { status: 500 })
  }
}


