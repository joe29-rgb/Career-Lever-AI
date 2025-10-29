/**
 * Check Environment Variables
 */

import { config } from 'dotenv'
const result = config({ path: '.env.local' })

console.log('📋 Environment Check\n')

if (result.error) {
  console.error('❌ Error loading .env.local:', result.error)
  process.exit(1)
}

console.log('✅ .env.local loaded successfully\n')

// Check Supabase variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const rapidApiKey = process.env.RAPIDAPI_KEY
const cronSecret = process.env.CRON_SECRET

console.log('🔑 Environment Variables:')
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`)
console.log(`   RAPIDAPI_KEY: ${rapidApiKey ? '✅ Set' : '❌ Missing'}`)
console.log(`   CRON_SECRET: ${cronSecret ? '✅ Set' : '❌ Missing'}`)

console.log('\n📝 Values (first 20 chars):')
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl?.substring(0, 40)}...`)
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey?.substring(0, 40)}...`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey?.substring(0, 40)}...`)
console.log(`   RAPIDAPI_KEY: ${rapidApiKey?.substring(0, 20)}...`)
console.log(`   CRON_SECRET: ${cronSecret}`)

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.log('\n❌ Missing required Supabase variables!')
  console.log('\n📝 Add these to your .env.local:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://gksanqnzjnydpfcgqdzj.supabase.co')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  console.log('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  process.exit(1)
}

console.log('\n✅ All required variables are set!')
