/**
 * Check final job count after bulk download
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkResults() {
  console.log('📊 Checking Final Results...\n')

  // Total jobs
  const { count: total } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })

  console.log(`✅ Total jobs in database: ${total}\n`)

  // By source
  const { data: jobs } = await supabase
    .from('jobs')
    .select('source')

  const bySource: Record<string, number> = {}
  jobs?.forEach(job => {
    bySource[job.source] = (bySource[job.source] || 0) + 1
  })

  console.log('Jobs by source:')
  Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`)
    })

  // By location
  const { data: allJobs } = await supabase
    .from('jobs')
    .select('location')

  const byLocation: Record<string, number> = {}
  allJobs?.forEach(job => {
    const loc = job.location || 'Unknown'
    byLocation[loc] = (byLocation[loc] || 0) + 1
  })

  console.log('\nTop 10 locations:')
  Object.entries(byLocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([loc, count]) => {
      console.log(`  ${loc}: ${count}`)
    })

  // Recent additions
  const { data: recent } = await supabase
    .from('jobs')
    .select('title, company, source, scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(10)

  console.log('\nMost recent 10 jobs:')
  recent?.forEach((job, i) => {
    const date = new Date(job.scraped_at).toLocaleString()
    console.log(`  ${i + 1}. ${job.title} at ${job.company} (${job.source}) - ${date}`)
  })

  console.log('\n' + '='.repeat(60))
  console.log(`🎉 SUCCESS! You now have ${total} jobs in Supabase!`)
  console.log('='.repeat(60))
}

checkResults().catch(console.error)
