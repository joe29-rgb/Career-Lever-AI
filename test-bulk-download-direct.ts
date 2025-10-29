/**
 * Test bulk download directly (not via API)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { bulkDownloadJobs } from './src/lib/supabase-bulk-download'

async function test() {
  console.log('🚀 Testing bulk download directly...\n')
  
  const locations = ['Edmonton, AB']
  
  try {
    const result = await bulkDownloadJobs(locations)
    
    console.log('\n✅ Bulk download complete!')
    console.log('Results:', result)
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

test()
