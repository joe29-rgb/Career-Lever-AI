import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple PII redaction for logs and error responses
function redactPII(value: string): string {
  if (!value) return value
  // Emails
  let out = value.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
  // Phone numbers (naive)
  out = out.replace(/(\+?\d[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/g, '[REDACTED_PHONE]')
  // Addresses (very naive heuristic)
  out = out.replace(/\b\d{1,5}\s+[\w\s]+(Street|St\.|Avenue|Ave\.|Road|Rd\.|Boulevard|Blvd\.|Lane|Ln\.|Suite|Ste\.)\b[^\n<]{0,80}/gi, '[REDACTED_ADDRESS]')
  return out
}

export function middleware(request: NextRequest) {
  // Add basic security headers
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(self), microphone=()')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  // Simple CSP
  response.headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https:")
  // Attach a redaction helper header for server logs downstream
  const q = request.nextUrl.search
  if (q && q.length > 1) {
    const redacted = redactPII(decodeURIComponent(q))
    response.headers.set('x-redacted-query', redacted)
  }
  // Basic Origin check for POST/PUT/DELETE
  if (['POST','PUT','PATCH','DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin') || ''
    const host = request.headers.get('host') || ''
    const allowed = origin.includes(host) || origin === ''
    if (!allowed) {
      return new NextResponse(JSON.stringify({ error: 'Invalid origin' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // Security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  // Simple CSP (adjust as needed)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.openai.com https://nominatim.openstreetmap.org https://overpass-api.de https://api.mapbox.com",
    "frame-ancestors 'none'",
  ].join('; ')
  res.headers.set('Content-Security-Policy', csp)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js).*)'],
}


