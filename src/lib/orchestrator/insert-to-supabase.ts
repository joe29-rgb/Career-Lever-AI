/**
 * SUPABASE INSERTION UTILITY
 * 
 * Handles batch insertion of jobs to Supabase with:
 * - Upsert logic (no duplicates)
 * - Batch processing (100 jobs per batch)
 * - Error handling
 * - Progress logging
 */

import { createClient } from '@supabase/supabase-js'
import type { Job } from '@/types/supabase'

export async function insertJobsToSupabase(jobs: Partial<Job>[]): Promise<{
  inserted: number
  updated: number
  errors: number
  duration: number
}> {
  const startTime = Date.now()
  
  console.log(`\n📥 INSERTING ${jobs.length} JOBS TO SUPABASE\n`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let inserted = 0
  let updated = 0
  let errors = 0
  const batchSize = 100

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(jobs.length / batchSize)

    try {
      // Upsert with conflict resolution on external_id
      const { data, error } = await supabase
        .from('jobs')
        .upsert(batch, { 
          onConflict: 'external_id',
          ignoreDuplicates: false 
        })
        .select('id')

      if (error) {
        console.error(`  ❌ Batch ${batchNum}/${totalBatches}: ${error.message}`)
        errors += batch.length
      } else {
        const count = data?.length || 0
        inserted += count
        console.log(`  ✅ Batch ${batchNum}/${totalBatches}: ${count} jobs`)
      }

      // Rate limiting
      if (i + batchSize < jobs.length) {
        await sleep(100)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`  ❌ Batch ${batchNum}/${totalBatches}: ${errorMessage}`)
      errors += batch.length
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000)

  console.log(`\n📊 INSERTION SUMMARY:`)
  console.log(`  Inserted: ${inserted}`)
  console.log(`  Errors: ${errors}`)
  console.log(`  Duration: ${duration}s\n`)

  return { inserted, updated, errors, duration }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
