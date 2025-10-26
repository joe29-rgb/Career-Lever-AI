import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import User from '@/models/User'
import Profile from '@/models/Profile'
import Resume from '@/models/Resume'
import JobApplication from '@/models/JobApplication'
import CoverLetter from '@/models/CoverLetter'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectToDatabase()
    const { email } = await req.json()
    if (!email || email.toLowerCase() !== (session.user.email || '').toLowerCase()) return NextResponse.json({ error: 'Email mismatch' }, { status: 400 })
    // Soft delete: anonymize user data, remove artifacts
    const user = await User.findOne({ email })
    if (!user) return NextResponse.json({ success: true })
    const userId = user._id
    await Promise.all([
      Resume.deleteMany({ userId }),
      JobApplication.deleteMany({ userId }),
      CoverLetter.deleteMany({ userId }),
      Profile.deleteOne({ userId }),
    ])
    user.name = 'Deleted User'
    user.image = undefined
    user.location = undefined
    user.skills = []
    user.experience = ''
    await user.save()
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to process deletion' }, { status: 500 })
  }
}


