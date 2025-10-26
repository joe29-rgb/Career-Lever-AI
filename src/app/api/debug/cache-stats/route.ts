/**
 * Cache Statistics Debug Endpoint
 * 
 * Provides detailed cache statistics for Perplexity AI integration.
 * Access: /api/debug/cache-stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerplexityService } from '@/lib/perplexity-service'

/**
 * GET /api/debug/cache-stats
 * Get cache statistics
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

    // Get cache stats from PerplexityService
    const cacheStats = PerplexityService.getCacheStats()

    // Calculate additional metrics
    const stats = {
      ...cacheStats,
      efficiency: cacheStats.totalEntries > 0
        ? {
            freshPercentage: (cacheStats.entriesByAge.fresh / cacheStats.totalEntries) * 100,
            stalePercentage: (cacheStats.entriesByAge.stale / cacheStats.totalEntries) * 100,
            avgEntrySize: cacheStats.totalEntries > 0
              ? cacheStats.totalSize / cacheStats.totalEntries
              : 0,
            totalSizeMB: cacheStats.totalSize / (1024 * 1024)
          }
        : null,
      timestamp: Date.now()
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error: any) {
    console.error('Cache stats endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve cache statistics', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/debug/cache-stats
 * Clear cache
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

    const clearedCount = PerplexityService.clearCache()

    return NextResponse.json({
      success: true,
      message: `Cache cleared: ${clearedCount} entries removed`,
      clearedCount
    })
  } catch (error: any) {
    console.error('Cache clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/debug/cache-stats/detailed
 * Get detailed cache information
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { includeKeys = false } = body

    const cacheStats = PerplexityService.getCacheStats()

    // Get additional detailed information
    const detailedStats = {
      ...cacheStats,
      cacheHealth: {
        status: cacheStats.totalEntries < 100 ? 'healthy' :
                cacheStats.totalEntries < 500 ? 'moderate' : 'high',
        recommendation: cacheStats.totalEntries > 800
          ? 'Consider clearing stale entries'
          : 'Cache is performing well'
      },
      memoryUsage: {
        totalBytes: cacheStats.totalSize,
        totalKB: cacheStats.totalSize / 1024,
        totalMB: cacheStats.totalSize / (1024 * 1024),
        estimatedHeapImpact: (cacheStats.totalSize / (1024 * 1024 * 1024)) * 100 // % of 1GB
      },
      recommendations: generateRecommendations(cacheStats)
    }

    return NextResponse.json({
      success: true,
      stats: detailedStats,
      timestamp: Date.now()
    })
  } catch (error: any) {
    console.error('Detailed cache stats error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve detailed cache statistics', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate cache recommendations based on stats
 */
function generateRecommendations(stats: any): string[] {
  const recommendations: string[] = []

  if (stats.totalEntries === 0) {
    recommendations.push('Cache is empty - requests are not being cached')
  }

  if (stats.totalEntries > 800) {
    recommendations.push('Cache is nearly full - consider implementing cache eviction or increasing max size')
  }

  if (stats.entriesByAge.stale > stats.entriesByAge.fresh) {
    recommendations.push('More stale entries than fresh - consider reducing TTL or clearing stale entries')
  }

  if (stats.totalSize > 50 * 1024 * 1024) { // 50MB
    recommendations.push('Cache size is large - monitor memory usage and consider compression')
  }

  if (recommendations.length === 0) {
    recommendations.push('Cache is healthy and performing optimally')
  }

  return recommendations
}

