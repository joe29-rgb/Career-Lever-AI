/**
 * VERCEL CRON JOB: SCRAPE JOBS
 * 
 * Runs Mon-Fri at 3 AM Central (9 AM UTC)
 * 
 * Process:
 * 1. Verify cron secret
 * 2. Scrape all sources (ATS + LinkedIn + Adzuna)
 * 3. Deduplicate jobs
 * 4. Insert to Supabase
 * 5. Return summary
 * 
 * Expected: 10,778+ jobs per run
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMasterOrchestrator } from '@/lib/orchestrator/master-job-orchestrator'
import { insertJobsToSupabase } from '@/lib/orchestrator/insert-to-supabase'

export const maxDuration = 300 // 5 minutes max
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  console.log('\n🚀 CRON JOB STARTED:', new Date().toISOString())

  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedAuth) {
    console.error('❌ Unauthorized cron request')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Step 1: Scrape all sources
    console.log('\n📊 STEP 1: SCRAPING ALL SOURCES\n')
    const orchestrator = getMasterOrchestrator()
    const result = await orchestrator.scrapeAll()

    if (result.summary.unique === 0) {
      console.error('❌ No jobs scraped!')
      return NextResponse.json({
        success: false,
        error: 'No jobs scraped',
        results: result.results
      }, { status: 500 })
    }

    // Step 2: Insert to Supabase
    console.log('\n📊 STEP 2: INSERTING TO SUPABASE\n')
    const insertResult = await insertJobsToSupabase(result.jobs)

    const totalDuration = Math.round((Date.now() - startTime) / 1000)

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      scraping: {
        total: result.summary.total,
        unique: result.summary.unique,
        duplicates: result.summary.duplicates,
        duration: result.summary.duration
      },
      insertion: {
        inserted: insertResult.inserted,
        errors: insertResult.errors,
        duration: insertResult.duration
      },
      sources: result.results.map(r => ({
        name: r.source,
        jobs: r.jobs.length,
        success: r.success,
        error: r.error || null,
        duration: r.duration
      })),
      totalDuration
    }

    console.log('\n✅ CRON JOB COMPLETED')
    console.log('📊 FINAL SUMMARY:', JSON.stringify(summary, null, 2))

    return NextResponse.json(summary)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('\n❌ CRON JOB FAILED:', errorMessage)

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
