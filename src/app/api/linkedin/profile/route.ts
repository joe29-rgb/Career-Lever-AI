import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'

/**
 * Fetch LinkedIn profile data using OAuth access token
 * This endpoint is called after user signs in with LinkedIn
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the LinkedIn access token from JWT
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    const accessToken = token?.linkedInAccessToken

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No LinkedIn access token found. Please sign in with LinkedIn to import your profile.' },
        { status: 400 }
      )
    }

    console.log('[LINKEDIN_API] Fetching profile data')

    // Use OpenID Connect userinfo endpoint (configured in auth.ts)
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error('[LINKEDIN_API] Profile fetch failed:', errorText)
      throw new Error(`Failed to fetch LinkedIn profile: ${profileResponse.status}`)
    }

    const profile = await profileResponse.json()
    console.log('[LINKEDIN_API] Profile data:', JSON.stringify(profile, null, 2))

    // Email is included in userinfo response
    const email = profile.email || session.user.email

    // NOTE: LinkedIn's basic OAuth only provides basic profile info (name, email, picture)
    // Advanced APIs (positions, education, skills) require LinkedIn Partner Program access
    // For now, we'll use the basic info and let users manually add experience/education
    
    // Extract LinkedIn profile URL if available
    let linkedinUrl = ''
    if (profile.sub) {
      // The 'sub' claim contains the LinkedIn member ID
      linkedinUrl = `https://www.linkedin.com/in/${profile.sub}`
    }

    // Transform to our resume format with basic info
    const resumeData = {
      personalInfo: {
        fullName: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
        email: email || '',
        phone: '',
        location: (profile.locale && typeof profile.locale === 'string') ? profile.locale.replace('_', ', ') : '',
        linkedin: linkedinUrl,
        website: '',
        summary: '' // User will need to add this manually
      },
      experience: [], // Will be empty - user needs to add manually or we scrape public profile
      education: [], // Will be empty - user needs to add manually or we scrape public profile
      skills: {
        technical: [],
        soft: [],
        languages: [],
        certifications: []
      },
      projects: [],
      // Include profile picture for reference
      profilePicture: profile.picture || null
    }

    console.log('[LINKEDIN_API] Successfully fetched and transformed profile data')

    return NextResponse.json({
      success: true,
      resumeData,
      rawProfile: profile // Include raw profile for debugging
    })

  } catch (error) {
    console.error('[LINKEDIN_API] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch LinkedIn profile',
        details: 'Make sure you have signed in with LinkedIn and granted the necessary permissions.'
      },
      { status: 500 }
    )
  }
}
