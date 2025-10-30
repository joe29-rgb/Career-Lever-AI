/**
 * Verify environment variables are set correctly
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

console.log('🔍 Verifying Environment Variables...\n')

const required = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
}

const expected = {
  'NEXT_PUBLIC_SUPABASE_URL': 'https://gksanqnzjnydpfcgqdzj.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrc2FucW56am55ZHBmY2dxZHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODkwOTIsImV4cCI6MjA3NzI2NTA5Mn0.-jLu0ASW0xktNzxo9czl5XVrMucploOBwcE2_Y0mFiM',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrc2FucW56am55ZHBmY2dxZHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4OTA5MiwiZXhwIjoyMDc3MjY1MDkyfQ.eUfIIfeR70K0LCXo9HPiqZMbcjhx6UI0h3PYEk8_Y1Y',
}

let allCorrect = true

for (const [key, value] of Object.entries(required)) {
  if (!value) {
    console.log(`❌ ${key}: NOT SET`)
    allCorrect = false
  } else if (value !== expected[key as keyof typeof expected]) {
    console.log(`⚠️  ${key}: SET but INCORRECT`)
    console.log(`   Current: ${value.substring(0, 50)}...`)
    console.log(`   Expected: ${expected[key as keyof typeof expected].substring(0, 50)}...`)
    allCorrect = false
  } else {
    console.log(`✅ ${key}: CORRECT`)
  }
}

console.log('\n' + '='.repeat(60))

if (allCorrect) {
  console.log('✅ All environment variables are correctly set!')
  console.log('\nYour .env.local should contain:')
  console.log('```')
  console.log(`NEXT_PUBLIC_SUPABASE_URL=${expected.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${expected.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)
  console.log(`SUPABASE_SERVICE_ROLE_KEY=${expected.SUPABASE_SERVICE_ROLE_KEY}`)
  console.log('```')
} else {
  console.log('❌ Some environment variables need to be fixed!')
  console.log('\nUpdate your .env.local file with:')
  console.log('```')
  console.log(`NEXT_PUBLIC_SUPABASE_URL=${expected.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${expected.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)
  console.log(`SUPABASE_SERVICE_ROLE_KEY=${expected.SUPABASE_SERVICE_ROLE_KEY}`)
  console.log('```')
}
