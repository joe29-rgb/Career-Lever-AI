/**
 * Performance Monitoring Debug Endpoint
 * 
 * Provides detailed performance metrics for Perplexity AI integration.
 * Access: /api/debug/performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Performance metrics storage (in-memory for now)
interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
  cacheHit?: boolean
  tokenUsage?: {
    prompt: number
    completion: number
    total: number
  }
  cost?: number
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 1000

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  getMetrics(since?: number): PerformanceMetric[] {
    if (since) {
      return this.metrics.filter(m => m.timestamp >= since)
    }
    return this.metrics
  }

  getStats() {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    const oneDayAgo = now - (24 * 60 * 60 * 1000)

    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo)
    const dailyMetrics = this.metrics.filter(m => m.timestamp >= oneDayAgo)

    return {
      totalRequests: this.metrics.length,
      hourly: this.calculateStats(recentMetrics),
      daily: this.calculateStats(dailyMetrics),
      byOperation: this.groupByOperation(),
      errorRate: this.calculateErrorRate(),
      cacheEfficiency: this.calculateCacheEfficiency(),
      costAnalysis: this.calculateCostAnalysis()
    }
  }

  private calculateStats(metrics: PerformanceMetric[]) {
    if (metrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        successRate: 0
      }
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b)
    const successful = metrics.filter(m => m.success).length

    return {
      count: metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50: this.percentile(durations, 0.50),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
      successRate: (successful / metrics.length) * 100
    }
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0
    const index = Math.ceil(arr.length * p) - 1
    return arr[index]
  }

  private groupByOperation() {
    const groups: Record<string, {
      count: number
      avgDuration: number
      successRate: number
    }> = {}

    for (const metric of this.metrics) {
      if (!groups[metric.operation]) {
        groups[metric.operation] = { count: 0, avgDuration: 0, successRate: 0 }
      }

      const group = groups[metric.operation]
      group.count++
      group.avgDuration = (group.avgDuration * (group.count - 1) + metric.duration) / group.count
      group.successRate = ((group.successRate * (group.count - 1) + (metric.success ? 100 : 0)) / group.count)
    }

    return groups
  }

  private calculateErrorRate() {
    if (this.metrics.length === 0) return 0
    const errors = this.metrics.filter(m => !m.success).length
    return (errors / this.metrics.length) * 100
  }

  private calculateCacheEfficiency() {
    const cacheableMetrics = this.metrics.filter(m => m.cacheHit !== undefined)
    if (cacheableMetrics.length === 0) {
      return { hitRate: 0, hits: 0, misses: 0 }
    }

    const hits = cacheableMetrics.filter(m => m.cacheHit).length
    const misses = cacheableMetrics.length - hits

    return {
      hitRate: (hits / cacheableMetrics.length) * 100,
      hits,
      misses
    }
  }

  private calculateCostAnalysis() {
    const metricsWithCost = this.metrics.filter(m => m.cost !== undefined)
    if (metricsWithCost.length === 0) {
      return { totalCost: 0, avgCost: 0, maxCost: 0 }
    }

    const costs = metricsWithCost.map(m => m.cost!)
    return {
      totalCost: costs.reduce((a, b) => a + b, 0),
      avgCost: costs.reduce((a, b) => a + b, 0) / costs.length,
      maxCost: Math.max(...costs)
    }
  }

  clearMetrics(): void {
    this.metrics = []
  }
}

// Export for use in other files
export const performanceMonitor = PerformanceMonitor.getInstance()

/**
 * GET /api/debug/performance
 * Get performance statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication (optional - can be restricted to admins)
    const session = await getServerSession(authOptions)
    
    // In production, restrict to authenticated users only
    // TODO: Add admin role check when user roles are implemented
    if (process.env.NODE_ENV === 'production' && !session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const raw = searchParams.get('raw') === 'true'

    const monitor = PerformanceMonitor.getInstance()

    if (raw) {
      const metrics = since 
        ? monitor.getMetrics(parseInt(since))
        : monitor.getMetrics()

      return NextResponse.json({
        success: true,
        metrics,
        count: metrics.length
      })
    }

    const stats = monitor.getStats()

    return NextResponse.json({
      success: true,
      stats,
      timestamp: Date.now()
    })
  } catch (error: any) {
    console.error('Performance endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve performance metrics', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/debug/performance
 * Clear performance metrics
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    // TODO: Add admin role check when user roles are implemented
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    const monitor = PerformanceMonitor.getInstance()
    monitor.clearMetrics()

    return NextResponse.json({
      success: true,
      message: 'Performance metrics cleared'
    })
  } catch (error: any) {
    console.error('Performance clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear metrics', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/debug/performance/track
 * Manually track a performance metric
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, duration, success, error, cacheHit, tokenUsage, cost } = body

    if (!operation || duration === undefined || success === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: operation, duration, success' },
        { status: 400 }
      )
    }

    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      error,
      cacheHit,
      tokenUsage,
      cost
    }

    const monitor = PerformanceMonitor.getInstance()
    monitor.addMetric(metric)

    return NextResponse.json({
      success: true,
      message: 'Metric tracked'
    })
  } catch (error: any) {
    console.error('Performance track error:', error)
    return NextResponse.json(
      { error: 'Failed to track metric', details: error.message },
      { status: 500 }
    )
  }
}

