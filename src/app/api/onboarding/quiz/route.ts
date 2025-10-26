import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import User from '@/models/User'
import { validateQuizAnswers, UserProfile } from '@/lib/onboarding-utils'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await req.json()
    
    // Validate quiz answers
    const validation = validateQuizAnswers(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Prepare profile data
    const profileData: UserProfile = {
      onboardingComplete: true,
      currentSituation: body.currentSituation,
      yearsOfExperience: body.yearsOfExperience,
      targetRole: body.targetRole,
      workPreferences: body.workPreferences,
      preferredLocation: body.preferredLocation || '',
      timeline: body.timeline || 'flexible',
      urgency: body.urgency,
      completedAt: new Date(body.completedAt || new Date())
    }

    // Update user profile
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          profile: profileData,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: false }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('[ONBOARDING] ✅ Quiz completed for user:', session.user.email)
    console.log('[ONBOARDING] Profile data:', {
      situation: profileData.currentSituation,
      experience: profileData.yearsOfExperience,
      role: profileData.targetRole,
      urgency: profileData.urgency
    })

    return NextResponse.json({
      success: true,
      profile: profileData,
      redirectUrl: '/career-finder/resume'
    })
  } catch (error) {
    console.error('[ONBOARDING] Error saving quiz:', error)
    return NextResponse.json(
      { error: 'Failed to save quiz answers' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Get user profile
    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: user.profile || null,
      onboardingComplete: user.profile?.onboardingComplete || false
    })
  } catch (error) {
    console.error('[ONBOARDING] Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
