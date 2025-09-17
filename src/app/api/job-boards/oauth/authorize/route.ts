// cleaned duplicate block

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import { createJobBoardService } from '@/lib/job-board-service'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limiter = isRateLimited((session.user as any).id, 'jobboards:oauth:authorize')
    if (limiter.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })

    await connectToDatabase()

    const schema = z.object({ boardName: z.string().min(2).max(50) })
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { boardName } = parsed.data

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

