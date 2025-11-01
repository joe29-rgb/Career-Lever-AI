/**
 * TEST ELUTA.CA SCRAPER
 * 
 * Test the Eluta.ca Canadian job aggregator
 * Expected: 4,000 jobs
 */

import { getElutaScraper } from './src/lib/scrapers/eluta'

async function testEluta() {
  console.log('🔍 TESTING ELUTA.CA SCRAPER\n')
  
  const eluta = getElutaScraper()
  
  // Test with a few keywords
  const testKeywords = [
    'software developer',
    'registered nurse',
    'accountant'
  ]
  
  const testLocations = [
    'Toronto',
    'Vancouver'
  ]
  
  console.log(`Testing ${testKeywords.length} keywords × ${testLocations.length} locations\n`)
  
  const jobs = await eluta.bulkScrape(testKeywords, testLocations)
  
  console.log('\n📊 RESULTS:\n')
  console.log(`  Total Jobs: ${jobs.length}`)
  console.log(`  Expected: ~60-120 jobs (6 searches × 10-20 jobs each)`)
  
  if (jobs.length > 0) {
    console.log('\n📋 SAMPLE JOBS:\n')
    jobs.slice(0, 5).forEach((job, i) => {
      console.log(`${i + 1}. ${job.title}`)
      console.log(`   Company: ${job.company}`)
      console.log(`   Location: ${job.location}`)
      console.log(`   URL: ${job.url}\n`)
    })
    
    console.log('✅ ELUTA SCRAPER WORKING!')
    console.log('\nFull scrape potential:')
    console.log('  10 keywords × 4 cities × 10 jobs = 400 jobs per run')
    console.log('  Run 10 times with different keywords = 4,000 jobs')
  } else {
    console.log('⚠️  No jobs found. This could mean:')
    console.log('  1. Eluta.ca changed their HTML structure')
    console.log('  2. Rate limiting or blocking')
    console.log('  3. Network issues')
    console.log('\nDon\'t worry - you still have 12,000+ jobs from other sources!')
  }
}

testEluta().catch(console.error)
