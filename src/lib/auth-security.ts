// Enterprise Authentication Security Utilities

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

/**
 * Validates redirect URLs to prevent open redirect vulnerabilities
 * @param url - The redirect URL to validate
 * @param baseUrl - The base URL of the application
 * @returns Safe redirect URL
 */
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
      console.warn(`[SECURITY] Blocked redirect to external origin: ${target.origin}`)
      return `${base.origin}/dashboard`
    }

    return target.toString()
  } catch (error) {
    console.error('[SECURITY] Invalid redirect URL:', error)
    return `${baseUrl}/dashboard`
  }
}

/**
 * Validates CSRF token by checking origin matches host
 * @param request - The incoming request
 * @returns true if CSRF check passes
 */
export function validateCSRF(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  // Allow requests without origin (e.g., same-origin requests)
  if (!origin) {
    return true
  }

  if (!host) {
    return false
  }

  try {
    const originUrl = new URL(origin)
    const matches = originUrl.host === host
    
    if (!matches) {
      console.warn(`[SECURITY] CSRF check failed - Origin: ${origin}, Host: ${host}`)
    }
    
    return matches
  } catch (error) {
    console.error('[SECURITY] CSRF validation error:', error)
    return false
  }
}

/**
 * Requires authentication for API routes
 * @param request - The incoming request
 * @returns Session object if authenticated
 * @throws Error if not authenticated
 */
export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - Authentication required')
  }

  return session
}

/**
 * Sanitizes input to prevent XSS and injection attacks
 * @param input - The input string to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeInput(input: string, maxLength = 10000): string {
  return input
    .trim()
    .substring(0, maxLength)
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/on\w+="[^"]*"/gi, '')
    // Remove data: protocol (potential XSS vector)
    .replace(/data:text\/html/gi, '')
}

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Validates URL format and protocol
 * @param url - URL to validate
 * @returns true if valid and safe URL
 */
export function validateURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsedUrl.protocol)
  } catch {
    return false
  }
}

/**
 * Generates a secure random token
 * @param length - Length of the token
 * @returns Random token string
 */
export function generateSecureToken(length = 32): string {
  const crypto = require('crypto')
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Hashes a string using SHA-256
 * @param input - String to hash
 * @returns Hashed string
 */
export function hashString(input: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(input).digest('hex')
}

/**
 * Compares two strings in constant time to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns true if strings match
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  const crypto = require('crypto')
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * Rate limit helper for checking if user is rate limited
 * @param identifier - User identifier (usually user ID)
 * @param action - Action being rate limited
 * @returns Rate limit status
 */
export async function checkRateLimit(identifier: string, action: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  try {
    // Import rate limiter dynamically to avoid circular dependencies
    const { RateLimiter } = await import('./rate-limiter')
    const limiter = RateLimiter.getInstance()
    
    // Get rate limit configuration based on action
    const limits: Record<string, { maxRequests: number; windowMs: number }> = {
      'api-general': { maxRequests: 100, windowMs: 60000 },
      'auth-login': { maxRequests: 5, windowMs: 300000 },
      'file-upload': { maxRequests: 20, windowMs: 60000 },
      'ai-request': { maxRequests: 50, windowMs: 60000 },
    }
    
    const config = limits[action] || limits['api-general']
    const key = `rate-limit:${action}:${identifier}`
    
    // Check if rate limited (simple implementation using in-memory store)
    const now = Date.now()
    const resetAt = new Date(now + config.windowMs)
    
    // This is a simplified check - the actual RateLimiter middleware handles the full logic
    // For this helper, we return allowed by default and let middleware enforce
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt
    }
  } catch (error) {
    console.error('[SECURITY] Rate limit check error:', error)
    // Fail open to not block legitimate requests on error
    return {
      allowed: true,
      remaining: 10,
      resetAt: new Date(Date.now() + 60000)
    }
  }
}

/**
 * Logs security events for audit trails
 * @param event - Event type
 * @param details - Event details
 * @param severity - Event severity
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    details,
    environment: process.env.NODE_ENV
  }

  // In production, this would send to a proper logging service
  if (severity === 'high' || severity === 'critical') {
    console.error('[SECURITY EVENT]', JSON.stringify(logEntry))
  } else {
    console.warn('[SECURITY EVENT]', JSON.stringify(logEntry))
  }
}
