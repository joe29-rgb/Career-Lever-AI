/**
 * TEST ATS DIRECT ACCESS
 * 
 * Test the nuclear option - direct ATS API access
 * Expected: 500+ jobs from 10 companies in 2 minutes
 */

import { getATSDirectAccess } from './src/lib/apis/ats-direct-access'
import { getPublicAPICompanies, getStats } from './src/data/alberta-companies'

async function test() {
  console.log('🚀 TESTING ATS DIRECT ACCESS - THE NUCLEAR OPTION\n')
  
  // Show stats
  const stats = getStats()
  console.log('📊 ALBERTA COMPANIES DATABASE:')
  console.log(`  Total Companies: ${stats.totalCompanies}`)
  console.log(`  Public API Companies: ${stats.publicAPICompanies}`)
  console.log(`  Estimated Total Jobs: ${stats.estimatedTotalJobs}`)
  console.log(`  Estimated Public API Jobs: ${stats.estimatedPublicAPIJobs}`)
  console.log(`\n  By ATS Platform:`)
  console.log(`    Greenhouse: ${stats.byATS.greenhouse} companies`)
  console.log(`    Lever: ${stats.byATS.lever} companies`)
  console.log(`    Workable: ${stats.byATS.workable} companies`)
  console.log(`    Ashby: ${stats.byATS.ashby} companies`)
  console.log(`    Workday: ${stats.byATS.workday} companies (OAuth required)`)
  console.log(`    Custom: ${stats.byATS.custom} companies`)
  
  // Get companies with public APIs
  const companies = getPublicAPICompanies()
  
  console.log(`\n\n🎯 TESTING ${companies.length} COMPANIES WITH PUBLIC APIs:\n`)
  
  // Test with first 10 companies
  const testCompanies = companies.slice(0, 10)
  
  const ats = getATSDirectAccess()
  const jobs = await ats.fetchAllATS(testCompanies)
  
  console.log('\n\n📊 RESULTS:')
  console.log(`  Companies Tested: ${testCompanies.length}`)
  console.log(`  Total Jobs Found: ${jobs.length}`)
  console.log(`  Average Jobs/Company: ${Math.round(jobs.length / testCompanies.length)}`)
  
  if (jobs.length > 0) {
    console.log('\n  Sample Jobs:')
    jobs.slice(0, 5).forEach((job, i) => {
      console.log(`\n  ${i + 1}. ${job.title}`)
      console.log(`     Company: ${job.company}`)
      console.log(`     Location: ${job.location}`)
      console.log(`     URL: ${job.url}`)
    })
  }
  
  console.log('\n\n✅ TEST COMPLETE!')
  console.log(`\n💡 PROJECTION: If all ${companies.length} companies have similar job counts:`)
  console.log(`   Expected Total: ${Math.round(jobs.length / testCompanies.length * companies.length)} jobs`)
}

test().catch(console.error)
