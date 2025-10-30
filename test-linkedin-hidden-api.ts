/**
 * TEST LINKEDIN HIDDEN API
 * 
 * Test LinkedIn's public job search API
 * NO authentication required!
 */

import 'dotenv/config'
import { getLinkedInHiddenAPI } from './src/lib/apis/linkedin-hidden-api'

async function testLinkedInAPI() {
  console.log('🧪 TESTING LINKEDIN HIDDEN API\n')
  console.log('NO AUTHENTICATION REQUIRED!')
  console.log('Using LinkedIn\'s public job search endpoint\n')
  
  const linkedin = getLinkedInHiddenAPI()
  
  // Test with a few searches
  const tests = [
    { keyword: 'software engineer', location: 'Toronto, ON' },
    { keyword: 'data analyst', location: 'Vancouver, BC' },
    { keyword: 'registered nurse', location: 'Montreal, QC' }
  ]
  
  let totalJobs = 0
  
  for (const test of tests) {
    console.log(`Testing: ${test.keyword} @ ${test.location}`)
    const jobs = await linkedin.searchJobs(test.keyword, test.location)
    totalJobs += jobs.length
    console.log(`Found: ${jobs.length} jobs\n`)
  }
  
  console.log('📊 RESULTS:\n')
  console.log(`  Total Jobs: ${totalJobs}`)
  console.log(`  Expected: ~75-150 jobs (25-50 per search)`)
  
  if (totalJobs > 50) {
    console.log('\n✅ LINKEDIN HIDDEN API WORKING!')
    console.log('\nFull scrape potential:')
    console.log('  10 keywords × 8 locations × 2 pages = 160 searches')
    console.log('  160 searches × 25 jobs = 4,000 jobs minimum')
    console.log('  Expected: 5,000-8,000 jobs')
  } else if (totalJobs > 0) {
    console.log('\n⚠️  Working but lower than expected')
    console.log('  LinkedIn may be rate limiting')
    console.log('  Try again in a few minutes')
  } else {
    console.log('\n❌ NO JOBS FOUND')
    console.log('  Possible issues:')
    console.log('  1. LinkedIn changed their API')
    console.log('  2. Network issues')
    console.log('  3. Rate limiting')
  }
}

testLinkedInAPI().catch(console.error)
