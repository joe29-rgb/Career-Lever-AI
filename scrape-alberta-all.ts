/**
 * SCRAPE ALL ALBERTA JOBS - NO API KEYS NEEDED
 * Uses only free scrapers that don't require credentials
 */

import { getJobBankAPI } from './src/lib/apis/job-bank-canada'
import { getLinkedInHiddenAPI } from './src/lib/apis/linkedin-hidden-api'
import { getGoogleForJobsAPI } from './src/lib/apis/google-for-jobs'
import { getCompanyCareerPagesAPI } from './src/lib/apis/company-career-pages'
import { getATSDirectAccess } from './src/lib/apis/ats-direct-access'

const ALBERTA_CITIES = [
  'Edmonton, AB',
  'Calgary, AB',
  'Red Deer, AB',
  'Lethbridge, AB',
  'Medicine Hat, AB',
  'Grande Prairie, AB',
  'Fort McMurray, AB'
]

const KEYWORDS = [
  'software engineer', 'developer', 'programmer',
  'nurse', 'healthcare', 'medical',
  'accountant', 'finance', 'analyst',
  'sales', 'marketing', 'manager',
  'electrician', 'plumber', 'mechanic',
  'retail', 'customer service', 'administrative',
  'teacher', 'driver', 'warehouse'
]

