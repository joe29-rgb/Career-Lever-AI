import { NextRequest, NextResponse } from 'next/server'
import { FollowUpAutomationService } from '@/lib/followup-automation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for processing

/**
 * GET /api/cron/process-followups
 * 
 * Background job to process pending follow-ups
 * Should be called by cron (Railway Cron, Vercel Cron, or external service)
 * 
 * SETUP OPTIONS:
 * 
 * 1. Railway Cron (Recommended):
 *    Add to railway.json:
 *    {
 *      "cron": [{
 *        "schedule": "0 9,14,17 * * *",
 *        "command": "curl https://yourapp.com/api/cron/process-followups"
 *      }]
 *    }
 * 
 * 2. Vercel Cron:
 *    Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/process-followups",
 *        "schedule": "0 9,14,17 * * *"
 *      }]
 *    }
 * 
 * 3. External Cron (EasyCron, cron-job.org):
 *    Set up HTTP GET to this endpoint every 3 hours
 * 
 * Security: Add CRON_SECRET env var and check it here
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[CRON] Unauthorized cron request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('[CRON] Starting follow-up processing...')
    
    // Process all pending follow-ups
    const result = await FollowUpAutomationService.processPendingFollowUps()
    
    const duration = Date.now() - startTime
    
    console.log('[CRON] Processing complete:', {
      duration: `${duration}ms`,
      ...result
    })
    
    return NextResponse.json({
      success: true,
      ...result,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[CRON] Processing error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cron/process-followups
 * Same as GET but for POST-based cron services
 */
export async function POST(request: NextRequest) {
  return GET(request)
}

