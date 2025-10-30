/**
 * TEST NUCLEAR SCRAPER (WITHOUT SUPABASE)
 * 
 * Test the full system without database insertion
 * Just see how many jobs we can get
 */

import { getATSDirectAccess } from './src/lib/apis/ats-direct-access'
import { getVerifiedCompanies } from './src/data/verified-ats-companies'
import { getIndeedRSS } from './src/lib/apis/indeed-rss'
import type { Job } from './src/types/supabase'

async function testNuclearScraper() {
  console.log('🚀 TESTING NUCLEAR MEGA SCRAPER\n')
  console.log('Sources:')
  console.log('  1. ATS Direct (88 companies)')
  console.log('  2. Indeed RSS Feeds (5 keywords × 5 locations)\n')
  
  const startTime = Date.now()
  const allJobs: Partial<Job>[] = []
  
  // ========================================
  // SOURCE 1: ATS DIRECT ACCESS
  // ========================================
  console.log('\n📡 SOURCE 1: ATS DIRECT ACCESS\n')
  
  const ats = getATSDirectAccess()
  const companies = getVerifiedCompanies()
  
  console.log(`Fetching from ${companies.length} verified companies...`)
  const atsJobs = await ats.fetchAllATS(companies)
  allJobs.push(...atsJobs)
  
  console.log(`\n✅ ATS Direct: ${atsJobs.length} jobs\n`)
  
  // ========================================
  // SOURCE 2: INDEED RSS FEEDS
  // ========================================
  console.log('\n📡 SOURCE 2: INDEED RSS FEEDS\n')
  
  const indeedRSS = getIndeedRSS()
  const keywords = [
    'software developer',
    'data analyst',
    'registered nurse',
    'sales representative',
    'accountant'
  ]
  const locations = [
    'Toronto, ON',
    'Vancouver, BC',
    'Montreal, QC',
    'Calgary, AB',
    'Edmonton, AB'
  ]
  
  const indeedJobs: Partial<Job>[] = []
  
  for (const location of locations) {
    for (const keyword of keywords) {
      try {
        const jobs = await indeedRSS.getJobs({
          keywords: keyword,
          location,
          fromage: 7,
          radius: 150
        })
        indeedJobs.push(...jobs)
        console.log(`  ${keyword} @ ${location}: ${jobs.length} jobs`)
        await sleep(2000) // Rate limiting
      } catch (error) {
        console.error(`  ${keyword} @ ${location}: Error`)
      }
    }
  }
  
  allJobs.push(...indeedJobs)
  console.log(`\n✅ Indeed RSS: ${indeedJobs.length} jobs\n`)
  
  // ========================================
  // DEDUPLICATION
  // ========================================
  console.log('\n🔄 DEDUPLICATION\n')
  
  console.log(`Total scraped: ${allJobs.length}`)
  
  // Deduplicate by URL
  const uniqueJobs = Array.from(
    new Map(allJobs.map(job => [job.url, job])).values()
  )
  
  console.log(`Unique jobs: ${uniqueJobs.length}`)
  console.log(`Duplicates removed: ${allJobs.length - uniqueJobs.length}\n`)
  
  // ========================================
  // SUMMARY
  // ========================================
  const duration = Math.round((Date.now() - startTime) / 1000 / 60)
  
  console.log('\n\n🎉 NUCLEAR MEGA SCRAPE TEST COMPLETE!\n')
  console.log('📊 SUMMARY:')
  console.log(`  ATS Direct:    ${atsJobs.length} jobs`)
  console.log(`  Indeed RSS:    ${indeedJobs.length} jobs`)
  console.log(`  ────────────────────────────`)
  console.log(`  Total:         ${allJobs.length} jobs`)
  console.log(`  Unique:        ${uniqueJobs.length} jobs`)
  console.log(`  Duration:      ${duration} minutes`)
  console.log(`  Cost:          $0.00`)
  console.log('\n✅ READY TO INSERT TO SUPABASE!')
  
  // Show sample jobs
  console.log('\n📋 SAMPLE JOBS:')
  uniqueJobs.slice(0, 10).forEach((job, i) => {
    console.log(`\n${i + 1}. ${job.title}`)
    console.log(`   Company: ${job.company}`)
    console.log(`   Location: ${job.location}`)
    console.log(`   Source: ${job.source}`)
  })
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

testNuclearScraper().catch(console.error)
