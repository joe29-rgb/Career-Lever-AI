/**
 * Sync User Profile from Resume
 * 
 * Maps resume data to user profile for:
 * - Job search (location, keywords)
 * - Resume optimization
 * - Cover letter generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { ProfileMapper } from '@/lib/profile-mapper'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await dbService.connect()

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resumeId } = body

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID required' }, { status: 400 })
    }

    console.log('[PROFILE_SYNC] Syncing profile from resume:', {
      userId: session.user.id,
      resumeId
    })

    // Map resume to profile
    const result = await ProfileMapper.mapResumeToProfile(
      session.user.id,
      resumeId
    )

    if (!result.success) {
      return NextResponse.json({
        error: 'Profile sync failed',
        details: result.errors
      }, { status: 500 })
    }

    console.log('[PROFILE_SYNC] Profile synced successfully:', {
      completeness: result.profile?.profileCompleteness,
      location: result.profile?.location,
      warnings: result.warnings
    })

    return NextResponse.json({
      success: true,
      profile: {
        id: result.profile?._id,
        completeness: result.profile?.profileCompleteness,
        location: result.profile?.location,
        yearsExperience: result.profile?.yearsExperience,
        workExperienceCount: result.profile?.workExperience.length,
        educationCount: result.profile?.education.length,
        skillsCount: Object.values(result.profile?.skills || {}).flat().length
      },
      warnings: result.warnings
    })

  } catch (error) {
    console.error('[PROFILE_SYNC] Error:', error)
    return NextResponse.json({
      error: 'Profile sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get current profile
 */
export async function GET() {
  try {
    await dbService.connect()

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const UserProfile = (await import('@/models/UserProfile')).default
    const profile = await UserProfile.findOne({ userId: session.user.id })

    if (!profile) {
      return NextResponse.json({
        error: 'Profile not found',
        details: 'Please upload a resume first'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile._id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        yearsExperience: profile.yearsExperience,
        workExperience: profile.workExperience,
        education: profile.education,
        skills: profile.skills,
        careerPreferences: profile.careerPreferences,
        psychologyProfile: profile.psychologyProfile,
        completeness: profile.profileCompleteness,
        lastUpdated: profile.lastUpdated
      }
    })

  } catch (error) {
    console.error('[PROFILE_GET] Error:', error)
    return NextResponse.json({
      error: 'Failed to get profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
