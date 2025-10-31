/**
 * TEST COMPLETE SYSTEM
 * 
 * Tests the entire pipeline:
 * 1. Scrape all sources
 * 2. Deduplicate
 * 3. Insert to Supabase
 * 
 * This is what the cron job will do!
 */

import 'dotenv/config'
import { getMasterOrchestrator } from './src/lib/orchestrator/master-job-orchestrator'
import { insertJobsToSupabase } from './src/lib/orchestrator/insert-to-supabase'

async function testCompleteSystem() {
  console.log('🧪 TESTING COMPLETE SYSTEM\n')
  console.log('This simulates the full cron job:\n')
  console.log('  1. Scrape ATS Direct')
  console.log('  2. Scrape LinkedIn')
  console.log('  3. Scrape Adzuna')
  console.log('  4. Deduplicate')
  console.log('  5. Insert to Supabase')
  console.log('\n' + '═'.repeat(60) + '\n')

  const startTime = Date.now()

  try {
    // Step 1: Scrape all sources
    console.log('📊 STEP 1: SCRAPING ALL SOURCES\n')
    const orchestrator = getMasterOrchestrator()
    const result = await orchestrator.scrapeAll()

    if (result.summary.unique === 0) {
      console.error('\n❌ NO JOBS SCRAPED!')
      console.error('Check that:')
      console.error('  1. Internet connection is working')
      console.error('  2. Adzuna API keys are in .env.local')
      console.error('  3. ATS companies are still accessible')
      return
    }

    // Step 2: Insert to Supabase
    console.log('\n📊 STEP 2: INSERTING TO SUPABASE\n')
    const insertResult = await insertJobsToSupabase(result.jobs)

    const totalDuration = Math.round((Date.now() - startTime) / 1000)

    // Final Summary
    console.log('\n' + '═'.repeat(60))
    console.log('🎉 COMPLETE SYSTEM TEST FINISHED!\n')

    console.log('📊 SCRAPING RESULTS:')
    result.results.forEach(r => {
      const status = r.success ? '✅' : '❌'
      console.log(`  ${status} ${r.source}: ${r.jobs.length} jobs (${r.duration}s)`)
      if (r.error) {
        console.log(`     ⚠️  Error: ${r.error}`)
      }
    })

    console.log('\n📈 DEDUPLICATION:')
    console.log(`  Total Jobs: ${result.summary.total}`)
    console.log(`  Unique Jobs: ${result.summary.unique}`)
    console.log(`  Duplicates: ${result.summary.duplicates}`)

    console.log('\n💾 SUPABASE INSERTION:')
    console.log(`  Inserted: ${insertResult.inserted}`)
    console.log(`  Errors: ${insertResult.errors}`)
    console.log(`  Success Rate: ${Math.round((insertResult.inserted / result.summary.unique) * 100)}%`)

    console.log('\n⏱️  PERFORMANCE:')
    console.log(`  Scraping: ${result.summary.duration}s`)
    console.log(`  Insertion: ${insertResult.duration}s`)
    console.log(`  Total: ${totalDuration}s`)

    console.log('\n💰 COST:')
    console.log(`  $0.00 (100% free!)`)

    console.log('\n✅ ASSESSMENT:')
    if (result.summary.unique >= 10000) {
      console.log('  🎉 EXCELLENT! Hit 10,000+ jobs goal!')
    } else if (result.summary.unique >= 5000) {
      console.log('  ✅ GOOD! Got 5,000+ jobs')
    } else if (result.summary.unique >= 2000) {
      console.log('  ⚠️  OK! Got 2,000+ jobs (some sources may be down)')
    } else {
      console.log('  ❌ LOW! Less than 2,000 jobs (check errors above)')
    }

    if (insertResult.errors > 0) {
      console.log(`  ⚠️  ${insertResult.errors} insertion errors - check Supabase logs`)
    }

    console.log('\n🚀 NEXT STEPS:')
    if (result.summary.unique >= 5000 && insertResult.errors === 0) {
      console.log('  ✅ System is working perfectly!')
      console.log('  ✅ Ready to deploy to Vercel')
      console.log('  ✅ Cron job will run Mon-Fri at 3 AM Central')
      console.log('\n  Deploy command: vercel --prod')
    } else {
      console.log('  1. Fix any errors shown above')
      console.log('  2. Re-run this test')
      console.log('  3. Deploy when all green')
    }

    console.log('\n' + '═'.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    console.error('\nCheck that:')
    console.error('  1. .env.local has all required keys:')
    console.error('     - NEXT_PUBLIC_SUPABASE_URL')
    console.error('     - SUPABASE_SERVICE_ROLE_KEY')
    console.error('     - ADZUNA_APP_ID')
    console.error('     - ADZUNA_API_KEY')
    console.error('  2. Supabase jobs table exists')
    console.error('  3. Internet connection is working')
  }
}

testCompleteSystem()
