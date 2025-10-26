/**
 * User Analytics Service
 * Track user behavior and events for product improvement
 */

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: Date
  userId?: string
  sessionId?: string
}

interface PageViewEvent {
  path: string
  referrer?: string
  title?: string
}

class AnalyticsService {
  private static instance: AnalyticsService
  private sessionId: string
  private userId: string | null = null
  private events: AnalyticsEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.setupFlushInterval()
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setUserId(userId: string | null) {
    this.userId = userId
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined') return

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
      },
      timestamp: new Date(),
      userId: this.userId || undefined,
      sessionId: this.sessionId,
    }

    this.events.push(event)

    // Send to backend
    this.sendEvent(event)

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, properties)
    }
  }

  /**
   * Track a page view
   */
  pageView(pageData?: PageViewEvent) {
    if (typeof window === 'undefined') return

    this.track('page_view', {
      path: pageData?.path || window.location.pathname,
      referrer: pageData?.referrer || document.referrer,
      title: pageData?.title || document.title,
      url: window.location.href,
    })
  }

  /**
   * Track feature usage
   */
  featureUsed(featureName: string, metadata?: Record<string, any>) {
    this.track('feature_used', {
      feature: featureName,
      ...metadata,
    })
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    })
  }

  /**
   * Track user interactions
   */
  interaction(action: string, target: string, metadata?: Record<string, any>) {
    this.track('interaction', {
      action,
      target,
      ...metadata,
    })
  }

  /**
   * Track conversions
   */
  conversion(conversionType: string, value?: number, metadata?: Record<string, any>) {
    this.track('conversion', {
      type: conversionType,
      value,
      ...metadata,
    })
  }

  /**
   * Send event to backend
   */
  private async sendEvent(event: AnalyticsEvent) {
    try {
      // Only send in production or if explicitly enabled
      if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_ANALYTICS) {
        return
      }

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        // Don't wait for response
        keepalive: true,
      }).catch(() => {
        // Silently fail - analytics shouldn't break the app
      })
    } catch {
      // Silently fail
    }
  }

  /**
   * Flush events periodically
   */
  private setupFlushInterval() {
    if (typeof window === 'undefined') return

    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      if (this.events.length > 50) {
        // Keep only last 50 events in memory
        this.events = this.events.slice(-50)
      }
    }, 30000)
  }

  /**
   * Get all tracked events (for debugging)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  /**
   * Clear all events
   */
  clear() {
    this.events = []
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.events = []
  }
}

// Export singleton instance
export const analytics = typeof window !== 'undefined' 
  ? AnalyticsService.getInstance() 
  : null

// Export class for testing
export { AnalyticsService }

// Convenience functions
export const trackEvent = (name: string, properties?: Record<string, any>) => {
  analytics?.track(name, properties)
}

export const trackPageView = (pageData?: PageViewEvent) => {
  analytics?.pageView(pageData)
}

export const trackFeature = (featureName: string, metadata?: Record<string, any>) => {
  analytics?.featureUsed(featureName, metadata)
}

export const trackError = (error: Error, context?: Record<string, any>) => {
  analytics?.trackError(error, context)
}

export const trackInteraction = (action: string, target: string, metadata?: Record<string, any>) => {
  analytics?.interaction(action, target, metadata)
}

export const trackConversion = (type: string, value?: number, metadata?: Record<string, any>) => {
  analytics?.conversion(type, value, metadata)
}

