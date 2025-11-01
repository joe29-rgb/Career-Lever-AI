/**
 * COMPLETE ALBERTA JOB SCRAPER
 * ALL SOURCES: Adzuna, Eluta, Job Bank, LinkedIn, Google, Companies, ATS
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { AdzunaAPIClient } from './src/lib/adzuna-api-client'
import { getElutaRSS } from './src/lib/apis/eluta-rss'
import { getJobBankAPI } from './src/lib/apis/job-bank-canada'
import { getLinkedInHiddenAPI } from './src/lib/apis/linkedin-hidden-api'
import { getGoogleForJobsAPI } from './src/lib/apis/google-for-jobs'
import { getCompanyCareerPagesAPI } from './src/lib/apis/company-career-pages'
import { getATSDirectAccess } from './src/lib/apis/ats-direct-access'
import { getIndeedRSS } from './src/lib/apis/indeed-rss'
import { getJSearchAPI } from './src/lib/apis/jsearch'

const ALBERTA_CITIES = ['Edmonton', 'Calgary', 'Red Deer', 'Lethbridge', 'Medicine Hat', 'Grande Prairie']
const KEYWORDS = ['software', 'engineer', 'nurse', 'healthcare', 'accountant', 'sales', 'manager', 'technician', 'driver', 'retail']

async function scrapeAlbertaComplete() {
  console.log('🚀 COMPLETE ALBERTA JOB SCRAPER')
  console.log('='.repeat(60))
  console.log('Sources: Adzuna, Eluta, Job Bank, LinkedIn, Google, Indeed, JSearch, Companies, ATS')
  console.log(`Cities: ${ALBERTA_CITIES.length} | Keywords: ${KEYWORDS.length}`)
  console.log('Estimated time: 20-30 minutes\n')

  const startTime = Date.now()
  const allJobs: any[] = []
  const results: any[] = []

  // 1. ADZUNA (FREE API - 6K+ jobs potential)
  console.log('\n📊 1/9 ADZUNA API')
  console.log('-'.repeat(60))
  try {
    const adzuna = new AdzunaAPIClient()
    let adzunaCount = 0
    
    for (const city of ALBERTA_CITIES) {
      for (const keyword of KEYWORDS) {
        try {
          const result = await adzuna.searchJobs({
            what: keyword,
            where: `${city}, AB`,
            country: 'ca',
            resultsPerPage: 50,
            page: 1
          })
          const jobs = result.results || []
          adzunaCount += jobs.length
          allJobs.push(...jobs.map((j: any) => ({ ...j, source: 'adzuna' })))
          console.log(`✅ ${keyword.padEnd(15)} @ ${city.padEnd(15)} - ${jobs.length} jobs`)
          await new Promise(r => setTimeout(r, 500))
        } catch (err) {
          console.log(`❌ ${keyword.padEnd(15)} @ ${city.padEnd(15)} - ERROR`)
        }
      }
    }
    results.push({ source: 'Adzuna', count: adzunaCount, success: true })
  } catch (error) {
    results.push({ source: 'Adzuna', count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' })
  }

  // 2. ELUTA RSS (FREE - 2K+ jobs potential)
  console.log('\n📊 2/9 ELUTA RSS')
  console.log('-'.repeat(60))
  try {
    const eluta = getElutaRSS()
    let elutaCount = 0
    
    for (const city of ALBERTA_CITIES) {
      for (const keyword of KEYWORDS) {
        const jobs = await eluta.searchJobs({ keywords: keyword, location: `${city} AB`, maxResults: 50 })
        elutaCount += jobs.length
        allJobs.push(...jobs)
        console.log(`✅ ${keyword.padEnd(15)} @ ${city.padEnd(15)} - ${jobs.length} jobs`)
        await new Promise(r => setTimeout(r, 1000))
      }
    }
    results.push({ source: 'Eluta', count: elutaCount, success: true })
  } catch (error) {
    results.push({ source: 'Eluta', count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' })
  }

  // 3. JOB BANK CANADA (FREE - 3K+ jobs)
  console.log('\n📊 3/9 JOB BANK CANADA')
  console.log('-'.repeat(60))
  try {
    const jobBank = getJobBankAPI()
    let jobBankCount = 0
    
    for (const city of ALBERTA_CITIES.slice(0, 3)) { // Top 3 cities
      for (const keyword of KEYWORDS) {
        const jobs = await jobBank.search({ keywords: keyword, location: `${city}, AB` })
        jobBankCount += jobs.length
        allJobs.push(...jobs)
        console.log(`✅ ${keyword.padEnd(15)} @ ${city.padEnd(15)} - ${jobs.length} jobs`)
        await new Promise(r => setTimeout(r, 1000))
      }
    }
    results.push({ source: 'Job Bank', count: jobBankCount, success: true })
  } catch (error) {
    results.push({ source: 'Job Bank', count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' })
  }

  // 4. LINKEDIN (FREE - 500+ jobs)
  console.log('\n📊 4/9 LINKEDIN')
  console.log('-'.repeat(60))
  try {
    const linkedin = getLinkedInHiddenAPI()
    let linkedinCount = 0
    
    for (const keyword of KEYWORDS.slice(0, 5)) {
      for (const city of ['Edmonton', 'Calgary']) {
        const jobs = await linkedin.searchJobs(keyword, `${city}, Alberta`, 0)
        linkedinCount += jobs.length
        allJobs.push(...jobs)
        console.log(`✅ ${keyword.padEnd(15)} @ ${city.padEnd(15)} - ${jobs.length} jobs`)
        await new Promise(r => setTimeout(r, 2000))
      }
    }
    results.push({ source: 'LinkedIn', count: linkedinCount, success: true })
  } catch (error) {
    results.push({ source: 'LinkedIn', count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' })
  }

  // 5. INDEED RSS (FREE - 1K+ jobs)
  console.log('\n📊 5/9 INDEED RSS')
  console.log('-'.repeat(60))
  try {
    const indeed = getIndeedRSS()
    let indeedCount = 0
    
    for (const keyword of KEYWORDS.slice(0, 5)) {
      const jobs = await indeed.getJobs({ keywords: keyword, location: 'Alberta', fromage: 7 })
      indeedCount += jobs.length
      allJobs.push(...jobs)
      console.log(`✅ ${keyword.padEnd(15)} - ${jobs.length} jobs`)
      await new Promise(r => setTimeout(r, 2000))
    }
    results.push({ source: 'Indeed', count: indeedCount, success: true })
  } catch (error) {
    results.push({ source: 'Indeed', count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' })
  }

  // 6. JSEARCH (RAPIDAPI - 500+ jobs)
  console.log('\n📊 6/9 JSEARCH')
  console.log('-'.repeat(60))
  try {
    const jsearch = getJSearchAPI()
    let jsearchCount = 0
    
    for (const keyword of KEYWORDS.slice(0, 5)) {
      const jobs = await jsearch.search({ query: `${keyword} Alberta`, num_pages: 1 })
      jsearchCount += jobs.length
      allJobs.push(...jobs)
      console.log(`✅ ${keyword.padEnd(15)} - ${jobs.length} jobs`)
      await new Promise(r => setTimeout(r, 1000))
    }
    results.push({ source: 'JSearch', count: jsearchCount, success: true })
  } catch (error) {
    results.push({ source: 'JSearch', count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' })
  }

  // 7. GOOGLE JOBS (FREE - 200+ jobs)
  console.log('\n📊 7/9 GOOGLE FOR JOBS')
  console.log('-'.repeat(60))
  try {
    const google = getGoogleForJobsAPI()
    let googleCount = 0
    
    for (const keyword of KEYWORDS.slice(0, 5)) {
      const jobs = await google.searchJobs(keyword, 'Edmonton, AB')
      googleCount += jobs.length
      allJobs.push(...jobs)
      console.log(`✅ ${keyword.padEnd(15)} - ${jobs.length} jobs`)
      await new Promise(r => setTimeout(r, 2000))
    }
    results.push({ source: 'Google', count: googleCount, success: true })
  } catch (error) {
    results.push({ source: 'Google', count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' })
  }

  // 8. COMPANY PAGES (FREE - 50+ jobs)
  console.log('\n📊 8/9 COMPANY CAREER PAGES')
  console.log('-'.repeat(60))
  try {
    const companies = getCompanyCareerPagesAPI()
    const jobs = await companies.scrapeAllCompanies()
    allJobs.push(...jobs)
    results.push({ source: 'Companies', count: jobs.length, success: true })
    console.log(`✅ Scraped ${jobs.length} jobs`)
  } catch (error) {
    results.push({ source: 'Companies', count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' })
  }

  // 9. ATS DIRECT (FREE - 500+ jobs)
  console.log('\n📊 9/9 ATS DIRECT ACCESS')
  console.log('-'.repeat(60))
  try {
    const ats = getATSDirectAccess()
    const jobs = await ats.fetchAllATS([])
    allJobs.push(...jobs)
    results.push({ source: 'ATS', count: jobs.length, success: true })
    console.log(`✅ Scraped ${jobs.length} jobs`)
  } catch (error) {
    results.push({ source: 'ATS', count: 0, success: false, error: error instanceof Error ? error.message : 'Unknown' })
  }

  // DEDUPLICATE
  console.log('\n📊 DEDUPLICATING...')
  const uniqueJobs = new Map()
  allJobs.forEach(job => {
    const key = `${job.title}_${job.company}_${job.location}`.toLowerCase().replace(/\s+/g, '')
    if (!uniqueJobs.has(key)) {
      uniqueJobs.set(key, job)
    }
  })

  const duration = Math.round((Date.now() - startTime) / 1000)

  // FINAL RESULTS
  console.log('\n' + '='.repeat(60))
  console.log('📊 COMPLETE ALBERTA SCRAPE - FINAL RESULTS')
  console.log('='.repeat(60))
  console.log(`Total jobs scraped: ${allJobs.length}`)
  console.log(`Unique jobs: ${uniqueJobs.size}`)
  console.log(`Duplicates removed: ${allJobs.length - uniqueJobs.size}`)
  console.log(`Duration: ${duration}s (${Math.round(duration / 60)} minutes)`)
  
  console.log('\nBy Source:')
  results.forEach(r => {
    const status = r.success ? '✅' : '❌'
    console.log(`${status} ${r.source.padEnd(20)} - ${r.count} jobs`)
    if (r.error) console.log(`   └─ ${r.error}`)
  })

  console.log('\n✅ SCRAPING COMPLETE')
  console.log(`💾 Found ${uniqueJobs.size} unique Alberta jobs`)
  
  process.exit(0)
}

scrapeAlbertaComplete().catch(error => {
  console.error('\n❌ FATAL ERROR:', error)
  process.exit(1)
})
