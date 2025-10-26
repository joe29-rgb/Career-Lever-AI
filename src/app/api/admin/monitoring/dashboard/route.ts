import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerformanceMonitor } from '@/lib/performance-monitor'
import { EnterpriseAIService } from '@/lib/ai-service-enterprise'
import { RedisCache } from '@/lib/redis-cache'
import { HealthCheckService } from '@/lib/health-check'

/**
 * Admin Monitoring Dashboard API
 * Provides comprehensive system health and performance metrics
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SystemMetrics {
  timestamp: string
  health: {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    services: any
    uptime: number
  }
  performance: {
    api: any
    responseTime: {
      avg: number
      p95: number
      p99: number
    }
  }
  ai: {
    stats: any
    cacheHitRate: number
  }
  cache: {
    redis: any
    hitRate: number
  }
  errors: {
    last24h: number
    last1h: number
    topErrors: Array<{ message: string; count: number }>
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Gather all metrics
    const healthCheckService = HealthCheckService.getInstance()
    const healthCheck = await healthCheckService.performHealthCheck()
    const perfMonitor = PerformanceMonitor.getInstance()
    const aiService = EnterpriseAIService.getInstance()
    const redisCache = RedisCache.getInstance()

    const performanceStats = perfMonitor.getAPIStats()
    const aiStats = aiService.getStats()
    const cacheStats = await redisCache.getStats()

    // Calculate aggregate metrics
    const apiMetrics: any[] = Object.values(performanceStats)
    const avgResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum: number, m: any) => sum + (m.avgDuration || 0), 0) / apiMetrics.length
      : 0

    const durations = apiMetrics.map((m: any) => m.avgDuration || 0).sort((a, b) => a - b)
    const p95ResponseTime = durations.length > 0
      ? durations[Math.min(Math.floor(durations.length * 0.95), durations.length - 1)] || 0
      : 0

    const p99ResponseTime = durations.length > 0
      ? durations[Math.min(Math.floor(durations.length * 0.99), durations.length - 1)] || 0
      : 0

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      health: {
        overall: healthCheck.status,
        services: healthCheck.services,
        uptime: process.uptime()
      },
      performance: {
        api: performanceStats,
        responseTime: {
          avg: Math.round(avgResponseTime),
          p95: Math.round(p95ResponseTime),
          p99: Math.round(p99ResponseTime)
        }
      },
      ai: {
        stats: aiStats,
        cacheHitRate: aiStats.cacheHitRate || 0
      },
      cache: {
        redis: cacheStats,
        hitRate: cacheStats.hitRate || 0
      },
      errors: {
        last24h: 0, // TODO: Implement error tracking
        last1h: 0,
        topErrors: []
      }
    }

    return NextResponse.json({
      success: true,
      metrics,
      recommendations: generateRecommendations(metrics)
    })
  } catch (error) {
    console.error('[MONITORING] Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data', details: (error as Error).message },
      { status: 500 }
    )
  }
}

function generateRecommendations(metrics: SystemMetrics): string[] {
  const recommendations: string[] = []

  // Performance recommendations
  if (metrics.performance.responseTime.avg > 1000) {
    recommendations.push('⚠️ Average API response time is high (>1s). Consider optimizing slow endpoints.')
  }

  if (metrics.performance.responseTime.p99 > 3000) {
    recommendations.push('🔴 P99 response time is very high (>3s). Investigate slowest endpoints.')
  }

  // AI service recommendations
  if (metrics.ai.cacheHitRate < 0.5) {
    recommendations.push('💡 AI cache hit rate is low (<50%). Consider increasing cache TTL or improving cache keys.')
  }

  if (metrics.ai.stats.circuitBreakerTrips > 10) {
    recommendations.push('🔴 AI service circuit breaker has tripped multiple times. Check Perplexity API health.')
  }

  // Cache recommendations
  if (metrics.cache.hitRate < 0.6) {
    recommendations.push('💡 Redis cache hit rate is low (<60%). Review caching strategy.')
  }

  // Health recommendations
  if (metrics.health.overall === 'degraded') {
    recommendations.push('⚠️ System health is degraded. Check individual service statuses.')
  }

  if (metrics.health.overall === 'unhealthy') {
    recommendations.push('🔴 System is unhealthy! Immediate attention required.')
  }

  // Error recommendations
  if (metrics.errors.last1h > 50) {
    recommendations.push('🔴 High error rate in last hour (>50). Investigate immediately.')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All systems operating normally. No immediate action required.')
  }

  return recommendations
}

