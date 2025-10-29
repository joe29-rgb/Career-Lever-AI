/**
 * Check jobs in Supabase
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkJobs() {
  console.log('📊 Checking Supabase jobs...\n')
  
  // Total jobs
  const { count: total } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
  
  console.log(`Total jobs in database: ${total}`)
  
  // Active jobs
  const { count: active } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .gt('expires_at', new Date().toISOString())
  
  console.log(`Active jobs (not expired): ${active}`)
  
  // By source
  const { data: jobs } = await supabase
    .from('jobs')
    .select('source')
    .gt('expires_at', new Date().toISOString())
  
  const bySource: Record<string, number> = {}
  jobs?.forEach(job => {
    bySource[job.source] = (bySource[job.source] || 0) + 1
  })
  
  console.log('\nJobs by source:')
  Object.entries(bySource).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`)
  })
  
  // Recent jobs
  const { data: recent } = await supabase
    .from('jobs')
    .select('title, company, location, source, scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(5)
  
  console.log('\nMost recent 5 jobs:')
  recent?.forEach((job, i) => {
    console.log(`  ${i + 1}. ${job.title} at ${job.company} (${job.source})`)
  })
}

checkJobs()
