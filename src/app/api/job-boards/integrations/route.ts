// cleaned duplicate header

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import JobBoardIntegration from '@/models/JobBoardIntegration'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limiter = isRateLimited((session.user as any).id, 'jobboards:integrations:get')
    if (limiter.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })

    await connectToDatabase()

    const integrations = await JobBoardIntegration.find({ userId: session.user.id })
      .select('-apiKey -accessToken -refreshToken') // Don't include sensitive data
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      integrations
    })

  } catch (error) {
    console.error('Get job board integrations error:', error)
    return NextResponse.json(
      { error: 'Failed to get job board integrations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const limiter = isRateLimited((session.user as any).id, 'jobboards:integrations:post')
    if (limiter.limited) return NextResponse.json({ error: 'Rate limit exceeded', reset: limiter.reset }, { status: 429 })

    const schema = z.object({
      boardName: z.string().min(2).max(50),
      action: z.enum(['connect','disconnect','sync']),
    })
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    const { boardName, action } = parsed.data

    // Find existing integration
    let integration = await JobBoardIntegration.findOne({
      userId: session.user.id,
      boardName
    })

    if (action === 'connect') {
      if (integration) {
        return NextResponse.json(
          { error: 'Integration already exists' },
          { status: 400 }
        )
      }

      // Create new integration
      integration = new JobBoardIntegration({
        userId: session.user.id,
        boardName,
        boardDisplayName: getBoardDisplayName(boardName),
        status: 'connecting'
      })

      await integration.save()

      // In a real implementation, this would initiate OAuth flow or API key setup
      // For now, we'll simulate a successful connection
      setTimeout(async () => {
        await integration.updateSyncStatus('success')
      }, 2000)

    } else if (action === 'disconnect') {
      if (!integration) {
        return NextResponse.json(
          { error: 'Integration not found' },
          { status: 404 }
        )
      }

      await JobBoardIntegration.deleteOne({ _id: integration._id })

      return NextResponse.json({
        success: true,
        message: 'Integration disconnected'
      })

    } else if (action === 'sync') {
      if (!integration) {
        return NextResponse.json(
          { error: 'Integration not found' },
          { status: 404 }
        )
      }

      // Trigger sync (in a real implementation, this would call the job board API)
      await integration.updateSyncStatus('syncing')

      // Simulate sync completion
      setTimeout(async () => {
        await integration.updateSyncStatus('success')
      }, 3000)

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      integration: {
        _id: integration._id,
        userId: integration.userId,
        boardName: integration.boardName,
        boardDisplayName: integration.boardDisplayName,
        status: integration.status,
        lastSyncAt: integration.lastSyncAt,
        lastSuccessfulSyncAt: integration.lastSuccessfulSyncAt,
        syncStatus: integration.syncStatus,
        totalApplications: integration.totalApplications,
        successfulApplications: integration.successfulApplications,
        lastApplicationAt: integration.lastApplicationAt,
        settings: integration.settings,
        metadata: integration.metadata,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt
      },
      message: action === 'connect' ? 'Integration created successfully' : 'Action completed'
    })

  } catch (error) {
    console.error('Job board integration action error:', error)
    return NextResponse.json(
      { error: 'Failed to process integration action' },
      { status: 500 }
    )
  }
}

function getBoardDisplayName(boardName: string): string {
  const boardNames: Record<string, string> = {
    linkedin: 'LinkedIn',
    ziprecruiter: 'ZipRecruiter',
    glassdoor: 'Glassdoor',
    monster: 'Monster',
    careerbuilder: 'CareerBuilder',
    simplyhired: 'SimplyHired',
    indeed: 'Indeed'
  }
  return boardNames[boardName] || boardName
}

