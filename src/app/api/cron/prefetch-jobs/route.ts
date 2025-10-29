import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database'
import UserProfile from '@/models/UserProfile'
import JobSearchCache from '@/models/JobSearchCache'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * Cron job to pre-fetch jobs for all active users
 * 
 * This runs daily to populate the job cache so users see results immediately
 * when they open the Career Finder.
 * 
 * Schedule: Daily at 6 AM (before users wake up)
 * 
 * Usage with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/prefetch-jobs",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logger.info('[CRON] Starting job pre-fetch for all users...')
    
    await dbService.connect()

    // Get all users with complete profiles
    const profiles = await UserProfile.find({
      profileCompleteness: { $gte: 50 }, // Only users with 50%+ complete profiles
      'careerPreferences.targetRoles': { $exists: true, $ne: [] },
      'location.city': { $exists: true }
    })
    .select('userId careerPreferences location skills')
    .limit(100) // Process max 100 users per run
    .lean()

    logger.info(`[CRON] Found ${profiles.length} users to pre-fetch jobs for`)

    const results = {
      total: profiles.length,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // Process each user
    for (const profile of profiles) {
      try {
        // Check if user already has recent cache (< 12 hours old)
        const existingCache = await JobSearchCache.findOne({
          userId: profile.userId.toString(),
          createdAt: { $gt: new Date(Date.now() - 12 * 60 * 60 * 1000) }
        })

        if (existingCache) {
          results.skipped++
          continue
        }

        // Build search keywords from profile
        const keywords = [
          ...profile.careerPreferences.targetRoles.slice(0, 5),
          ...profile.skills.technical.slice(0, 10)
        ].filter(Boolean)

        const location = `${profile.location.city}, ${profile.location.province}`

        // Call job search API
        const searchUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/v2/job-search`)
        searchUrl.searchParams.set('jobTitle', keywords.join(', '))
        searchUrl.searchParams.set('location', location)
        searchUrl.searchParams.set('userId', profile.userId.toString())
        searchUrl.searchParams.set('maxResults', '50')

        const response = await fetch(searchUrl.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-job': 'true'
          }
        })

        if (response.ok) {
          const data = await response.json()
          logger.info(`[CRON] ✅ Pre-fetched ${data.jobs?.length || 0} jobs for user ${profile.userId}`)
          results.success++
        } else {
          logger.error(`[CRON] ❌ Failed to pre-fetch jobs for user ${profile.userId}: ${response.status}`)
          results.failed++
          results.errors.push(`User ${profile.userId}: ${response.statusText}`)
        }

        // Rate limit: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        logger.error(`[CRON] Error processing user ${profile.userId}:`, error)
        results.failed++
        results.errors.push(`User ${profile.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    logger.info('[CRON] Job pre-fetch completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Job pre-fetch completed',
      results
    })

  } catch (error) {
    logger.error('[CRON] Job pre-fetch failed:', error)
    return NextResponse.json(
      {
        error: 'Job pre-fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
