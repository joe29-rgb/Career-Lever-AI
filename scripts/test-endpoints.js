#!/usr/bin/env node

/**
 * Automated Endpoint Health Check Script
 * Tests all critical API endpoints and user flows
 */

const https = require('https')
const http = require('http')

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const IS_HTTPS = BASE_URL.startsWith('https')
const requestModule = IS_HTTPS ? https : http

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CareerLever-HealthCheck/1.0'
      }
    }

    const req = requestModule.request(url, options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        })
      })
    })

    req.on('error', reject)
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

async function testEndpoint(name, path, expectedStatus = 200) {
  try {
    const start = Date.now()
    const response = await makeRequest(path)
    const duration = Date.now() - start

    if (response.status === expectedStatus) {
      log(`✅ ${name}: ${response.status} (${duration}ms)`, 'green')
      return { passed: true, duration, status: response.status }
    } else {
      log(`❌ ${name}: Expected ${expectedStatus}, got ${response.status} (${duration}ms)`, 'red')
      return { passed: false, duration, status: response.status, expected: expectedStatus }
    }
  } catch (error) {
    log(`❌ ${name}: ${error.message}`, 'red')
    return { passed: false, error: error.message }
  }
}

async function runTests() {
  log('\n🧪 Career Lever AI - Endpoint Health Check\n', 'blue')
  log(`Testing: ${BASE_URL}`, 'gray')
  log('─'.repeat(60), 'gray')

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    totalDuration: 0
  }

  const tests = [
    // Public endpoints
    { name: 'Health Check', path: '/api/health', expectedStatus: 200 },
    { name: 'Home Page', path: '/', expectedStatus: 200 },
    { name: 'Sign In Page', path: '/auth/signin', expectedStatus: 200 },
    { name: 'Sign Up Page', path: '/auth/signup', expectedStatus: 200 },
    
    // API endpoints (should return 401 for unauthenticated)
    { name: 'Dashboard API (Auth Required)', path: '/api/analytics/dashboard', expectedStatus: 401 },
    { name: 'Resume List API (Auth Required)', path: '/api/resume/list', expectedStatus: 401 },
    { name: 'Applications API (Auth Required)', path: '/api/applications', expectedStatus: 401 },
    
    // Admin endpoints (should also be protected)
    { name: 'AI Stats API (Auth Required)', path: '/api/admin/ai-service/stats', expectedStatus: 401 },
    { name: 'Cache Stats API (Auth Required)', path: '/api/admin/cache/stats', expectedStatus: 401 },
    { name: 'Performance Stats API (Auth Required)', path: '/api/admin/performance/stats', expectedStatus: 401 },
  ]

  log('\n📊 Running Tests...\n', 'blue')

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.path, test.expectedStatus)
    results.total++
    if (result.passed) {
      results.passed++
    } else {
      results.failed++
    }
    if (result.duration) {
      results.totalDuration += result.duration
    }
  }

  // Summary
  log('\n' + '─'.repeat(60), 'gray')
  log('\n📈 Test Summary:\n', 'blue')
  log(`Total Tests: ${results.total}`, 'gray')
  log(`Passed: ${results.passed}`, results.passed === results.total ? 'green' : 'yellow')
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green')
  log(`Average Response Time: ${Math.round(results.totalDuration / results.total)}ms`, 'gray')
  log(`Total Duration: ${results.totalDuration}ms`, 'gray')

  if (results.failed > 0) {
    log('\n❌ Some tests failed. Please review the output above.', 'red')
    process.exit(1)
  } else {
    log('\n✅ All tests passed!', 'green')
    process.exit(0)
  }
}

// Additional test: Check rate limiting
async function testRateLimiting() {
  log('\n🔒 Testing Rate Limiting...\n', 'blue')
  
  const results = []
  const testPath = '/api/health'
  
  // Make 10 rapid requests
  for (let i = 0; i < 10; i++) {
    try {
      const response = await makeRequest(testPath)
      results.push(response.status)
      
      if (response.headers['x-ratelimit-remaining']) {
        log(`Request ${i + 1}: ${response.status} (Remaining: ${response.headers['x-ratelimit-remaining']})`, 'gray')
      } else {
        log(`Request ${i + 1}: ${response.status}`, 'gray')
      }
    } catch (error) {
      log(`Request ${i + 1}: Error - ${error.message}`, 'red')
    }
  }
  
  const has429 = results.includes(429)
  if (has429) {
    log('\n✅ Rate limiting is working (429 detected)', 'green')
  } else {
    log('\n⚠️  No 429 detected in 10 rapid requests (may be too lenient)', 'yellow')
  }
}

// Run all tests
(async () => {
  try {
    await runTests()
    // Optionally test rate limiting
    // await testRateLimiting()
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red')
    process.exit(1)
  }
})()

