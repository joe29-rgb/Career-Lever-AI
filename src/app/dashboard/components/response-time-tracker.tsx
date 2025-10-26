'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, TrendingUp, TrendingDown } from 'lucide-react'

interface ResponseMetrics {
  averageResponseTime: number
  fastestResponse: number
  slowestResponse: number
  totalResponses: number
  trend: 'up' | 'down' | 'stable'
}

export function ResponseTimeTracker() {
  const [metrics, setMetrics] = useState<ResponseMetrics>({
    averageResponseTime: 0,
    fastestResponse: 0,
    slowestResponse: 0,
    totalResponses: 0,
    trend: 'stable'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResponseMetrics()
  }, [])

  const fetchResponseMetrics = async () => {
    try {
      const response = await fetch('/api/applications/response-metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('[RESPONSE_METRICS] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDays = (days: number) => {
    if (days === 0) return 'N/A'
    if (days < 1) return '< 1 day'
    if (days === 1) return '1 day'
    return `${Math.round(days)} days`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Time Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Response Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Average Response Time */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl">
            <div className="text-sm text-muted-foreground mb-2">Average Response Time</div>
            <div className="text-4xl font-bold text-primary mb-2">
              {formatDays(metrics.averageResponseTime)}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              {metrics.trend === 'down' ? (
                <>
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Improving</span>
                </>
              ) : metrics.trend === 'up' ? (
                <>
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">Slowing</span>
                </>
              ) : (
                <span className="text-muted-foreground">Stable</span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Fastest</div>
              <div className="text-2xl font-bold text-green-600">
                {formatDays(metrics.fastestResponse)}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Slowest</div>
              <div className="text-2xl font-bold text-red-600">
                {formatDays(metrics.slowestResponse)}
              </div>
            </div>
          </div>

          {/* Total Responses */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Responses</span>
              <span className="text-lg font-bold">{metrics.totalResponses}</span>
            </div>
          </div>

          {/* Insights */}
          {metrics.averageResponseTime > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {metrics.averageResponseTime <= 7 ? (
                  <>✨ Great! Companies are responding quickly to your applications.</>
                ) : metrics.averageResponseTime <= 14 ? (
                  <>⏳ Average response time. Keep following up after 1 week.</>
                ) : (
                  <>📧 Consider following up on applications older than 2 weeks.</>
                )}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
