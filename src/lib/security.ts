import { NextRequest } from 'next/server'

export function isSameOrigin(request: NextRequest): boolean {
  try {
    const origin = request.headers.get('origin') || ''
    if (!origin) return false
    const reqOrigin = new URL(request.nextUrl.origin).host
    const originHost = new URL(origin).host
    return reqOrigin === originHost
  } catch {
    return false
  }
}


