import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import Resume from '@/models/Resume'
import JobApplication from '@/models/JobApplication'
import CoverLetter from '@/models/CoverLetter'
import Profile from '@/models/Profile'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const [profile, resumes, apps, letters] = await Promise.all([
      Profile.findOne({ userId: (session.user as any).id }).lean(),
      Resume.find({ userId: (session.user as any).id }).lean(),
      JobApplication.find({ userId: (session.user as any).id }).lean(),
      CoverLetter.find({ userId: (session.user as any).id }).lean(),
    ])
    const pkg = { profile, resumes, applications: apps, coverLetters: letters }
    const buf = Buffer.from(JSON.stringify(pkg, null, 2), 'utf8')
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    return new NextResponse(arrayBuffer as ArrayBuffer, { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="careerlever-export.json"' } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}


