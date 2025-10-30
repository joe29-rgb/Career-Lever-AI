/**
 * Direct Supabase connection test (loads env first)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

async function testDirectConnection() {
  console.log('🔍 Testing Direct Supabase Connection...\n')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  console.log('Environment check:')
  console.log(`  URL: ${url}`)
  console.log(`  Anon Key: ${anonKey.substring(0, 20)}...`)
  console.log(`  Service Key: ${serviceKey.substring(0, 20)}...\n`)

  // Create clients directly
  const publicClient = createClient(url, anonKey)
  const adminClient = createClient(url, serviceKey)

  // Test 1: Public client
  console.log('1️⃣ Testing public client...')
  try {
    const { count, error } = await publicClient
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Error:', error.message)
    } else {
      console.log(`✅ Connected! Found ${count} jobs\n`)
    }
  } catch (err: any) {
    console.error('❌ Exception:', err.message, '\n')
  }

  // Test 2: Admin client
  console.log('2️⃣ Testing admin client...')
  try {
    const { count, error } = await adminClient
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Error:', error.message)
    } else {
      console.log(`✅ Connected! Found ${count} jobs\n`)
    }
  } catch (err: any) {
    console.error('❌ Exception:', err.message, '\n')
  }

  // Test 3: Insert test
  console.log('3️⃣ Testing insert...')
  try {
    const testJob = {
      external_id: 'test-' + Date.now(),
      source: 'test',
      title: 'Test Job',
      company: 'Test Company',
      location: 'Edmonton, AB',
      description: 'Test description',
      url: 'https://example.com',
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      scraped_at: new Date().toISOString()
    }

    const { data, error } = await adminClient
      .from('jobs')
      .insert(testJob)
      .select()

    if (error) {
      console.error('❌ Insert error:', error.message)
    } else {
      console.log('✅ Insert successful!')
      
      // Clean up
      await adminClient
        .from('jobs')
        .delete()
        .eq('external_id', testJob.external_id)
      
      console.log('🧹 Test job cleaned up\n')
    }
  } catch (err: any) {
    console.error('❌ Insert exception:', err.message, '\n')
  }

  console.log('✅ Connection test complete!')
}

testDirectConnection().catch(console.error)
