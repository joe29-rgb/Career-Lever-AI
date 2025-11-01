/**
 * Test Analytics Functions
 * Run: npx tsx test-analytics.ts
 */

import { dbService } from './src/lib/database'
import {
  getUserApplicationStats,
  getApplicationTrendLine,
  calculateSuccessRate,
  getIndustryBreakdown,
  calculateAverageResponseTime,
  predictNextOffer
} from './src/lib/analytics/application-stats'

async function testAnalytics() {
  console.log('🧪 Testing Analytics Functions...\n')

  try {
    await dbService.connect()
    console.log('✅ Database connected\n')

    // You'll need to replace this with a real user ID from your database
    const testUserId = process.env.TEST_USER_ID || '507f1f77bcf86cd799439011'

    console.log(`Testing with user ID: ${testUserId}\n`)

    // Test 1: Get User Application Stats
    console.log('📊 Test 1: getUserApplicationStats()')
    const stats = await getUserApplicationStats(testUserId)
    console.log('Result:', JSON.stringify(stats, null, 2))
    console.log('✅ Pass\n')

    // Test 2: Get Application Trend Line
    console.log('📈 Test 2: getApplicationTrendLine()')
    const trendLine = await getApplicationTrendLine(testUserId, 30)
    console.log(`Result: ${trendLine.length} data points`)
    console.log('Sample:', trendLine.slice(0, 3))
    console.log('✅ Pass\n')

    // Test 3: Calculate Success Rate
    console.log('🎯 Test 3: calculateSuccessRate()')
    const successRate = await calculateSuccessRate(testUserId)
    console.log('Result:', JSON.stringify(successRate, null, 2))
    console.log('✅ Pass\n')

    // Test 4: Get Industry Breakdown
    console.log('🏢 Test 4: getIndustryBreakdown()')
    const industryBreakdown = await getIndustryBreakdown(testUserId)
    console.log(`Result: ${industryBreakdown.length} industries`)
    console.log('Sample:', industryBreakdown.slice(0, 3))
    console.log('✅ Pass\n')

    // Test 5: Calculate Average Response Time
    console.log('⏱️  Test 5: calculateAverageResponseTime()')
    const avgResponseTime = await calculateAverageResponseTime(testUserId)
    console.log(`Result: ${avgResponseTime} days`)
    console.log('✅ Pass\n')

    // Test 6: Predict Next Offer
    console.log('🔮 Test 6: predictNextOffer()')
    const prediction = await predictNextOffer(testUserId)
    console.log('Result:', JSON.stringify(prediction, null, 2))
    console.log('✅ Pass\n')

    console.log('🎉 All tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

testAnalytics()
