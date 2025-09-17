// cleaned duplicate block

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import { createJobBoardService } from '@/lib/job-board-service'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const body = await request.json()
    const { boardName } = body

    if (!boardName) {
      return NextResponse.json(
        { error: 'Job board name is required' },
        { status: 400 }
      )
    }

    // Validate job board
    let jobBoardService
    try {
      jobBoardService = createJobBoardService(boardName)
    } catch (error) {
      return NextResponse.json(
        { error: `Unsupported job board: ${boardName}` },
        { status: 400 }
      )
    }

    // Check configuration
    const configValidation = jobBoardService.validateConfig()
    if (!configValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Job board not properly configured',
          details: configValidation.errors
        },
        { status: 500 }
      )
    }

    // Generate state parameter for security
    const state = `jobcraft_${session.user.id}_${boardName}_${Date.now()}`

    // Generate redirect URI
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/job-boards/oauth/callback?board=${boardName}`

    // Generate authorization URL
    const authUrl = jobBoardService.generateAuthUrl(state, redirectUri)

    return NextResponse.json({
      success: true,
      authUrl,
      boardName
    })

  } catch (error) {
    console.error('OAuth authorize error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}

