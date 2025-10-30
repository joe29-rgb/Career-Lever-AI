/**
 * Test Job Bank Canada API
 */

import { getJobBankAPI } from './src/lib/apis/job-bank-canada'

async function test() {
  console.log('🧪 Testing Job Bank Canada API...\n')
  
  const api = getJobBankAPI()
  
  // Test 1: Single keyword
  console.log('Test 1: Search for "software developer" in Edmonton')
  const jobs = await api.search({
    keywords: 'software developer',
    locationId: '9351', // Edmonton
    page: 1
  })
  
  console.log(`✅ Found ${jobs.length} jobs\n`)
  
  if (jobs.length > 0) {
    console.log('Sample job:')
    console.log(`  Title: ${jobs[0].title}`)
    console.log(`  Company: ${jobs[0].company}`)
    console.log(`  Location: ${jobs[0].location}`)
    console.log(`  URL: ${jobs[0].url}`)
  }
  
  console.log('\n🎉 Test complete!')
}

test().catch(console.error)
