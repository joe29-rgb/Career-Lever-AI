import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple PII redaction for logs and error responses
function redactPII(value: string): string {
  if (!value) return value
  let out = value.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
  out = out.replace(/(\+?\d[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/g, '[REDACTED_PHONE]')
  out = out.replace(/\b\d{1,5}\s+[\w\s]+(Street|St\.|Avenue|Ave\.|Road|Rd\.|Boulevard|Blvd\.|Lane|Ln\.|Suite|Ste\.)\b[^\n<]{0,80}/gi, '[REDACTED_ADDRESS]')
  return out
}

export function middleware(request: NextRequest) {
  const res = NextResponse.next()
  // Security headers
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  // CSP allowing needed backends
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.openai.com https://nominatim.openstreetmap.org https://overpass-api.de https://api.mapbox.com",
    "frame-ancestors 'self'",
  ].join('; ')
  res.headers.set('Content-Security-Policy', csp)

  // Attach redacted query for logs
  const q = request.nextUrl.search
  if (q && q.length > 1) {
    res.headers.set('x-redacted-query', redactPII(decodeURIComponent(q)))
  }
  // Generate/forward a request id for client breadcrumbs
  const rid = request.headers.get('x-request-id') || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  res.headers.set('x-request-id', rid)
  // Origin check for state-changing verbs
  if (['POST','PUT','PATCH','DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin') || ''
    const host = request.headers.get('host') || ''
    const allowed = origin.includes(host) || origin === ''
    if (!allowed) {
      return new NextResponse(JSON.stringify({ error: 'Invalid origin' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js).*)'],
}


