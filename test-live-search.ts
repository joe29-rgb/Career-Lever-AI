/**
 * Test live search with actual Supabase data
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testLiveSearch() {
  console.log('🔍 Testing live search with Supabase data...\n')

  // Test 1: Search for "sales" jobs
  console.log('Test 1: Searching for "sales" jobs in Edmonton...')
  const { data: salesJobs, error: salesError } = await supabase
    .from('jobs')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .or('title.ilike.%sales%,company.ilike.%sales%,description.ilike.%sales%')
    .ilike('location', '%Edmonton%')
    .limit(10)

  if (salesError) {
    console.error('❌ Error:', salesError)
  } else {
    console.log(`✅ Found ${salesJobs.length} jobs\n`)
    salesJobs.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title}`)
      console.log(`   Company: ${job.company}`)
      console.log(`   Location: ${job.location}`)
      console.log(`   Source: ${job.source}`)
      console.log(`   URL: ${job.url || job.apply_link}`)
      console.log('')
    })
  }

  // Test 2: Get job counts by location
  console.log('\nTest 2: Job counts by location...')
  const { data: allJobs } = await supabase
    .from('jobs')
    .select('location')
    .gt('expires_at', new Date().toISOString())

  const locationCounts: Record<string, number> = {}
  allJobs?.forEach(job => {
    const loc = job.location || 'Unknown'
    locationCounts[loc] = (locationCounts[loc] || 0) + 1
  })

  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  console.log('Top 10 locations:')
  topLocations.forEach(([loc, count]) => {
    console.log(`  ${loc}: ${count} jobs`)
  })

  // Test 3: Verify data quality
  console.log('\nTest 3: Data quality check...')
  const { data: sample } = await supabase
    .from('jobs')
    .select('*')
    .limit(100)

  const withCompany = sample?.filter(j => j.company && j.company.trim().length > 0).length || 0
  const withDescription = sample?.filter(j => j.description && j.description.trim().length > 0).length || 0
  const withUrl = sample?.filter(j => j.url || j.apply_link).length || 0
  const withSalary = sample?.filter(j => j.salary_min || j.salary_max).length || 0

  console.log(`Sample of 100 jobs:`)
  console.log(`  ✅ With company: ${withCompany}/100 (${withCompany}%)`)
  console.log(`  ✅ With description: ${withDescription}/100 (${withDescription}%)`)
  console.log(`  ✅ With URL: ${withUrl}/100 (${withUrl}%)`)
  console.log(`  💰 With salary: ${withSalary}/100 (${withSalary}%)`)
}

testLiveSearch().catch(console.error)
