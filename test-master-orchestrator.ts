/**
 * TEST MASTER JOB ORCHESTRATOR
 * 
 * Tests the complete system with all 3 sources:
 * - ATS Direct
 * - LinkedIn Hidden API
 * - Adzuna API
 */

import 'dotenv/config'
import { getMasterOrchestrator } from './src/lib/orchestrator/master-job-orchestrator'

async function testMasterOrchestrator() {
  console.log('🧪 TESTING MASTER JOB ORCHESTRATOR\n')
  console.log('This will test all 3 sources:\n')
  console.log('  1. ATS Direct (2,778 jobs expected)')
  console.log('  2. LinkedIn Hidden API (2,000+ jobs expected)')
  console.log('  3. Adzuna API (6,000+ jobs expected)')
  console.log('\nTotal Expected: 10,778+ jobs\n')
  console.log('─'.repeat(60))
  
  const orchestrator = getMasterOrchestrator()
  
  try {
    const result = await orchestrator.scrapeAll()
    
    console.log('\n' + '═'.repeat(60))
    console.log('🎉 TEST COMPLETE!\n')
    
    console.log('📊 RESULTS BY SOURCE:')
    result.results.forEach(r => {
      const status = r.success ? '✅' : '❌'
      console.log(`  ${status} ${r.source}: ${r.jobs.length} jobs (${r.duration}s)`)
      if (r.error) {
        console.log(`     ⚠️  Error: ${r.error}`)
      }
    })
    
    console.log('\n📈 SUMMARY:')
    console.log(`  Total Jobs: ${result.summary.total}`)
    console.log(`  Unique Jobs: ${result.summary.unique}`)
    console.log(`  Duplicates: ${result.summary.duplicates}`)
    console.log(`  Duration: ${result.summary.duration}s`)
    console.log(`  Cost: $0.00`)
    
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
    
    console.log('\n🔧 NEXT STEPS:')
    if (result.summary.unique >= 5000) {
      console.log('  1. Insert jobs to Supabase')
      console.log('  2. Set up Vercel cron job')
      console.log('  3. Deploy to production')
      console.log('  4. Monitor daily runs')
    } else {
      console.log('  1. Check error messages above')
      console.log('  2. Fix failing sources')
      console.log('  3. Re-run test')
    }
    
    console.log('\n' + '═'.repeat(60) + '\n')
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    console.error('\nCheck that:')
    console.error('  1. .env.local has ADZUNA_APP_ID and ADZUNA_API_KEY')
    console.error('  2. Internet connection is working')
    console.error('  3. All dependencies are installed')
  }
}

testMasterOrchestrator()
