/**
 * Test the complete search flow
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { JobAggregator } from './src/lib/job-aggregator'

async function testSearchFlow() {
  console.log('🧪 Testing complete search flow...\n')

  const aggregator = JobAggregator.getInstance()

  // Test 1: Search with common keywords
  console.log('Test 1: Searching for "sales" jobs in Edmonton...')
  const result1 = await aggregator.searchJobs({
    keywords: ['sales', 'business development'],
    location: 'Edmonton, AB',
    maxResults: 10
  })

  console.log(`✅ Found ${result1.jobs.length} jobs`)
  console.log(`   Source: ${result1.source}`)
  console.log(`   Cached: ${result1.cached}`)
  
  if (result1.jobs.length > 0) {
    console.log('\n📋 Sample jobs:')
    result1.jobs.slice(0, 3).forEach((job, i) => {
      console.log(`\n${i + 1}. ${job.title}`)
      console.log(`   Company: ${job.company}`)
      console.log(`   Location: ${job.location}`)
      console.log(`   URL: ${job.url}`)
      console.log(`   Source: ${job.source}`)
    })
  }

  // Test 2: Check for validation
  console.log('\n\nTest 2: Checking data quality...')
  const invalidJobs = result1.jobs.filter(job => 
    !job.title || !job.company || !job.url
  )
  
  if (invalidJobs.length > 0) {
    console.log(`❌ Found ${invalidJobs.length} invalid jobs!`)
  } else {
    console.log(`✅ All jobs have required fields`)
  }

  // Test 3: Check for duplicates
  console.log('\nTest 3: Checking for duplicates...')
  const uniqueKeys = new Set(
    result1.jobs.map(job => `${job.company}|${job.title}|${job.location}`.toLowerCase())
  )
  
  if (uniqueKeys.size !== result1.jobs.length) {
    console.log(`❌ Found ${result1.jobs.length - uniqueKeys.size} duplicates!`)
  } else {
    console.log(`✅ No duplicates found`)
  }

  console.log('\n✅ Search flow test complete!')
}

testSearchFlow().catch(console.error)
