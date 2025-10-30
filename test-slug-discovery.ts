/**
 * TEST SLUG DISCOVERY
 * 
 * Test the intelligent slug discovery system
 * Expected: 35% → 80%+ success rate!
 */

import { getSlugDiscovery } from './src/lib/slug-discovery'

async function testSlugDiscovery() {
  console.log('🔍 TESTING INTELLIGENT SLUG DISCOVERY\n')
  
  const discovery = getSlugDiscovery()
  
  // Test with companies that failed before
  const testCompanies = [
    // Greenhouse companies that failed
    { name: 'Shopify', ats: 'greenhouse' as const },
    { name: 'Wealthsimple', ats: 'greenhouse' as const },
    { name: 'Lightspeed Commerce', ats: 'greenhouse' as const },
    { name: 'FreshBooks', ats: 'greenhouse' as const },
    { name: 'Wattpad', ats: 'greenhouse' as const },
    { name: 'Clearco', ats: 'greenhouse' as const },
    { name: 'Properly', ats: 'greenhouse' as const },
    { name: 'Plaid', ats: 'greenhouse' as const },
    { name: 'Notion', ats: 'greenhouse' as const },
    { name: 'Canva', ats: 'greenhouse' as const },
    
    // Lever companies that failed
    { name: 'Slack', ats: 'lever' as const },
    { name: 'Stripe', ats: 'lever' as const },
    { name: 'Coinbase', ats: 'lever' as const },
    { name: 'Twilio', ats: 'lever' as const },
    { name: 'Affirm', ats: 'lever' as const },
    { name: 'Dropbox', ats: 'lever' as const },
    { name: 'Asana', ats: 'lever' as const },
    { name: 'Square', ats: 'lever' as const },
    { name: 'DoorDash', ats: 'lever' as const },
    { name: 'Instacart', ats: 'lever' as const },
    
    // Workable companies that failed
    { name: 'Bench Accounting', ats: 'workable' as const },
    { name: 'Vendasta', ats: 'workable' as const },
    { name: 'Jobber', ats: 'workable' as const },
    
    // Companies that worked (verify we don't break them)
    { name: 'Hootsuite', ats: 'greenhouse' as const },
    { name: 'Faire', ats: 'greenhouse' as const },
    { name: 'Ramp', ats: 'ashby' as const },
    { name: 'Watershed', ats: 'ashby' as const },
    { name: 'Vanta', ats: 'ashby' as const },
    { name: 'Databricks', ats: 'greenhouse' as const },
    { name: 'Intercom', ats: 'greenhouse' as const }
  ]
  
  console.log(`Testing ${testCompanies.length} companies...\n`)
  
  const results = await discovery.batchDiscover(testCompanies)
  
  // Show results
  console.log('\n📊 RESULTS:\n')
  console.log('✅ FOUND:')
  for (const [company, slug] of results) {
    console.log(`  ${company} → ${slug}`)
  }
  
  console.log('\n❌ NOT FOUND:')
  for (const company of testCompanies) {
    if (!results.has(company.name)) {
      console.log(`  ${company.name} (${company.ats})`)
    }
  }
  
  // Calculate success rate
  const successRate = (results.size / testCompanies.length * 100).toFixed(1)
  const improvement = (parseFloat(successRate) - 35).toFixed(1)
  
  console.log('\n\n📈 PERFORMANCE:')
  console.log(`  Before: 35% (31/88 companies)`)
  console.log(`  After:  ${successRate}% (${results.size}/${testCompanies.length} companies)`)
  console.log(`  Improvement: +${improvement}%`)
  
  if (parseFloat(successRate) >= 80) {
    console.log('\n🎉 SUCCESS! Target of 80%+ achieved!')
  } else if (parseFloat(successRate) >= 60) {
    console.log('\n✅ Good progress! Getting closer to 80% target.')
  } else {
    console.log('\n⚠️  More work needed to reach 80% target.')
  }
  
  // Export cache for future use
  const cache = discovery.exportCache()
  console.log(`\n💾 Cached ${Object.keys(cache).length} successful slugs`)
}

testSlugDiscovery().catch(console.error)
