/**
 * Test Indeed RSS Feeds
 */

import { getIndeedRSS } from './src/lib/apis/indeed-rss'

async function test() {
  console.log('🧪 Testing Indeed RSS Feeds...\n')
  
  const rss = getIndeedRSS()
  
  // Test 1: Single keyword
  console.log('Test 1: Search for "software developer" in Edmonton')
  const jobs = await rss.getJobs({
    keywords: 'software developer',
    location: 'Edmonton, AB',
    fromage: 7,
    radius: 150
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
