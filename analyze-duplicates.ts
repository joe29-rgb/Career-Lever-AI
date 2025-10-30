/**
 * Analyze why only 226 jobs were inserted from 3000+ scraped
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { AdzunaAPIClient } from './src/lib/adzuna-api-client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const adzuna = new AdzunaAPIClient()

async function analyzeDuplicates() {
  console.log('🔍 Analyzing Duplicate Detection...\n')

  // Get all existing jobs from database
  const { data: existingJobs } = await supabase
    .from('jobs')
    .select('external_id, title, company, source')
    .eq('source', 'adzuna')

  console.log(`📊 Existing Adzuna jobs in database: ${existingJobs?.length}\n`)

  // Scrape first page from Edmonton
  console.log('🔎 Scraping first page from Edmonton...')
  const result = await adzuna.searchJobs({
    what: '',
    where: 'Edmonton, AB',
    country: 'ca',
    resultsPerPage: 50,
    page: 1
  })

  console.log(`✅ Found ${result.results.length} jobs from Adzuna\n`)

  // Check how many would be duplicates
  const existingIds = new Set(existingJobs?.map(j => j.external_id) || [])
  
  let duplicates = 0
  let newJobs = 0
  let missingData = 0

  result.results.forEach(j => {
    const externalId = `adzuna_${j.id}`
    
    // Check for missing data
    if (!j.company?.display_name || !j.description || !j.title || !j.redirect_url) {
      missingData++
      return
    }
    
    // Check if duplicate
    if (existingIds.has(externalId)) {
      duplicates++
    } else {
      newJobs++
    }
  })

  console.log('📈 Analysis Results:')
  console.log(`  Total scraped: ${result.results.length}`)
  console.log(`  Missing data: ${missingData} (${Math.round(missingData/result.results.length*100)}%)`)
  console.log(`  Duplicates: ${duplicates} (${Math.round(duplicates/result.results.length*100)}%)`)
  console.log(`  New jobs: ${newJobs} (${Math.round(newJobs/result.results.length*100)}%)`)

  console.log('\n🔍 Sample of first 5 jobs:')
  result.results.slice(0, 5).forEach((j, i) => {
    const externalId = `adzuna_${j.id}`
    const isDuplicate = existingIds.has(externalId)
    const hasMissingData = !j.company?.display_name || !j.description || !j.title || !j.redirect_url
    
    console.log(`\n${i + 1}. ${j.title}`)
    console.log(`   Company: ${j.company?.display_name || 'MISSING'}`)
    console.log(`   External ID: ${externalId}`)
    console.log(`   Status: ${isDuplicate ? '❌ DUPLICATE' : hasMissingData ? '⚠️ MISSING DATA' : '✅ NEW'}`)
  })

  // Check for same company, different jobs
  console.log('\n\n🏢 Checking for multiple jobs from same company...')
  const companyCounts: Record<string, number> = {}
  result.results.forEach(j => {
    const company = j.company?.display_name
    if (company) {
      companyCounts[company] = (companyCounts[company] || 0) + 1
    }
  })

  const multipleJobs = Object.entries(companyCounts).filter(([_, count]) => count > 1)
  console.log(`\nCompanies with multiple job listings in first page: ${multipleJobs.length}`)
  multipleJobs.slice(0, 5).forEach(([company, count]) => {
    console.log(`  ${company}: ${count} jobs`)
  })

  // Check if our unique constraint is blocking same company jobs
  console.log('\n\n⚠️ POTENTIAL ISSUE:')
  console.log('If the database has a unique constraint on (company, title, location),')
  console.log('then multiple jobs from the same company WOULD be blocked.')
  console.log('\nLet me check the actual constraint...')

  // Get a sample job to see what constraint failed
  const sampleNewJob = result.results.find(j => {
    const externalId = `adzuna_${j.id}`
    return !existingIds.has(externalId) && j.company?.display_name && j.description
  })

  if (sampleNewJob) {
    console.log('\n🧪 Testing insert of a new job...')
    const testJob = {
      external_id: `adzuna_${sampleNewJob.id}`,
      source: 'adzuna',
      title: sampleNewJob.title,
      company: sampleNewJob.company.display_name,
      location: sampleNewJob.location.display_name,
      description: sampleNewJob.description,
      url: sampleNewJob.redirect_url,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      scraped_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('jobs')
      .insert(testJob)

    if (error) {
      console.log('❌ Insert failed:', error.message)
      console.log('   Code:', error.code)
      console.log('   Details:', error.details)
    } else {
      console.log('✅ Insert successful! Cleaning up...')
      await supabase
        .from('jobs')
        .delete()
        .eq('external_id', testJob.external_id)
    }
  }
}

analyzeDuplicates().catch(console.error)
