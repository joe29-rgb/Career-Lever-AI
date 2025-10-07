/**
 * Enterprise Error Tracking Service
 * Centralized error collection, aggregation, and analysis
 */

interface ErrorEntry {
  id: string
  timestamp: number
  message: string
  stack?: string
  context?: string
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  tags?: string[]
  metadata?: Record<string, any>
}

interface ErrorStats {
  totalErrors: number
  last1h: number
  last24h: number
  last7d: number
  byContext: Record<string, number>
  bySeverity: Record<string, number>
  topErrors: Array<{ message: string; count: number; lastSeen: number }>
}

export class ErrorTrackingService {
  private static instance: ErrorTrackingService
  private errors: Map<string, ErrorEntry> = new Map()
  private errorCounts: Map<string, number> = new Map()
  private readonly MAX_ERRORS = 10000 // Keep last 10k errors in memory
  private readonly CLEANUP_INTERVAL = 3600000 // 1 hour

  private constructor() {
    // Auto-cleanup old errors
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL)
    }
  }

  static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService()
    }
    return ErrorTrackingService.instance
  }

  /**
   * Track a new error
   */
  trackError(error: Error | string, options?: {
    context?: string
    userId?: string
    sessionId?: string
    url?: string
    userAgent?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    tags?: string[]
    metadata?: Record<string, any>
  }): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const message = error instanceof Error ? error.message : error
    const stack = error instanceof Error ? error.stack : undefined

    const entry: ErrorEntry = {
      id: errorId,
      timestamp: Date.now(),
      message,
      stack,
      context: options?.context,
      userId: options?.userId,
      sessionId: options?.sessionId,
      url: options?.url,
      userAgent: options?.userAgent,
      severity: options?.severity || this.determineSeverity(message),
      tags: options?.tags,
      metadata: options?.metadata
    }

    // Store error
    this.errors.set(errorId, entry)

    // Update error counts
    const countKey = this.getCountKey(message)
    this.errorCounts.set(countKey, (this.errorCounts.get(countKey) || 0) + 1)

    // Enforce size limit
    if (this.errors.size > this.MAX_ERRORS) {
      this.cleanup()
    }

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR_TRACKING] ${errorId}:`, message, {
        context: options?.context,
        severity: entry.severity
      })
    }

    return errorId
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    const now = Date.now()
    const hour = 3600000 // 1 hour in ms
    const day = 86400000 // 24 hours in ms
    const week = 604800000 // 7 days in ms

    const errors = Array.from(this.errors.values())

    const stats: ErrorStats = {
      totalErrors: errors.length,
      last1h: errors.filter(e => now - e.timestamp < hour).length,
      last24h: errors.filter(e => now - e.timestamp < day).length,
      last7d: errors.filter(e => now - e.timestamp < week).length,
      byContext: {},
      bySeverity: {},
      topErrors: []
    }

    // Group by context
    errors.forEach(e => {
      if (e.context) {
        stats.byContext[e.context] = (stats.byContext[e.context] || 0) + 1
      }
      stats.bySeverity[e.severity] = (stats.bySeverity[e.severity] || 0) + 1
    })

    // Get top errors
    const errorFrequency = new Map<string, { message: string; count: number; lastSeen: number }>()
    
    errors.forEach(e => {
      const key = this.getCountKey(e.message)
      const existing = errorFrequency.get(key)
      if (existing) {
        existing.count++
        existing.lastSeen = Math.max(existing.lastSeen, e.timestamp)
      } else {
        errorFrequency.set(key, {
          message: e.message,
          count: 1,
          lastSeen: e.timestamp
        })
      }
    })

    stats.topErrors = Array.from(errorFrequency.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return stats
  }

  /**
   * Get errors by filter
   */
  getErrors(filter?: {
    context?: string
    severity?: string
    userId?: string
    limit?: number
    since?: number
  }): ErrorEntry[] {
    let errors = Array.from(this.errors.values())

    if (filter?.context) {
      errors = errors.filter(e => e.context === filter.context)
    }

    if (filter?.severity) {
      errors = errors.filter(e => e.severity === filter.severity)
    }

    if (filter?.userId) {
      errors = errors.filter(e => e.userId === filter.userId)
    }

    if (filter?.since) {
      const since = filter.since
      errors = errors.filter(e => e.timestamp >= since)
    }

    errors.sort((a, b) => b.timestamp - a.timestamp)

    if (filter?.limit) {
      errors = errors.slice(0, filter.limit)
    }

    return errors
  }

  /**
   * Get a specific error by ID
   */
  getError(errorId: string): ErrorEntry | undefined {
    return this.errors.get(errorId)
  }

  /**
   * Clear all errors
   */
  clearAll(): void {
    this.errors.clear()
    this.errorCounts.clear()
  }

  /**
   * Clear errors older than a certain age
   */
  clearOlderThan(ageMs: number): number {
    const cutoff = Date.now() - ageMs
    let cleared = 0

    for (const [id, error] of this.errors.entries()) {
      if (error.timestamp < cutoff) {
        this.errors.delete(id)
        cleared++
      }
    }

    return cleared
  }

  /**
   * Private: Cleanup old errors
   */
  private cleanup(): void {
    const now = Date.now()
    const maxAge = 604800000 // 7 days

    let cleaned = 0
    for (const [id, error] of this.errors.entries()) {
      if (now - error.timestamp > maxAge) {
        this.errors.delete(id)
        cleaned++
      }
    }

    if (cleaned > 0 && process.env.NODE_ENV !== 'production') {
      console.log(`[ERROR_TRACKING] Cleaned ${cleaned} old errors`)
    }
  }

  /**
   * Private: Determine error severity from message
   */
  private determineSeverity(message: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerMessage = message.toLowerCase()

    // Critical keywords
    if (
      lowerMessage.includes('crash') ||
      lowerMessage.includes('fatal') ||
      lowerMessage.includes('security') ||
      lowerMessage.includes('breach') ||
      lowerMessage.includes('unauthorized')
    ) {
      return 'critical'
    }

    // High severity keywords
    if (
      lowerMessage.includes('fail') ||
      lowerMessage.includes('error') ||
      lowerMessage.includes('unable') ||
      lowerMessage.includes('cannot') ||
      lowerMessage.includes('invalid')
    ) {
      return 'high'
    }

    // Medium severity keywords
    if (
      lowerMessage.includes('warning') ||
      lowerMessage.includes('deprecated') ||
      lowerMessage.includes('timeout')
    ) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * Private: Get consistent count key for error message
   */
  private getCountKey(message: string): string {
    // Normalize error messages for counting (remove variable parts)
    return message
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/[a-f0-9-]{36}/g, 'UUID') // Replace UUIDs
      .replace(/[a-f0-9]{24}/g, 'ID') // Replace MongoDB IDs
      .toLowerCase()
      .slice(0, 200) // Truncate long messages
  }
}

// Global error handler for uncaught errors
if (typeof window !== 'undefined') {
  const tracker = ErrorTrackingService.getInstance()

  window.addEventListener('error', (event) => {
    tracker.trackError(event.error || event.message, {
      context: 'window.error',
      severity: 'high',
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    tracker.trackError(event.reason, {
      context: 'unhandledRejection',
      severity: 'high',
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  })
}

// Export singleton instance
export const errorTracker = ErrorTrackingService.getInstance()

