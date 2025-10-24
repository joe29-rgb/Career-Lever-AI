import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

    // Get the LinkedIn access token from the session
    const account = (session as any).account
    const accessToken = account?.access_token

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No LinkedIn access token found. Please sign in with LinkedIn.' },
        { status: 400 }
      )
    }

    console.log('[LINKEDIN_API] Fetching profile data')

    // Fetch basic profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch LinkedIn profile')
    }

    const profile = await profileResponse.json()

    // Fetch email
    const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    let email = session.user.email
    if (emailResponse.ok) {
      const emailData = await emailResponse.json()
      email = emailData.elements?.[0]?.['handle~']?.emailAddress || email
    }

    // Fetch positions (work experience)
    const positionsResponse = await fetch('https://api.linkedin.com/v2/positions?q=members&projection=(elements*(company,title,timePeriod,description,location))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    let positions = []
    if (positionsResponse.ok) {
      const positionsData = await positionsResponse.json()
      positions = positionsData.elements || []
    }

    // Fetch education
    const educationResponse = await fetch('https://api.linkedin.com/v2/educations?q=members&projection=(elements*(schoolName,degreeName,fieldOfStudy,timePeriod))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    let education = []
    if (educationResponse.ok) {
      const educationData = await educationResponse.json()
      education = educationData.elements || []
    }

    // Fetch skills
    const skillsResponse = await fetch('https://api.linkedin.com/v2/skills?q=members&projection=(elements*(name))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    let skills = []
    if (skillsResponse.ok) {
      const skillsData = await skillsResponse.json()
      skills = skillsData.elements?.map((s: any) => s.name) || []
    }

    // Transform to our resume format
    const resumeData = {
      personalInfo: {
        fullName: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        email: email || '',
        phone: '',
        location: '', // LinkedIn API doesn't provide location in basic profile
        linkedin: `https://www.linkedin.com/in/${profile.vanityName || profile.id}`,
        website: '',
        summary: profile.headline || ''
      },
      experience: positions.map((pos: any, index: number) => ({
        id: `exp-${index}`,
        company: pos.company?.name || '',
        position: pos.title || '',
        location: pos.location?.name || '',
        startDate: pos.timePeriod?.startDate ? `${pos.timePeriod.startDate.year}-${String(pos.timePeriod.startDate.month).padStart(2, '0')}` : '',
        endDate: pos.timePeriod?.endDate ? `${pos.timePeriod.endDate.year}-${String(pos.timePeriod.endDate.month).padStart(2, '0')}` : 'Present',
        current: !pos.timePeriod?.endDate,
        description: pos.description || '',
        achievements: [],
        technologies: []
      })),
      education: education.map((edu: any, index: number) => ({
        id: `edu-${index}`,
        institution: edu.schoolName || '',
        degree: edu.degreeName || '',
        field: edu.fieldOfStudy || '',
        location: '',
        graduationDate: edu.timePeriod?.endDate ? `${edu.timePeriod.endDate.year}-${String(edu.timePeriod.endDate.month).padStart(2, '0')}` : '',
        gpa: '',
        honors: []
      })),
      skills: {
        technical: skills.slice(0, Math.ceil(skills.length / 2)),
        soft: skills.slice(Math.ceil(skills.length / 2)),
        languages: [],
        certifications: []
      },
      projects: []
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
