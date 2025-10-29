/**
 * Test Adzuna API directly
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { AdzunaAPIClient } from './src/lib/adzuna-api-client'

async function testAdzuna() {
  console.log('🧪 Testing Adzuna API directly...\n')
  
  const adzuna = new AdzunaAPIClient()
  
  try {
    console.log('Searching for jobs in Edmonton, AB, Canada...')
    
    const result = await adzuna.searchJobs({
      what: '', // All jobs
      where: 'Edmonton, AB',
      country: 'ca',
      resultsPerPage: 50,
      page: 1,
      sortBy: 'date'
    })
    
    console.log(`\n✅ Success! Found ${result.count} total jobs`)
    console.log(`📦 Returned ${result.results.length} jobs in this page\n`)
    
    if (result.results.length > 0) {
      console.log('First 5 jobs:')
      result.results.slice(0, 5).forEach((job, i) => {
        console.log(`  ${i + 1}. ${job.title} at ${job.company.display_name}`)
        console.log(`     Location: ${job.location.display_name}`)
        console.log(`     Salary: ${job.salary_min ? `$${job.salary_min}-$${job.salary_max}` : 'Not specified'}`)
        console.log(`     URL: ${job.redirect_url}`)
        console.log('')
      })
    } else {
      console.log('⚠️  No jobs returned!')
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testAdzuna()
