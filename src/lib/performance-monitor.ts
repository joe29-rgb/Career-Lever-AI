// Enterprise Performance Monitoring Service
// Tracks API performance, resource usage, and application metrics

import { Logger } from './logger'

const logger = Logger.getInstance('PERFORMANCE')

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  timestamp: number
  tags?: Record<string, string>
}

export interface APIMetric {
  endpoint: string
  method: string
  duration: number
  statusCode: number
  userId?: string
  cached?: boolean
  timestamp: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private apiMetrics: APIMetric[] = []
  private readonly maxMetrics = 1000 // Keep last 1000 metrics

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Track API performance
  trackAPI(metric: APIMetric): void {
    this.apiMetrics.push(metric)

    // Keep only recent metrics
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics.shift()
    }

    // Log slow requests (> 2 seconds)
    if (metric.duration > 2000) {
      logger.warn('Slow API request detected', {
        endpoint: metric.endpoint,
        duration: `${metric.duration}ms`,
        statusCode: metric.statusCode
      })
    }

    // Log errors
    if (metric.statusCode >= 500) {
      logger.error('API error', {
        endpoint: metric.endpoint,
        statusCode: metric.statusCode,
        duration: `${metric.duration}ms`
      })
    }
  }

  // Track custom performance metrics
  trackMetric(metric: PerformanceMetric): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    })

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    logger.debug('Performance metric tracked', {
      name: metric.name,
      value: `${metric.value} ${metric.unit}`,
      tags: metric.tags
    })
  }

  // Get performance statistics
  getAPIStats(timeWindow: number = 3600000): {
    avgDuration: number
    p95Duration: number
    p99Duration: number
    errorRate: number
    totalRequests: number
    slowRequests: number
  } {
    const now = Date.now()
    const recentMetrics = this.apiMetrics.filter(
      m => now - m.timestamp < timeWindow
    )

    if (recentMetrics.length === 0) {
      return {
        avgDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        errorRate: 0,
        totalRequests: 0,
        slowRequests: 0
      }
    }

    // Sort by duration
    const sorted = [...recentMetrics].sort((a, b) => a.duration - b.duration)

    // Calculate percentiles
    const p95Index = Math.floor(sorted.length * 0.95)
    const p99Index = Math.floor(sorted.length * 0.99)

    const avgDuration = 
      recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length

    const errorCount = recentMetrics.filter(m => m.statusCode >= 500).length
    const slowCount = recentMetrics.filter(m => m.duration > 2000).length

    return {
      avgDuration: Math.round(avgDuration),
      p95Duration: Math.round(sorted[p95Index]?.duration || 0),
      p99Duration: Math.round(sorted[p99Index]?.duration || 0),
      errorRate: (errorCount / recentMetrics.length) * 100,
      totalRequests: recentMetrics.length,
      slowRequests: slowCount
    }
  }

  // Get endpoint-specific stats
  getEndpointStats(endpoint: string, timeWindow: number = 3600000): {
    avgDuration: number
    requestCount: number
    errorCount: number
    cacheHitRate: number
  } {
    const now = Date.now()
    const endpointMetrics = this.apiMetrics.filter(
      m => m.endpoint === endpoint && now - m.timestamp < timeWindow
    )

    if (endpointMetrics.length === 0) {
      return {
        avgDuration: 0,
        requestCount: 0,
        errorCount: 0,
        cacheHitRate: 0
      }
    }

    const avgDuration =
      endpointMetrics.reduce((sum, m) => sum + m.duration, 0) / endpointMetrics.length

    const errorCount = endpointMetrics.filter(m => m.statusCode >= 500).length
    const cachedCount = endpointMetrics.filter(m => m.cached).length

    return {
      avgDuration: Math.round(avgDuration),
      requestCount: endpointMetrics.length,
      errorCount,
      cacheHitRate: (cachedCount / endpointMetrics.length) * 100
    }
  }

  // Get top slowest endpoints
  getSlowestEndpoints(limit: number = 10, timeWindow: number = 3600000): Array<{
    endpoint: string
    avgDuration: number
    requestCount: number
  }> {
    const now = Date.now()
    const recentMetrics = this.apiMetrics.filter(
      m => now - m.timestamp < timeWindow
    )

    // Group by endpoint
    const endpointMap = new Map<string, number[]>()
    for (const metric of recentMetrics) {
      if (!endpointMap.has(metric.endpoint)) {
        endpointMap.set(metric.endpoint, [])
      }
      endpointMap.get(metric.endpoint)!.push(metric.duration)
    }

    // Calculate averages and sort
    const results = Array.from(endpointMap.entries()).map(([endpoint, durations]) => ({
      endpoint,
      avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      requestCount: durations.length
    }))

    return results
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit)
  }

  // Clear old metrics
  cleanup(): void {
    const oneHourAgo = Date.now() - 3600000
    this.apiMetrics = this.apiMetrics.filter(m => m.timestamp > oneHourAgo)
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo)

    logger.info('Performance metrics cleaned up', {
      remainingAPIMetrics: this.apiMetrics.length,
      remainingMetrics: this.metrics.length
    })
  }

  // Export metrics for external monitoring
  exportMetrics(): {
    api: APIMetric[]
    custom: PerformanceMetric[]
    stats: {
      avgDuration: number
      p95Duration: number
      p99Duration: number
      errorRate: number
      totalRequests: number
      slowRequests: number
    }
  } {
    return {
      api: this.apiMetrics,
      custom: this.metrics,
      stats: this.getAPIStats()
    }
  }
}

// Middleware helper for Next.js API routes
export function withPerformanceTracking(
  handler: Function,
  endpoint: string
): Function {
  return async (...args: any[]) => {
    const start = Date.now()
    const monitor = PerformanceMonitor.getInstance()

    try {
      const result = await handler(...args)
      const duration = Date.now() - start

      monitor.trackAPI({
        endpoint,
        method: args[0]?.method || 'UNKNOWN',
        duration,
        statusCode: result?.status || 200,
        timestamp: start
      })

      return result
    } catch (error) {
      const duration = Date.now() - start

      monitor.trackAPI({
        endpoint,
        method: args[0]?.method || 'UNKNOWN',
        duration,
        statusCode: 500,
        timestamp: start
      })

      throw error
    }
  }
}

// Browser-side performance tracking
export function trackWebVitals(metric: any): void {
  const monitor = PerformanceMonitor.getInstance()

  // Track Web Vitals
  monitor.trackMetric({
    name: `web_vital_${metric.name}`,
    value: Math.round(metric.value),
    unit: 'ms',
    timestamp: Date.now(),
    tags: {
      id: metric.id,
      label: metric.label || 'custom'
    }
  })

  // Send to analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta
    })
  }
}

