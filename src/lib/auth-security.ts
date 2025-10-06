import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export function validateRedirectURL(url: string, baseUrl: string): string {
  try {
    const base = new URL(baseUrl)

    // Handle relative URLs
    if (url.startsWith('/')) {
      // Prevent auth loops
      if (url === '/' || url.startsWith('/auth') || url.startsWith('/api/auth')) {
        return `${base.origin}/dashboard`
      }
      return `${base.origin}${url}`
    }

    // Handle absolute URLs
    const target = new URL(url)

    // Only allow same origin
    if (target.origin !== base.origin) {
      return `${base.origin}/dashboard`
    }

    return target.toString()
  } catch {
    return `${baseUrl}/dashboard`
  }
}

export function validateCSRF(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  if (!origin || !host) {
    return false
  }

  try {
    const originUrl = new URL(origin)
    return originUrl.host === host
  } catch {
    return false
  }
}

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  return session
}

export function sanitizeInput(input: string, maxLength = 10000): string {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
}
