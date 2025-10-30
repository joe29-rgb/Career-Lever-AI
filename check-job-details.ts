/**
 * Check specific job details from Supabase
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkJobDetails() {
  console.log('🔍 Checking job details from Supabase...\n')

  // Get 10 random jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`Found ${jobs?.length} jobs\n`)

  jobs?.forEach((job, i) => {
    console.log(`Job ${i + 1}:`)
    console.log(`  Title: ${job.title}`)
    console.log(`  Company: ${job.company}`)
    console.log(`  Location: ${job.location}`)
    console.log(`  URL: ${job.url}`)
    console.log(`  Source: ${job.source}`)
    console.log(`  Description: ${job.description?.substring(0, 100)}...`)
    console.log('')
  })
}

checkJobDetails()
