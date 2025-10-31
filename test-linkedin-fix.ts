/**
 * TEST LINKEDIN FIX
 * Verify proxy error is resolved
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { getLinkedInHiddenAPI } from './src/lib/apis/linkedin-hidden-api'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

async function testLinkedInFix() {
  console.log('Testing LinkedIn API fix...\n')
  
  try {
    const linkedin = getLinkedInHiddenAPI()
    
    console.log('Test 1: Single search (software @ Toronto)\n')
    const jobs = await linkedin.searchJobs('software', 'Toronto', 0)
    
    console.log(`Result: ${jobs.length} jobs found`)
    
    if (jobs.length > 0) {
      console.log('\nSample job:')
      console.log(`  Title: ${jobs[0].title}`)
      console.log(`  Company: ${jobs[0].company}`)
      console.log(`  Location: ${jobs[0].location}`)
      console.log('\nSUCCESS: LinkedIn API is working!')
    } else {
      console.log('\nWARNING: No jobs found')
    }
    
  } catch (error) {
    console.error('\nERROR:', error)
    console.error('\nLinkedIn fix did not work')
  }
}

testLinkedInFix()
