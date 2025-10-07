'use client'

import { Card, CardContent } from '@/components/ui/card'
import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'

export function MetricsHero() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/dashboard')
      if (!res.ok) return { stats: { totalApplications: 0, appliedThisWeek: 0, interviewRate: 0, averageResponseTime: 0 } }
      return res.json()
    }
  })

  const stats = data?.stats || { totalApplications: 0, appliedThisWeek: 0, interviewRate: 0, averageResponseTime: 0, appliedWeekChangePct: 0 }

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="metric-card min-h-[120px]">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16 mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="metric-card min-h-[140px]">
              <div className="text-caption text-muted-foreground">Total Applications</div>
              <div className="metric-value">{stats.totalApplications}</div>
              <div className={`metric-change ${Number(stats.appliedWeekChangePct) >= 0 ? 'positive' : 'negative'}`}>
                {Number(stats.appliedWeekChangePct) >= 0 ? '+' : ''}{stats.appliedWeekChangePct}% vs last week
              </div>
            </div>
            <div className="metric-card min-h-[140px]">
              <div className="text-caption text-muted-foreground">Applied This Week</div>
              <div className="metric-value">{stats.appliedThisWeek}</div>
              <div className="metric-change">Keep a steady cadence</div>
            </div>
            <div className="metric-card min-h-[140px]">
              <div className="text-caption text-muted-foreground">Interview Rate</div>
              <div className="metric-value">{stats.interviewRate}%</div>
              <div className="metric-change positive">+2 pts</div>
            </div>
            <div className="metric-card min-h-[140px]">
              <div className="text-caption text-muted-foreground">Avg Response Time</div>
              <div className="metric-value">{stats.averageResponseTime}d</div>
              <div className="metric-change">Goal: <span className="text-foreground">&lt; 7d</span></div>
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-4">
              <InboxStatusChips />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InboxStatusChips() {
  const [state, setState] = React.useState<{ gmail?: boolean; outlook?: boolean; syncing?: boolean; last?: string }>({ syncing: false })
  React.useEffect(() => {
    const run = async () => {
      try {
        setState(s => ({ ...s, syncing: true }))
        const res = await fetch('/api/inbox/run', { method: 'POST' })
        const j = await res.json().catch(()=>({}))
        if (res.ok) {
          setState({ gmail: !!j.gmailLinked, outlook: !!j.outlookLinked, syncing: false, last: new Date().toLocaleTimeString() })
        } else {
          setState(s => ({ ...s, syncing: false }))
        }
      } catch { setState(s => ({ ...s, syncing: false })) }
    }
    run()
  }, [])
  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded text-[10px] ${state.gmail ? 'bg-green-100 text-green-700' : 'bg-muted text-foreground'}`}>Gmail {state.gmail ? 'OK' : 'Off'}</span>
      <span className={`px-2 py-0.5 rounded text-[10px] ${state.outlook ? 'bg-green-100 text-green-700' : 'bg-muted text-foreground'}`}>Outlook {state.outlook ? 'OK' : 'Off'}</span>
      {state.syncing ? <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700">Syncing…</span> : state.last ? <span className="px-2 py-0.5 rounded text-[10px] bg-muted text-foreground">{state.last}</span> : null}
    </div>
  )
}



