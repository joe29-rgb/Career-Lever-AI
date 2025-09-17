import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Resume from '@/models/Resume'
import JobApplication from '@/models/JobApplication'
import CoverLetter from '@/models/CoverLetter'
import { isRateLimited } from '@/lib/rate-limit'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rl = isRateLimited((session.user as any).id, 'applications:attach')
    if (rl.limited) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    await connectToDatabase()

    const app: any = await JobApplication.findOne({ _id: params.id, userId: (session.user as any).id })
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    // Find latest tailored resume version for this application
    const resumes = await Resume.find({ userId: (session.user as any).id, 'customizedVersions.jobApplicationId': app._id }).lean()
    let latestVersionId: any = null
    if (resumes?.length) {
      const versions = resumes.flatMap((r: any) => (r.customizedVersions || [])
        .filter((v: any) => String(v.jobApplicationId) === String(app._id)))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      if (versions.length) latestVersionId = versions[0]._id
    }

    // Find most recent cover letter for this company/title
    const cover = await CoverLetter.findOne({ userId: (session.user as any).id, companyName: app.companyName, jobTitle: app.jobTitle })
      .sort({ createdAt: -1 })
      .select('_id')
      .lean() as any
    const coverId = cover?._id || null

    const updated = await JobApplication.findByIdAndUpdate(app._id, {
      ...(latestVersionId && { resumeVersionId: latestVersionId }),
      ...(coverId && { coverLetterId: coverId }),
      updatedAt: new Date(),
    }, { new: true })

    return NextResponse.json({ success: true, attached: { resumeVersionId: latestVersionId, coverLetterId: coverId }, applicationId: updated?._id })
  } catch (e) {
    console.error('Attach latest error:', e)
    return NextResponse.json({ error: 'Failed to attach latest assets' }, { status: 500 })
  }
}


