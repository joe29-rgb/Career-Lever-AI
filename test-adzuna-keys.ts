/**
 * TEST ADZUNA API KEYS
 * Verify credentials are working
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { AdzunaAPIClient } from './src/lib/adzuna-api-client'

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') })

async function testAdzunaKeys() {
  console.log('🔍 TESTING ADZUNA API KEYS\n')
  
  // Check environment variables
  console.log('Environment Variables:')
  console.log(`  ADZUNA_APP_ID: ${process.env.ADZUNA_APP_ID ? '✅ Set' : '❌ Missing'}`)
  console.log(`  ADZUNA_API_KEY: ${process.env.ADZUNA_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log()
  
  try {
    // Initialize client
    const client = new AdzunaAPIClient()
    console.log('✅ Adzuna client initialized\n')
    
    // Test API call
    console.log('Testing API call: software @ Toronto\n')
    const results = await client.searchJobs({
      what: 'software',
      where: 'Toronto',
      country: 'ca',
      resultsPerPage: 10,
      page: 1
    })
    
    console.log(`✅ API CALL SUCCESSFUL!`)
    console.log(`   Found: ${results.count} total jobs`)
    console.log(`   Returned: ${results.results.length} jobs\n`)
    
    if (results.results.length > 0) {
      console.log('Sample jobs:')
      results.results.slice(0, 3).forEach((job, i) => {
        console.log(`\n${i + 1}. ${job.title}`)
        console.log(`   Company: ${job.company.display_name}`)
        console.log(`   Location: ${job.location.display_name}`)
        console.log(`   URL: ${job.redirect_url}`)
      })
    }
    
    console.log('\n\n🎉 ADZUNA API IS WORKING PERFECTLY!')
    console.log('✅ Credentials: Valid')
    console.log('✅ API Access: Working')
    console.log('✅ Ready for production!')
    
  } catch (error) {
    console.error('\n❌ ADZUNA TEST FAILED!')
    console.error('Error:', error instanceof Error ? error.message : error)
    console.error('\nPlease check:')
    console.error('  1. ADZUNA_APP_ID is set in .env.local')
    console.error('  2. ADZUNA_API_KEY is set in .env.local')
    console.error('  3. Keys are correct (no typos)')
  }
}

testAdzunaKeys()
