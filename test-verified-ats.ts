/**
 * TEST VERIFIED ATS COMPANIES
 * 
 * Test with companies that have VERIFIED working ATS slugs
 * Expected: 100+ jobs from 20 companies
 */

import { getATSDirectAccess } from './src/lib/apis/ats-direct-access'
import { getVerifiedCompanies, getVerifiedStats } from './src/data/verified-ats-companies'

async function test() {
  console.log('🚀 TESTING VERIFIED ATS COMPANIES\n')
  
  // Show stats
  const stats = getVerifiedStats()
  console.log('📊 VERIFIED COMPANIES DATABASE:')
  console.log(`  Total Verified: ${stats.total}`)
  console.log(`  Canadian Companies: ${stats.canadian}`)
  console.log(`\n  By ATS Platform:`)
  console.log(`    Greenhouse: ${stats.greenhouse} companies`)
  console.log(`    Lever: ${stats.lever} companies`)
  console.log(`    Workable: ${stats.workable} companies`)
  console.log(`    Ashby: ${stats.ashby} companies`)
  
  // Get all verified companies
  const companies = getVerifiedCompanies()
  
  console.log(`\n\n🎯 TESTING ${companies.length} VERIFIED COMPANIES:\n`)
  
  const ats = getATSDirectAccess()
  const jobs = await ats.fetchAllATS(companies)
  
  console.log('\n\n📊 RESULTS:')
  console.log(`  Companies Tested: ${companies.length}`)
  console.log(`  Total Jobs Found: ${jobs.length}`)
  console.log(`  Average Jobs/Company: ${Math.round(jobs.length / companies.length)}`)
  
  // Group by company
  const jobsByCompany = jobs.reduce((acc, job) => {
    const company = job.company || 'Unknown'
    acc[company] = (acc[company] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log(`\n  Jobs by Company:`)
  Object.entries(jobsByCompany)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([company, count]) => {
      console.log(`    ${company}: ${count} jobs`)
    })
  
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
  console.log(`\n💡 SUCCESS RATE: ${Object.keys(jobsByCompany).length}/${companies.length} companies have jobs`)
  console.log(`   Average per successful company: ${Math.round(jobs.length / Object.keys(jobsByCompany).length)} jobs`)
}

test().catch(console.error)
