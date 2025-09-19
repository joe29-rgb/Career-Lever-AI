import { NextRequest } from 'next/server'

export function isSameOrigin(request: NextRequest): boolean {
  try {
    const origin = request.headers.get('origin') || ''
    // Treat missing Origin as same-origin for non-browser clients (SSR/fetch)
    if (!origin) return true
    const reqOrigin = new URL(request.nextUrl.origin).host
    const originHost = new URL(origin).host
    return reqOrigin === originHost
  } catch {
    return false
  }
}


