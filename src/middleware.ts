import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { RateLimiter } from './lib/rate-limiter'

// Simple PII redaction for logs and error responses
function redactPII(value: string): string {
  if (!value) return value
  let out = value.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
  out = out.replace(/(\+?\d[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/g, '[REDACTED_PHONE]')
  out = out.replace(/\b\d{1,5}\s+[\w\s]+(Street|St\.|Avenue|Ave\.|Road|Rd\.|Boulevard|Blvd\.|Lane|Ln\.|Suite|Ste\.)\b[^\n<]{0,80}/gi, '[REDACTED_ADDRESS]')
  return out
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  // CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  }

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const path = request.nextUrl.pathname
    
    // Skip rate limiting for NextAuth internal endpoints
    if (path.startsWith('/api/auth/session') || 
        path.startsWith('/api/auth/csrf') || 
        path.startsWith('/api/auth/_log') ||
        path.startsWith('/api/auth/providers')) {
      return response
    }
    
    const rateLimiter = RateLimiter.getInstance()
    let rateLimitType: any = 'api-general'

    // Determine appropriate rate limit based on route
    if (path.includes('/auth/')) {
      rateLimitType = 'auth-session'
    } else if (
      path.includes('/resume/customize') ||
      path.includes('/cover-letter/generate') ||
      path.includes('/company/research') ||
      path.includes('/job/analyze') ||
      path.includes('/v2/') ||
      path.includes('/assistants/')
    ) {
      rateLimitType = 'ai-requests'
    } else if (
      path.includes('/upload') ||
      path.includes('/resume/upload') ||
      path.includes('/applications/') && path.includes('/attach')
    ) {
      rateLimitType = 'file-upload'
    } else if (
      path.includes('/resume/customize') ||
      path.includes('/cover-letter/generate')
    ) {
      rateLimitType = 'resume-customize'
    } else if (path.includes('/cover-letter/')) {
      rateLimitType = 'cover-letter'
    }

    const rateLimitResult = await rateLimiter.createMiddleware(rateLimitType)(request)
    if (rateLimitResult) {
      return rateLimitResult
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js).*)'],
}


