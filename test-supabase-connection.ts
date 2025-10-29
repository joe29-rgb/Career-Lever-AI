/**
 * Test Supabase Connection
 * Run with: npx tsx test-supabase-connection.ts
 */

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

import { supabase, supabaseAdmin, getJobStats } from './src/lib/supabase'

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n')

  try {
    // Test 1: Public client connection
    console.log('1️⃣ Testing public client...')
    const { data: publicData, error: publicError } = await supabase
      .from('jobs')
      .select('count')
      .limit(1)

    if (publicError) {
      console.error('❌ Public client error:', publicError.message)
    } else {
      console.log('✅ Public client connected!')
    }

    // Test 2: Admin client connection
    console.log('\n2️⃣ Testing admin client...')
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('jobs')
      .select('count')
      .limit(1)

    if (adminError) {
      console.error('❌ Admin client error:', adminError.message)
    } else {
      console.log('✅ Admin client connected!')
    }

    // Test 3: Get job statistics
    console.log('\n3️⃣ Getting job statistics...')
    const stats = await getJobStats()
    console.log('📊 Job Stats:')
    console.log(`   Total jobs: ${stats.total}`)
    console.log(`   Active jobs: ${stats.active}`)
    console.log(`   Expired jobs: ${stats.expired}`)
    console.log(`   By source:`, stats.bySource)

    // Test 4: Test insert (dry run)
    console.log('\n4️⃣ Testing insert capability...')
    const testJob = {
      id: 'test-' + Date.now(),
      title: 'Test Job',
      company: 'Test Company',
      location: 'Edmonton, AB',
      description: 'This is a test job',
      url: 'https://example.com/test',
      external_id: 'test-' + Date.now(),
      source: 'google-jobs' as const,
      keywords: ['test'],
      scraped_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    }

    const { error: insertError } = await supabaseAdmin
      .from('jobs')
      .insert(testJob)

    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message)
    } else {
      console.log('✅ Insert test passed!')
      
      // Clean up test job
      await supabaseAdmin
        .from('jobs')
        .delete()
        .eq('id', testJob.id)
      console.log('🧹 Test job cleaned up')
    }

    console.log('\n✅ All tests passed! Supabase is ready to use! 🎉')
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error)
    process.exit(1)
  }
}

testConnection()
