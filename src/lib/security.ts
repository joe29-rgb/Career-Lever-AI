import { NextRequest } from 'next/server'

export function isSameOrigin(request: NextRequest): boolean {
  try {
    const origin = request.headers.get('origin') || ''
    // Treat missing Origin as same-origin for non-browser clients (SSR/fetch)
    if (!origin) return true
    const reqOrigin = new URL(request.nextUrl.origin).host
    const originHost = new URL(origin).host
    if (reqOrigin === originHost) return true
    // Allow configured public origin (Railway) to POST to API if set
    const allowed = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
    if (allowed) {
      try {
        const allowedHost = new URL(allowed).host
        if (originHost === allowedHost) return true
      } catch {}
    }
    return false
  } catch {
    return false
  }
}


