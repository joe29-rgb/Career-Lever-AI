/**
 * DEBUG CIVICJOBS RSS
 * Test the RSS feeds and see what's returned
 */

import 'dotenv/config'
import { CivicJobsRSS } from './src/lib/apis/civic-jobs-rss'

async function debugCivicJobs() {
  console.log('🔍 DEBUGGING CIVICJOBS RSS\n')
  
  const civicJobs = new CivicJobsRSS()
  
  console.log('Fetching from all RSS feeds...\n')
  
  const results = await civicJobs.fetchAllJobs()
  
  console.log(`\n📊 RESULTS: ${results.length} jobs\n`)
  
  if (results.length > 0) {
    console.log('✅ CivicJobs RSS IS WORKING!\n')
    console.log('First 3 jobs:')
    results.slice(0, 3).forEach((job, i) => {
      console.log(`\n${i + 1}. ${job.title}`)
      console.log(`   Company: ${job.company}`)
      console.log(`   Location: ${job.location}`)
      console.log(`   URL: ${job.url}`)
    })
  } else {
    console.log('❌ CivicJobs RSS is NOT working')
    console.log('\nPossible issues:')
    console.log('  1. RSS feed URLs changed')
    console.log('  2. RSS parser not working')
    console.log('  3. No jobs currently posted')
    console.log('  4. Site blocking requests')
  }
}

debugCivicJobs()
