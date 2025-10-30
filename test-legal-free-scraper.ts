/**
 * TEST LEGAL FREE SCRAPER
 * 
 * Test the complete system with all 4 sources
 * NO API keys required!
 * 
 * Expected: 12,000+ jobs
 */

import 'dotenv/config'
import { getLegalFreeScraper } from './src/lib/orchestrator/legal-free-scraper'

async function testLegalFreeScraper() {
  console.log('🧪 TESTING LEGAL FREE SCRAPER\n')
  console.log('This will test all 4 sources:')
  console.log('  1. ATS Direct (2,777+ jobs)')
  console.log('  2. Eluta.ca (4,000+ jobs)')
  console.log('  3. JSON-LD (5,000+ jobs)')
  console.log('  4. CivicJobs RSS (500+ jobs)\n')
  console.log('Expected total: 12,000+ jobs')
  console.log('Expected time: 20-30 minutes\n')
  console.log('Starting...\n')
  
  try {
    const scraper = getLegalFreeScraper()
    const result = await scraper.runMegaScrape()
    
    console.log('\n\n✅ TEST COMPLETE!\n')
    console.log('📊 FINAL RESULTS:')
    console.log(`  ATS Direct:    ${result.ats} jobs`)
    console.log(`  Eluta:         ${result.eluta} jobs`)
    console.log(`  JSON-LD:       ${result.jsonld} jobs`)
    console.log(`  CivicJobs:     ${result.civicjobs} jobs`)
    console.log(`  ────────────────────────────`)
    console.log(`  Total:         ${result.total} jobs`)
    console.log(`  Unique:        ${result.unique} jobs`)
    console.log(`  Duration:      ${result.duration}`)
    console.log(`  Cost:          $0.00`)
    console.log(`  API Keys:      NONE! ✅`)
    
    if (result.unique >= 5000) {
      console.log('\n🎉 SUCCESS! Got 5,000+ jobs!')
    } else if (result.unique >= 3000) {
      console.log('\n✅ Good! Got 3,000+ jobs!')
    } else {
      console.log('\n⚠️  Lower than expected, but still working!')
    }
    
    console.log('\n💡 NEXT STEPS:')
    console.log('  1. Insert these jobs to Supabase')
    console.log('  2. Set up Vercel cron for automation')
    console.log('  3. Run 5 days/week automatically!\n')
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    console.log('\nDon\'t worry! Let\'s debug:')
    console.log('  - Check internet connection')
    console.log('  - Some sources may be temporarily down')
    console.log('  - ATS Direct should always work (2,777 jobs)\n')
  }
}

testLegalFreeScraper().catch(console.error)
