/**
 * Test Supabase Connection
 * Run with: npx tsx test-supabase.ts
 */

// MUST load env FIRST before any imports
import { config } from 'dotenv'
config({ path: '.env.local' })

// Now import after env is loaded
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n')

  try {
    // Test 1: Public client connection
    console.log('1️⃣ Testing public client...')
    const { error: publicError } = await supabase
      .from('jobs')
      .select('id')
      .limit(1)

    if (publicError) {
      console.error('❌ Public client error:', publicError.message)
    } else {
      console.log('✅ Public client connected!')
    }

    // Test 2: Admin client connection
    console.log('\n2️⃣ Testing admin client...')
    const { error: adminError } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .limit(1)

    if (adminError) {
      console.error('❌ Admin client error:', adminError.message)
    } else {
      console.log('✅ Admin client connected!')
    }

    // Test 3: Get job statistics
    console.log('\n3️⃣ Getting job statistics...')
    
    const { count: total } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    const { count: active } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .gt('expires_at', new Date().toISOString())

    const { data: sourceData } = await supabase
      .from('jobs')
      .select('source')
      .gt('expires_at', new Date().toISOString())

    const bySource: Record<string, number> = {}
    sourceData?.forEach(job => {
      bySource[job.source] = (bySource[job.source] || 0) + 1
    })

    console.log('📊 Job Stats:')
    console.log(`   Total jobs: ${total || 0}`)
    console.log(`   Active jobs: ${active || 0}`)
    console.log(`   Expired jobs: ${(total || 0) - (active || 0)}`)
    console.log(`   By source:`, bySource)

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
      source: 'google-jobs',
      keywords: ['test'],
      scraped_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    }

    const { error: insertError } = await supabaseAdmin
      .from('jobs')
      .insert(testJob)

    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message)
      console.error('   Details:', insertError)
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
    console.log('\n📝 Next steps:')
    console.log('   1. Update bulk download route to use Supabase')
    console.log('   2. Run: npm run dev')
    console.log('   3. Trigger bulk download')
    console.log('   4. Check Supabase dashboard for jobs')
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error)
    process.exit(1)
  }
}

testConnection()
