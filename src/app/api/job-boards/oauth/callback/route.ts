import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import JobBoardIntegration from '@/models/JobBoardIntegration'
import { createJobBoardService } from '@/lib/job-board-service'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const boardName = searchParams.get('board')

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL('/job-boards?error=oauth_failed', request.url))
    }

    if (!code || !state || !boardName) {
      return NextResponse.redirect(new URL('/job-boards?error=missing_params', request.url))
    }

    // Verify state parameter for security (in production, store state in session/database)
    if (!state.startsWith('jobcraft_')) {
      return NextResponse.redirect(new URL('/job-boards?error=invalid_state', request.url))
    }

    // Extract user ID from state (format: jobcraft_{userId}_{boardName})
    const stateParts = state.split('_')
    if (stateParts.length < 3) {
      return NextResponse.redirect(new URL('/job-boards?error=invalid_state', request.url))
    }

    const userId = stateParts[1]
    if (userId !== session.user.id) {
      return NextResponse.redirect(new URL('/job-boards?error=user_mismatch', request.url))
    }

    // Create job board service
    let jobBoardService
    try {
      jobBoardService = createJobBoardService(boardName)
    } catch (error) {
      console.error('Invalid job board:', boardName)
      return NextResponse.redirect(new URL('/job-boards?error=invalid_board', request.url))
    }

    // Exchange authorization code for access token
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/job-boards/oauth/callback?board=${boardName}`

    let tokenData
    try {
      tokenData = await jobBoardService.exchangeCodeForToken(code, redirectUri)
    } catch (error) {
      console.error('Token exchange failed:', error)
      return NextResponse.redirect(new URL('/job-boards?error=token_exchange_failed', request.url))
    }

    // Get or create job board integration
    let integration = await JobBoardIntegration.findOne({
      userId: session.user.id,
      boardName: boardName
    })

    if (!integration) {
      integration = new JobBoardIntegration({
        userId: session.user.id,
        boardName: boardName,
        boardDisplayName: jobBoardService.getConfig().displayName,
        status: 'connecting'
      })
    }

    // Update integration with token data
    integration.status = 'connected'
    integration.apiKey = undefined // Not needed for OAuth
    integration.accessToken = tokenData.access_token
    integration.refreshToken = tokenData.refresh_token
    integration.tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined

    // Try to get user profile and update metadata
    try {
      const profile = await jobBoardService.getUserProfile(tokenData.access_token)
      integration.metadata = {
        ...integration.metadata,
        accountId: profile.id,
        accountName: profile.name || profile.localizedFirstName + ' ' + profile.localizedLastName,
        accountType: profile.accountType || 'personal',
        apiVersion: jobBoardService.getConfig().baseUrl.includes('/v2') ? 'v2' : 'v1'
      }
    } catch (error) {
      console.warn('Failed to get user profile:', error)
      // Continue with basic integration setup
    }

    await integration.save()

    // Redirect back to job boards page with success
    return NextResponse.redirect(new URL(`/job-boards?success=${boardName}_connected`, request.url))

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/job-boards?error=server_error', request.url))
  }
}

