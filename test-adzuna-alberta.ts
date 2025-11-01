/**
 * TEST ADZUNA - ALL ALBERTA JOBS
 * Find every job in Alberta using Adzuna API
 */

import { AdzunaAPIClient } from './src/lib/adzuna-api-client'

const ALBERTA_CITIES = [
  'Edmonton',
  'Calgary', 
  'Red Deer',
  'Lethbridge',
  'St. Albert',
  'Medicine Hat',
  'Grande Prairie',
  'Airdrie',
  'Spruce Grove',
  'Leduc',
  'Fort McMurray'
]

const KEYWORDS = [
  // Tech
  'software', 'developer', 'engineer', 'programmer', 'IT', 'data', 'analyst',
  // Healthcare
  'nurse', 'healthcare', 'medical', 'doctor', 'pharmacist', 'dental',
  // Business
  'manager', 'accountant', 'finance', 'sales', 'marketing', 'HR',
  // Trades
  'electrician', 'plumber', 'carpenter', 'mechanic', 'welder', 'technician',
  // Service
  'retail', 'customer service', 'receptionist', 'administrative', 'driver',
  // Education
  'teacher', 'instructor', 'coordinator',
  // General
  'full time', 'part time', 'entry level'
]

async function testAdzunaAlberta() {
  console.log('🔍 TESTING ADZUNA - ALL ALBERTA JOBS')
  console.log('=' .repeat(60))
  
  const adzuna = new AdzunaAPIClient()
  
  // Check credentials
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_API_KEY) {
    console.log('\n❌ ADZUNA CREDENTIALS NOT FOUND')
    console.log('\nTo use Adzuna, add to your .env.local:')
    console.log('ADZUNA_APP_ID=your_app_id')
    console.log('ADZUNA_API_KEY=your_api_key')
    console.log('\nGet free API keys at: https://developer.adzuna.com/')
    process.exit(1)
  }

  console.log('✅ Adzuna credentials found')
  console.log(`\nSearching ${KEYWORDS.length} keywords × ${ALBERTA_CITIES.length} cities`)
  console.log('This will take ~10 minutes...\n')

  const allJobs: any[] = []
  let successCount = 0
  let errorCount = 0

  for (const city of ALBERTA_CITIES) {
    console.log(`\n📍 ${city}, AB`)
    
    for (const keyword of KEYWORDS) {
      try {
        const result = await adzuna.searchJobs({
          what: keyword,
          where: `${city}, AB`,
          country: 'ca',
          resultsPerPage: 50,
          page: 1
        })

        const jobCount = result.results?.length || 0
        if (jobCount > 0) {
          console.log(`  ✅ ${keyword.padEnd(20)} - ${jobCount} jobs`)
          allJobs.push(...result.results)
          successCount++
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.log(`  ❌ ${keyword.padEnd(20)} - ERROR: ${error instanceof Error ? error.message : 'Unknown'}`)
        errorCount++
      }
    }
  }

  // Deduplicate
  const uniqueJobs = new Map()
  allJobs.forEach(job => {
    const key = `${job.title}_${job.company?.display_name}_${job.location?.display_name}`
    if (!uniqueJobs.has(key)) {
      uniqueJobs.set(key, job)
    }
  })

  console.log('\n' + '='.repeat(60))
  console.log('📊 ADZUNA ALBERTA RESULTS')
  console.log('='.repeat(60))
  console.log(`Total API calls: ${successCount + errorCount}`)
  console.log(`Successful: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Total jobs found: ${allJobs.length}`)
  console.log(`Unique jobs: ${uniqueJobs.size}`)
  console.log(`Duplicates removed: ${allJobs.length - uniqueJobs.size}`)
  
  // Show sample jobs
  console.log('\n📋 SAMPLE JOBS:')
  Array.from(uniqueJobs.values()).slice(0, 10).forEach((job: any, i) => {
    console.log(`${i + 1}. ${job.title} at ${job.company?.display_name || 'Unknown'} - ${job.location?.display_name}`)
  })

  console.log('\n✅ TEST COMPLETE')
  process.exit(0)
}

testAdzunaAlberta().catch(error => {
  console.error('\n❌ FATAL ERROR:', error)
  process.exit(1)
})
