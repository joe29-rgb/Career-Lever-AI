/**
 * TEST JSEARCH API
 * 
 * Test the JSearch (Google Jobs) integration
 * Expected: 10,000 jobs from FREE tier
 */

import 'dotenv/config'
import { getJSearchAPI } from './src/lib/apis/jsearch'

async function testJSearch() {
  console.log('🔍 TESTING JSEARCH API (Google Jobs Aggregator)\n')
  
  const jsearch = getJSearchAPI()
  
  // Test with a few keywords
  const testKeywords = [
    'software developer',
    'data analyst',
    'registered nurse',
    'accountant',
    'project manager'
  ]
  
  const testLocations = [
    'Toronto, ON',
    'Vancouver, BC',
    'Calgary, AB'
  ]
  
  console.log(`Testing ${testKeywords.length} keywords × ${testLocations.length} locations\n`)
  
  const jobs = await jsearch.bulkSearch(testKeywords, testLocations, {
    datePosted: 'week',
    maxPages: 1
  })
  
  console.log('\n📊 RESULTS:\n')
  console.log(`  Total Jobs: ${jobs.length}`)
  console.log(`  Expected: ~150 jobs (15 searches × ~10 jobs each)`)
  
  if (jobs.length > 0) {
    console.log('\n📋 SAMPLE JOBS:\n')
    jobs.slice(0, 5).forEach((job, i) => {
      console.log(`${i + 1}. ${job.title}`)
      console.log(`   Company: ${job.company}`)
      console.log(`   Location: ${job.location}`)
      console.log(`   URL: ${job.url}\n`)
    })
    
    console.log('✅ JSEARCH API WORKING!')
    console.log('\nFull scrape potential:')
    console.log('  50 keywords × 5 locations × 10 jobs = 2,500 jobs per run')
    console.log('  FREE tier: 1,000 requests/month = 10,000 jobs/month')
  } else {
    console.log('❌ No jobs found. Check:')
    console.log('  1. RAPID_API_KEY in .env file')
    console.log('  2. JSearch API subscription on RapidAPI')
    console.log('  3. API key is valid')
  }
}

testJSearch().catch(console.error)
