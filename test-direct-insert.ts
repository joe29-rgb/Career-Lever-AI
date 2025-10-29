/**
 * Test direct insert to Supabase
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testInsert() {
  console.log('🧪 Testing direct insert to Supabase...\n')
  
  const testJob = {
    title: 'Software Developer',
    company: 'Test Company',
    location: 'Edmonton, AB',
    description: 'Test job description',
    url: 'https://example.com/job/123',
    external_id: 'test-' + Date.now(),
    source: 'google-jobs',
    keywords: ['software', 'developer'],
    scraped_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  }
  
  console.log('Inserting test job:', testJob)
  
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert(testJob)
    .select()
  
  if (error) {
    console.error('❌ Error:', error)
    console.error('Code:', error.code)
    console.error('Details:', error.details)
    console.error('Hint:', error.hint)
    console.error('Message:', error.message)
  } else {
    console.log('✅ Success! Inserted job:', data)
    
    // Clean up
    if (data && data[0]) {
      await supabaseAdmin
        .from('jobs')
        .delete()
        .eq('id', data[0].id)
      console.log('🧹 Cleaned up test job')
    }
  }
}

testInsert()
