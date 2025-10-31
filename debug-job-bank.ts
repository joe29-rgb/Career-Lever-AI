/**
 * DEBUG JOB BANK CANADA
 * Test the scraper and see what's actually returned
 */

import 'dotenv/config'
import { JobBankCanadaAPI } from './src/lib/apis/job-bank-canada'

async function debugJobBank() {
  console.log('🔍 DEBUGGING JOB BANK CANADA\n')
  
  const jobBank = new JobBankCanadaAPI()
  
  // Test 1: Single search
  console.log('TEST 1: Single search (software @ Toronto)\n')
  const results1 = await jobBank.search({
    keywords: 'software',
    location: 'Toronto',
    pageSize: 10,
    page: 1
  })
  
  console.log(`Results: ${results1.length} jobs`)
  if (results1.length > 0) {
    console.log('\nFirst job:')
    console.log(JSON.stringify(results1[0], null, 2))
  } else {
    console.log('❌ NO JOBS FOUND!')
  }
  
  // Test 2: Different keyword
  console.log('\n\nTEST 2: Different keyword (engineer @ Vancouver)\n')
  const results2 = await jobBank.search({
    keywords: 'engineer',
    location: 'Vancouver',
    pageSize: 10,
    page: 1
  })
  
  console.log(`Results: ${results2.length} jobs`)
  if (results2.length > 0) {
    console.log('\nFirst job:')
    console.log(JSON.stringify(results2[0], null, 2))
  } else {
    console.log('❌ NO JOBS FOUND!')
  }
  
  // Test 3: No location
  console.log('\n\nTEST 3: No location filter (nurse)\n')
  const results3 = await jobBank.search({
    keywords: 'nurse',
    pageSize: 10,
    page: 1
  })
  
  console.log(`Results: ${results3.length} jobs`)
  if (results3.length > 0) {
    console.log('\nFirst job:')
    console.log(JSON.stringify(results3[0], null, 2))
  } else {
    console.log('❌ NO JOBS FOUND!')
  }
  
  console.log('\n\n🔍 DIAGNOSIS:')
  const total = results1.length + results2.length + results3.length
  if (total === 0) {
    console.log('❌ Job Bank scraper is NOT working')
    console.log('Possible issues:')
    console.log('  1. HTML structure changed')
    console.log('  2. Selectors are wrong')
    console.log('  3. Rate limiting')
    console.log('  4. Site blocking requests')
  } else {
    console.log(`✅ Job Bank scraper IS working! Got ${total} jobs`)
  }
}

debugJobBank()
