/**
 * Supabase Bulk Download Endpoint
 * Replaces MongoDB version with Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { bulkDownloadJobs } from '@/lib/supabase-bulk-download'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * BULK JOB DOWNLOAD CRON (Supabase Version)
 * 
 * Runs Tuesday & Saturday at 3 AM EST
 * Downloads ALL jobs from RapidAPI sources
 * Stores in Supabase for 2 weeks
 * 
 * Schedule: 0 8 * * 2,6 (8 AM UTC = 3 AM EST)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[BULK DOWNLOAD] Starting Supabase bulk job download...')
    
    // Define locations
    const locations = [
      'Edmonton, AB',
      'Sherwood Park, AB',
      'St. Albert, AB',
      'Spruce Grove, AB',
      'Fort Saskatchewan, AB',
      'Leduc, AB'
    ]
    
    // Bulk download
    const result = await bulkDownloadJobs(locations)
    
    return NextResponse.json({
      success: true,
      message: 'Bulk download complete (Supabase)',
      results: {
        locations: locations.length,
        downloaded: result.downloaded,
        unique: result.unique,
        inserted: result.inserted,
        errors: result.errors,
        duration: result.duration
      }
    })
    
  } catch (error: any) {
    console.error('[BULK DOWNLOAD] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
