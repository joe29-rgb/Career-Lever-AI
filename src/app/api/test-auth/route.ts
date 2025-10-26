/**
 * TEST AUTHENTICATION BYPASS ENDPOINT
 * 
 * WARNING: FOR TESTING ONLY - REMOVE BEFORE PRODUCTION
 * 
 * This endpoint creates a fake session for API testing without requiring
 * actual authentication. Use the test user credentials provided.
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Test credentials provided by user
    const TEST_EMAIL = 'joemcdonald29@gmail.com'
    const TEST_PASSWORD = 'Cohen2011!'
    
    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
      // Return fake session data that matches NextAuth structure
      return NextResponse.json({
        success: true,
        user: {
          id: 'test-user-id-12345',
          email: TEST_EMAIL,
          name: 'Test User'
        },
        session: {
          user: {
            id: 'test-user-id-12345',
            email: TEST_EMAIL,
            name: 'Test User'
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        message: 'Test authentication successful - using bypass endpoint'
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid test credentials'
    }, { status: 401 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test auth endpoint error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test authentication bypass endpoint',
    warning: 'FOR TESTING ONLY - REMOVE BEFORE PRODUCTION',
    usage: 'POST with { email, password } to get test session'
  })
}
