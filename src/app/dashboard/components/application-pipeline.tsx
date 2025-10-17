'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Send, Calendar, CheckCircle2, XCircle } from 'lucide-react'

interface PipelineStats {
  applied: number
  screening: number
  interview: number
  offer: number
  rejected: number
}

export function ApplicationPipeline() {
  const [stats, setStats] = useState<PipelineStats>({
    applied: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    rejected: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPipelineStats()
  }, [])

  const fetchPipelineStats = async () => {
    try {
      const response = await fetch('/api/applications/pipeline-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('[PIPELINE] Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const stages = [
    { name: 'Applied', count: stats.applied, icon: FileText, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { name: 'Screening', count: stats.screening, icon: Send, color: 'bg-purple-500', textColor: 'text-purple-600' },
    { name: 'Interview', count: stats.interview, icon: Calendar, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { name: 'Offer', count: stats.offer, icon: CheckCircle2, color: 'bg-green-500', textColor: 'text-green-600' },
    { name: 'Rejected', count: stats.rejected, icon: XCircle, color: 'bg-red-500', textColor: 'text-red-600' }
  ]

  const total = stats.applied + stats.screening + stats.interview + stats.offer + stats.rejected

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Application Pipeline</span>
          <span className="text-sm font-normal text-muted-foreground">{total} Total</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const percentage = total > 0 ? (stage.count / total) * 100 : 0
            const Icon = stage.icon

            return (
              <div key={stage.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${stage.textColor}`} />
                    <span className="font-medium">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{stage.count}</span>
                    <span className="text-sm text-muted-foreground">
                      ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className={`${stage.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Success Rate */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Success Rate</span>
            <span className="text-lg font-bold text-green-600">
              {total > 0 ? ((stats.offer / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Offers received out of total applications
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Interview Conversion</span>
            <span className="text-lg font-bold text-yellow-600">
              {stats.applied > 0 ? ((stats.interview / stats.applied) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Applications that reached interview stage
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
