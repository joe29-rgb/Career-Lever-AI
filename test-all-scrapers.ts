/**
 * Test All Scrapers
 * Run: npx tsx test-all-scrapers.ts
 */

import { getJobBankAPI } from './src/lib/apis/job-bank-canada'
import { getIndeedRSS } from './src/lib/apis/indeed-rss'
import { getJSearchAPI } from './src/lib/apis/jsearch'
import { getLinkedInHiddenAPI } from './src/lib/apis/linkedin-hidden-api'
import { getGoogleForJobsAPI } from './src/lib/apis/google-for-jobs'
import { getCivicJobsRSS } from './src/lib/apis/civic-jobs-rss'
import { getCompanyCareerPagesAPI } from './src/lib/apis/company-career-pages'
import { getATSDirectAccess } from './src/lib/apis/ats-direct-access'

async function testScraper(name: string, testFn: () => Promise<any>) {
  console.log(`\n🧪 Testing ${name}...`)
  const startTime = Date.now()
  
  try {
    const result = await testFn()
    const duration = Date.now() - startTime
    console.log(`✅ ${name} - ${result.length || 0} jobs found (${duration}ms)`)
    if (result.length > 0) {
      console.log(`   Sample: ${result[0].title} at ${result[0].company}`)
    }
    return { name, success: true, count: result.length || 0, duration }
  } catch (error) {
    const duration = Date.now() - startTime
    console.log(`❌ ${name} - FAILED (${duration}ms)`)
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { name, success: false, count: 0, duration, error: error instanceof Error ? error.message : 'Unknown' }
  }
}

async function runAllTests() {
  console.log('🚀 Testing All Scrapers')
  console.log('=' .repeat(60))
  
  const results = []

  // Test 1: Job Bank Canada
  results.push(await testScraper('Job Bank Canada', async () => {
    const api = getJobBankAPI()
    return await api.search({
      keywords: 'software developer',
      location: 'Edmonton, AB'
    })
  }))

  // Test 2: Indeed RSS
  results.push(await testScraper('Indeed RSS', async () => {
    const api = getIndeedRSS()
    return await api.search('software engineer', 'Calgary, AB')
  }))

  // Test 3: JSearch (RapidAPI)
  results.push(await testScraper('JSearch (RapidAPI)', async () => {
    const api = getJSearchAPI()
    return await api.search({
      query: 'software developer Edmonton',
      num_pages: 1
    })
  }))

  // Test 4: LinkedIn Hidden API
  results.push(await testScraper('LinkedIn Hidden API', async () => {
    const api = getLinkedInHiddenAPI()
    return await api.searchJobs('software engineer', 'Alberta, Canada', 0)
  }))

  // Test 5: Google for Jobs
  results.push(await testScraper('Google for Jobs', async () => {
    const api = getGoogleForJobsAPI()
    return await api.searchJobs('software developer', 'Edmonton, AB')
  }))

  // Test 6: Civic Jobs RSS
  results.push(await testScraper('Civic Jobs RSS', async () => {
    const api = getCivicJobsRSS()
    return await api.scrapeAllFeeds()
  }))

  // Test 7: Company Career Pages
  results.push(await testScraper('Company Career Pages', async () => {
    const api = getCompanyCareerPagesAPI()
    return await api.scrapeAllCompanies(2, 3)
  }))

  // Test 8: ATS Direct Access
  results.push(await testScraper('ATS Direct Access', async () => {
    const api = getATSDirectAccess()
    return await api.scrapeAllATS('software', 'Edmonton', 2)
  }))

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const totalJobs = results.reduce((sum, r) => sum + r.count, 0)
  const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)

  console.log(`\n✅ Successful: ${successful}/${results.length}`)
  console.log(`❌ Failed: ${failed}/${results.length}`)
  console.log(`📦 Total Jobs Found: ${totalJobs}`)
  console.log(`⏱️  Average Duration: ${avgDuration}ms`)

  console.log('\nDetailed Results:')
  results.forEach(r => {
    const status = r.success ? '✅' : '❌'
    console.log(`${status} ${r.name.padEnd(30)} - ${r.count} jobs (${r.duration}ms)`)
    if (!r.success && r.error) {
      console.log(`   └─ ${r.error}`)
    }
  })

  // Exit with error if any failed
  if (failed > 0) {
    console.log(`\n⚠️  ${failed} scraper(s) failed`)
    process.exit(1)
  } else {
    console.log('\n🎉 All scrapers passed!')
    process.exit(0)
  }
}

runAllTests().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
