/**
 * RUN ALL SCRAPERS NOW
 * This bypasses the API and runs scrapers directly
 */

import { getMasterOrchestrator } from './src/lib/orchestrator/master-job-orchestrator'
import { insertJobsToSupabase } from './src/lib/orchestrator/insert-to-supabase'

async function runScrapersNow() {
  console.log('🚀 RUNNING ALL SCRAPERS NOW')
  console.log('=' .repeat(60))
  console.log('Start time:', new Date().toISOString())
  console.log('')

  const startTime = Date.now()

  try {
    // Get orchestrator
    const orchestrator = getMasterOrchestrator()
    
    // Run all scrapers
    console.log('📊 SCRAPING ALL SOURCES...\n')
    const result = await orchestrator.scrapeAll()

    // Display results
    console.log('\n' + '='.repeat(60))
    console.log('📊 SCRAPING RESULTS')
    console.log('='.repeat(60))
    console.log(`Total Jobs: ${result.summary.total}`)
    console.log(`Unique Jobs: ${result.summary.unique}`)
    console.log(`Duplicates: ${result.summary.duplicates}`)
    console.log(`Duration: ${result.summary.duration}ms`)
    console.log('')

    console.log('By Source:')
    result.results.forEach(r => {
      const status = r.success ? '✅' : '❌'
      console.log(`${status} ${r.source.padEnd(25)} - ${r.jobs.length} jobs (${r.duration}ms)`)
      if (!r.success && r.error) {
        console.log(`   └─ Error: ${r.error}`)
      }
    })

    if (result.summary.unique === 0) {
      console.log('\n❌ No jobs found!')
      process.exit(1)
    }

    // Insert to Supabase
    console.log('\n📊 INSERTING TO SUPABASE...\n')
    const insertResult = await insertJobsToSupabase(result.jobs)

    console.log('\n' + '='.repeat(60))
    console.log('💾 DATABASE INSERTION')
    console.log('='.repeat(60))
    console.log(`Inserted: ${insertResult.inserted}`)
    console.log(`Errors: ${insertResult.errors}`)
    console.log(`Duration: ${insertResult.duration}ms`)

    const totalDuration = Math.round((Date.now() - startTime) / 1000)
    console.log('\n' + '='.repeat(60))
    console.log('✅ COMPLETE')
    console.log('='.repeat(60))
    console.log(`Total Duration: ${totalDuration}s`)
    console.log(`Jobs in Database: ${insertResult.inserted}`)
    console.log('')

    process.exit(0)

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error)
    process.exit(1)
  }
}

runScrapersNow()
