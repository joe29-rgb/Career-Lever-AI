/**
 * TEST ADZUNA WITH CORRECT ENV LOADING
 * The issue: tsx doesn't auto-load .env.local
 * Solution: Use dotenv to load it manually
 */

import * as dotenv from 'dotenv'
import { AdzunaAPIClient } from './src/lib/adzuna-api-client'

// Load .env.local BEFORE importing anything else
dotenv.config({ path: '.env.local' })

console.log('🔍 TESTING ADZUNA - ALBERTA JOBS')
console.log('='.repeat(60))
console.log('\n✅ Environment loaded from .env.local')
console.log(`ADZUNA_APP_ID: ${process.env.ADZUNA_APP_ID ? '✅ Found' : '❌ Missing'}`)
console.log(`ADZUNA_API_KEY: ${process.env.ADZUNA_API_KEY ? '✅ Found' : '❌ Missing'}`)

async function testAdzuna() {
  try {
    const adzuna = new AdzunaAPIClient()
    
    console.log('\n📊 Searching Adzuna for Alberta jobs...\n')
    
    const searches = [
      { keyword: 'software engineer', city: 'Edmonton' },
      { keyword: 'nurse', city: 'Calgary' },
      { keyword: 'accountant', city: 'Red Deer' }
    ]
    
    let totalJobs = 0
    
    for (const { keyword, city } of searches) {
      try {
        const result = await adzuna.searchJobs({
          what: keyword,
          where: `${city}, AB`,
          country: 'ca',
          resultsPerPage: 50,
          page: 1
        })
        
        const count = result.results?.length || 0
        console.log(`✅ ${keyword.padEnd(20)} @ ${city.padEnd(15)} - ${count} jobs`)
        totalJobs += count
        
        // Show sample job
        if (result.results && result.results.length > 0) {
          const job = result.results[0]
          console.log(`   Sample: ${job.title} at ${job.company?.display_name}`)
        }
        
        await new Promise(r => setTimeout(r, 1000))
      } catch (error) {
        console.log(`❌ ${keyword.padEnd(20)} @ ${city.padEnd(15)} - ERROR: ${error instanceof Error ? error.message : 'Unknown'}`)
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ ADZUNA TEST COMPLETE - ${totalJobs} jobs found`)
    console.log('='.repeat(60))
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error)
    process.exit(1)
  }
}

testAdzuna()
