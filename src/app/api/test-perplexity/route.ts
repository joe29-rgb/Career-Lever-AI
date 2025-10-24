import { NextRequest, NextResponse } from 'next/server'
import { PerplexityService } from '@/lib/perplexity-service'

/**
 * Test endpoint to verify Perplexity API is working
 * GET /api/test-perplexity
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[TEST_PERPLEXITY] Starting test...')
    
    // Check if API key exists
    if (!process.env.PERPLEXITY_API_KEY) {
      console.error('[TEST_PERPLEXITY] ❌ PERPLEXITY_API_KEY not set!')
      return NextResponse.json({
        success: false,
        error: 'PERPLEXITY_API_KEY environment variable not set',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
    console.log('[TEST_PERPLEXITY] API key exists, length:', process.env.PERPLEXITY_API_KEY.length)
    
    // Test simple request
    const client = new PerplexityService()
    console.log('[TEST_PERPLEXITY] Making test request...')
    
    const response = await client.makeRequest(
      'You are a helpful assistant.',
      'What is 2+2? Respond with just the number.',
      {
        temperature: 0.1,
        maxTokens: 50,
        model: 'sonar-pro'
      }
    )
    
    console.log('[TEST_PERPLEXITY] ✅ Response received:', {
      contentLength: response.content.length,
      content: response.content
    })
    
    return NextResponse.json({
      success: true,
      test: 'simple_math',
      response: response.content,
      apiKeyConfigured: true,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[TEST_PERPLEXITY] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
