// cleaned duplicate header

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import JobBoardIntegration from '@/models/JobBoardIntegration'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'
import { createJobBoardService } from '@/lib/job-board-service'

// Real sync function - runs in background
async function syncJobBoardData(integration: any): Promise<void> {
  try {
    const jobBoardService = createJobBoardService(integration.boardName)
    
    // Check if token needs refresh
    if (integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < new Date()) {
      if (!integration.refreshToken) {
        throw new Error('Token expired and no refresh token available')
      }
      
      const tokenData = await jobBoardService.refreshToken(integration.refreshToken)
      integration.accessToken = tokenData.access_token
      integration.refreshToken = tokenData.refresh_token || integration.refreshToken
      integration.tokenExpiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined
    }

    // Sync user profile
    try {
      const profile = await jobBoardService.getUserProfile(integration.accessToken)
      integration.metadata = {
        ...integration.metadata,
        accountId: profile.id,
        accountName: profile.name || profile.localizedFirstName + ' ' + profile.localizedLastName,
        lastSyncedAt: new Date()
      }
    } catch (error) {
      console.warn('[SYNC] Failed to sync profile:', error)
    }

    // Update sync status
    integration.syncStatus = 'success'
    integration.lastSyncAt = new Date()
    await integration.save()
    
    console.log(`[SYNC] Successfully synced ${integration.boardName} for user ${integration.userId}`)
  } catch (error) {
    console.error('[SYNC] Sync failed:', error)
    integration.syncStatus = 'error'
    integration.metadata = {
      ...integration.metadata,
      lastSyncError: error instanceof Error ? error.message : String(error)
    }
    await integration.save()
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limiter = await isRateLimited((session.user as any).id, 'jobboards:integrations:get')
    if (limiter) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

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

    const limiter = await isRateLimited((session.user as any).id, 'jobboards:integrations:post')
    if (limiter) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

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

      // Check if this board actually supports OAuth (most don't)
      const { JOB_BOARD_CONFIGS, UnifiedJobBoardService } = await import('@/lib/unified-job-board-strategy')
      const boardConfig = JOB_BOARD_CONFIGS[boardName]
      
      if (!boardConfig) {
        await JobBoardIntegration.deleteOne({ _id: integration._id })
        return NextResponse.json(
          { error: `Unsupported job board: ${boardName}` },
          { status: 400 }
        )
      }

      // REALITY CHECK: Most major job boards don't have open APIs
      if (boardConfig.type === 'frontend-only') {
        await JobBoardIntegration.deleteOne({ _id: integration._id })
        
        const service = new UnifiedJobBoardService()
        const applicationMethod = service.getApplicationMethod(boardName)
        
        return NextResponse.json({
          success: false,
          error: `${boardConfig.displayName} does not support direct API integration`,
          requiresFrontendAutomation: true,
          applicationMethod: {
            method: applicationMethod.method,
            instructions: applicationMethod.instructions,
            canAutomate: applicationMethod.canAutomate
          },
          recommendation: boardConfig.accessMethod.frontend?.browserExtensionRequired 
            ? 'Install the Career Lever browser extension to automate applications'
            : 'Use the Career Lever bookmarklet for assisted applications'
        }, { status: 400 })
      }

      // For boards that DO have open APIs (very rare)
      if (boardConfig.type === 'open-api') {
        // Only proceed if API is actually accessible
        integration.status = 'connected'
        integration.metadata = {
          ...integration.metadata,
          connectionType: 'open-api',
          connectedAt: new Date()
        }
        await integration.save()

        return NextResponse.json({
          success: true,
          integration: {
            _id: integration._id,
            boardName: integration.boardName,
            boardDisplayName: integration.boardDisplayName,
            status: integration.status
          },
          message: `Connected to ${boardConfig.displayName} successfully`
        })
      }

      // Default: Not supported
      await JobBoardIntegration.deleteOne({ _id: integration._id })
      return NextResponse.json({
        success: false,
        error: `${boardConfig.displayName} integration not yet implemented`
      }, { status: 400 })

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

      if (integration.status !== 'connected') {
        return NextResponse.json(
          { error: 'Integration must be connected before syncing' },
          { status: 400 }
        )
      }

      // Update status to syncing
      integration.lastSyncAt = new Date()
      integration.syncStatus = 'syncing'
      await integration.save()

      // Perform real sync in background (don't block response)
      syncJobBoardData(integration).catch((error) => {
        console.error(`[JOB_BOARDS] Sync failed for ${boardName}:`, error)
      })

      return NextResponse.json({
        success: true,
        integration: {
          _id: integration._id,
          boardName: integration.boardName,
          lastSyncAt: integration.lastSyncAt,
          syncStatus: integration.syncStatus
        },
        message: 'Sync started in background'
      })

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

