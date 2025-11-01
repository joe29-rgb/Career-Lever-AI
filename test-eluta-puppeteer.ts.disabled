/**
 * TEST ELUTA PUPPETEER STEALTH
 * 
 * Test Eluta scraping with Puppeteer + Stealth plugin
 * Bypasses TLS fingerprinting!
 */

import 'dotenv/config'
import { getElutaPuppeteerScraper } from './src/lib/scrapers/eluta-puppeteer'

async function testElutaPuppeteer() {
  console.log('🧪 TESTING ELUTA PUPPETEER STEALTH\n')
  console.log('Using Puppeteer with Stealth plugin')
  console.log('Bypasses TLS fingerprinting detection\n')
  
  const eluta = getElutaPuppeteerScraper()
  
  // Test with a few searches
  const tests = [
    { keyword: 'software developer', location: 'Toronto' },
    { keyword: 'nurse', location: 'Vancouver' },
    { keyword: 'accountant', location: 'Calgary' }
  ]
  
  let totalJobs = 0
  
  for (const test of tests) {
    console.log(`Testing: ${test.keyword} @ ${test.location}`)
    const jobs = await eluta.scrapeJobs(test.keyword, test.location)
    totalJobs += jobs.length
    console.log(`Found: ${jobs.length} jobs\n`)
  }
  
  // Close browser
  await eluta.closeBrowser()
  
  console.log('📊 RESULTS:\n')
  console.log(`  Total Jobs: ${totalJobs}`)
  console.log(`  Expected: ~30-90 jobs (10-30 per search)`)
  
  if (totalJobs > 20) {
    console.log('\n✅ ELUTA PUPPETEER WORKING!')
    console.log('\nFull scrape potential:')
    console.log('  6 keywords × 4 locations = 24 searches')
    console.log('  24 searches × 20 jobs = 480 jobs minimum')
    console.log('  Expected: 2,000-4,000 jobs')
  } else if (totalJobs > 0) {
    console.log('\n⚠️  Working but lower than expected')
    console.log('  Eluta may have fewer jobs for these keywords')
    console.log('  Try different keywords or locations')
  } else {
    console.log('\n❌ NO JOBS FOUND')
    console.log('  Possible issues:')
    console.log('  1. Eluta changed their HTML structure')
    console.log('  2. Still being blocked (try again)')
    console.log('  3. Network issues')
    console.log('\nDon\'t worry - you still have ATS Direct + LinkedIn!')
  }
}

testElutaPuppeteer().catch(console.error)
