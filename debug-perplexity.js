const { PerplexityService } = require('./dist/lib/perplexity-service.js')

async function debugPerplexity() {
  console.log('🔍 Debugging Perplexity Service...\n')
  console.log('Environment Variables:')
  console.log('PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined')
  console.log('PPX_DEBUG:', process.env.PPX_DEBUG || 'undefined')
  console.log('')

  const svc = new PerplexityService()
  console.log('Health Check:')
  try {
    const health = await svc.healthCheck()
    console.log('Status:', health.status)
    console.log('Details:', health.details)
  } catch (e) {
    console.error('Health check failed:', e.message)
  }
  console.log('')

  console.log('Simple Request Test:')
  try {
    await svc.testRequest()
  } catch (e) {
    console.error('Request test failed:', e.message)
  }
  console.log('')

  console.log('Cache Stats:', PerplexityService.getCacheStats())
}

debugPerplexity().catch(err => { console.error(err); process.exit(1) })
