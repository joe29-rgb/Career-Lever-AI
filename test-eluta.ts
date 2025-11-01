/**
 * TEST ELUTA RSS - ALBERTA JOBS
 */

import { getElutaRSS } from './src/lib/apis/eluta-rss'

async function testEluta() {
  console.log('🔍 TESTING ELUTA RSS - ALBERTA JOBS')
  console.log('='.repeat(60))
  
  const eluta = getElutaRSS()
  
  const searches = [
    { keywords: 'software engineer', location: 'Edmonton AB' },
    { keywords: 'nurse', location: 'Calgary AB' },
    { keywords: 'accountant', location: 'Alberta' }
  ]
  
  let totalJobs = 0
  
  for (const search of searches) {
    const jobs = await eluta.searchJobs(search)
    totalJobs += jobs.length
    
    console.log(`✅ ${search.keywords.padEnd(20)} @ ${search.location.padEnd(15)} - ${jobs.length} jobs`)
    
    if (jobs.length > 0) {
      console.log(`   Sample: ${jobs[0].title} at ${jobs[0].company}`)
    }
    
    await new Promise(r => setTimeout(r, 1000))
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`✅ ELUTA TEST COMPLETE - ${totalJobs} jobs found`)
  console.log('='.repeat(60))
  
  process.exit(0)
}

testEluta().catch(error => {
  console.error('❌ ERROR:', error)
  process.exit(1)
})
