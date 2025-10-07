import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

export class RateLimiter {
  private static instance: RateLimiter
  private storage = new Map<string, RateLimitEntry>()
  private configs: Record<string, RateLimitConfig> = {
    'api-general': { windowMs: 60 * 1000, maxRequests: 500 }, // High limit for general API
    'ai-requests': { windowMs: 60 * 1000, maxRequests: 100 }, // Higher for AI
    'file-upload': { windowMs: 60 * 1000, maxRequests: 1000 }, // VERY high for file uploads - per minute
    'auth-login': { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // Higher auth limit
    'resume-customize': { windowMs: 60 * 1000, maxRequests: 100 }, // Higher
    'cover-letter': { windowMs: 60 * 1000, maxRequests: 100 }, // Higher
    'auth-session': { windowMs: 60 * 1000, maxRequests: 500 }, // Very high for session checks
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  async checkLimit(
    identifier: string,
    type: keyof typeof this.configs
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const config = this.configs[type]
    const key = `${type}:${identifier}`
    const now = Date.now()

    let entry = this.storage.get(key)

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      }
    }

    const allowed = entry.count < config.maxRequests

    if (allowed) {
      entry.count++
      this.storage.set(key, entry)
    }

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime
    }
  }

  // Middleware function
  createMiddleware(type: keyof typeof this.configs) {
    return async (request: NextRequest) => {
      const identifier = this.getIdentifier(request)
      const result = await this.checkLimit(identifier, type)

      if (!result.allowed) {
        return new Response('Rate limit exceeded', {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': this.configs[type].maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString()
          }
        })
      }

      return null // Continue to next middleware
    }
  }

  private getIdentifier(request: NextRequest): string {
    // Use IP address or user ID
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    return ip
  }
}
