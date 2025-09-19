'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'

export function MetricsHero() {
  const { data } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/dashboard')
      if (!res.ok) return { stats: { totalApplications: 0, appliedThisWeek: 0, interviewRate: 0, averageResponseTime: 0 } }
      return res.json()
    }
  })

  const stats = data?.stats || { totalApplications: 0, appliedThisWeek: 0, interviewRate: 0, averageResponseTime: 0 }

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-caption text-gray-500">Total Applications</div>
            <div className="text-3xl font-semibold">{stats.totalApplications}</div>
          </div>
          <div>
            <div className="text-caption text-gray-500">Applied This Week</div>
            <div className="text-3xl font-semibold">{stats.appliedThisWeek}</div>
          </div>
          <div>
            <div className="text-caption text-gray-500">Interview Rate</div>
            <div className="text-3xl font-semibold">{stats.interviewRate}%</div>
          </div>
          <div>
            <div className="text-caption text-gray-500">Avg Response Time</div>
            <div className="text-3xl font-semibold">{stats.averageResponseTime}d</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