async function scrapeAlbertaAll() {
  console.log('🔍 SCRAPING ALL ALBERTA JOBS')
  console.log('=' .repeat(60))
  console.log('Sources: Job Bank, LinkedIn, Google Jobs, Company Pages, ATS')
  console.log(`Cities: ${ALBERTA_CITIES.length}`)
  console.log(`Keywords: ${KEYWORDS.length}`)
  console.log('This will take 15-20 minutes...\n')

  const startTime = Date.now()
  const allJobs: any[] = []

  // 1. JOB BANK CANADA (FREE, NO API KEY)
  console.log('\n📊 1/5 JOB BANK CANADA')
  console.log('-'.repeat(60))
  try {
    const jobBank = getJobBankAPI()
    
    for (const city of ALBERTA_CITIES) {
      for (const keyword of KEYWORDS) {
        try {
          const jobs = await jobBank.search({
            keywords: keyword,
            location: city
          })
          console.log(`✅ ${keyword.padEnd(25)} @ ${city.padEnd(20)} - ${jobs.length} jobs`)
          allJobs.push(...jobs.map(j => ({ ...j, source: 'job-bank' })))
          await new Promise(r => setTimeout(r, 1000))
        } catch (err) {
          console.log(`❌ ${keyword.padEnd(25)} @ ${city.padEnd(20)} - ERROR`)
        }
      }
    }
  } catch (error) {
    console.error('❌ Job Bank failed:', error instanceof Error ? error.message : 'Unknown')
  }

  // 2. LINKEDIN (FREE, NO API KEY)
  console.log('\n📊 2/5 LINKEDIN HIDDEN API')
  console.log('-'.repeat(60))
  try {
    const linkedin = getLinkedInHiddenAPI()
    
    for (const keyword of KEYWORDS.slice(0, 10)) { // Top 10 keywords only
      for (const city of ['Edmonton', 'Calgary']) { // Top 2 cities
        try {
          const jobs = await linkedin.searchJobs(keyword, `${city}, Alberta, Canada`, 0)
          console.log(`✅ ${keyword.padEnd(25)} @ ${city.padEnd(20)} - ${jobs.length} jobs`)
          allJobs.push(...jobs.map(j => ({ ...j, source: 'linkedin' })))
          await new Promise(r => setTimeout(r, 2000))
        } catch (err) {
          console.log(`❌ ${keyword.padEnd(25)} @ ${city.padEnd(20)} - ERROR`)
        }
      }
    }
  } catch (error) {
    console.error('❌ LinkedIn failed:', error instanceof Error ? error.message : 'Unknown')
  }

  // 3. GOOGLE FOR JOBS (FREE, NO API KEY)
  console.log('\n📊 3/5 GOOGLE FOR JOBS')
  console.log('-'.repeat(60))
  try {
    const google = getGoogleForJobsAPI()
    
    for (const keyword of KEYWORDS.slice(0, 10)) {
      for (const city of ['Edmonton, AB', 'Calgary, AB']) {
        try {
          const jobs = await google.searchJobs(keyword, city)
          console.log(`✅ ${keyword.padEnd(25)} @ ${city.padEnd(20)} - ${jobs.length} jobs`)
          allJobs.push(...jobs.map(j => ({ ...j, source: 'google' })))
          await new Promise(r => setTimeout(r, 2000))
        } catch (err) {
          console.log(`❌ ${keyword.padEnd(25)} @ ${city.padEnd(20)} - ERROR`)
        }
      }
    }
  } catch (error) {
    console.error('❌ Google Jobs failed:', error instanceof Error ? error.message : 'Unknown')
  }

  // 4. COMPANY CAREER PAGES (FREE, NO API KEY)
  console.log('\n📊 4/5 COMPANY CAREER PAGES')
  console.log('-'.repeat(60))
  try {
    const companies = getCompanyCareerPagesAPI()
    const jobs = await companies.scrapeAllCompanies()
    console.log(`✅ Scraped ${jobs.length} jobs from company pages`)
    allJobs.push(...jobs.map(j => ({ ...j, source: 'company-pages' })))
  } catch (error) {
    console.error('❌ Company Pages failed:', error instanceof Error ? error.message : 'Unknown')
  }

  // 5. ATS DIRECT ACCESS (FREE, NO API KEY)
  console.log('\n📊 5/5 ATS DIRECT ACCESS')
  console.log('-'.repeat(60))
  try {
    const ats = getATSDirectAccess()
    const jobs = await ats.fetchAllATS([])
    console.log(`✅ Scraped ${jobs.length} jobs from ATS systems`)
    allJobs.push(...jobs.map(j => ({ ...j, source: 'ats' })))
  } catch (error) {
    console.error('❌ ATS failed:', error instanceof Error ? error.message : 'Unknown')
  }

  // DEDUPLICATE
  console.log('\n📊 DEDUPLICATING...')
  const uniqueJobs = new Map()
  allJobs.forEach(job => {
    const key = `${job.title}_${job.company}_${job.location}`.toLowerCase()
    if (!uniqueJobs.has(key)) {
      uniqueJobs.set(key, job)
    }
  })

  const duration = Math.round((Date.now() - startTime) / 1000)

  // RESULTS
  console.log('\n' + '='.repeat(60))
  console.log('📊 ALBERTA JOBS - FINAL RESULTS')
  console.log('='.repeat(60))
  console.log(`Total jobs scraped: ${allJobs.length}`)
  console.log(`Unique jobs: ${uniqueJobs.size}`)
  console.log(`Duplicates removed: ${allJobs.length - uniqueJobs.size}`)
  console.log(`Duration: ${duration}s (${Math.round(duration / 60)} minutes)`)
  
  // By source
  console.log('\nBy Source:')
  const bySource = allJobs.reduce((acc: any, job: any) => {
    acc[job.source] = (acc[job.source] || 0) + 1
    return acc
  }, {})
  Object.entries(bySource).forEach(([source, count]) => {
    console.log(`  ${source.padEnd(20)} - ${count} jobs`)
  })

  // Sample jobs
  console.log('\n📋 SAMPLE ALBERTA JOBS:')
  Array.from(uniqueJobs.values()).slice(0, 20).forEach((job: any, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${job.title} at ${job.company} - ${job.location}`)
  })

  console.log('\n✅ SCRAPING COMPLETE')
  console.log(`\n💾 Found ${uniqueJobs.size} unique jobs in Alberta`)
  
  process.exit(0)
}

scrapeAlbertaAll().catch(error => {
  console.error('\n❌ FATAL ERROR:', error)
  process.exit(1)
})
