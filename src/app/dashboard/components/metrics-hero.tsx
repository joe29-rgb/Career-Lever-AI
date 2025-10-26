'use client'

import { Card, CardContent } from '@/components/ui/card'
import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Briefcase, Calendar, Target, Clock } from 'lucide-react'
import { useDashboardStatsData } from '@/hooks/use-dashboard-stats'

export function MetricsHero() {
  const { stats, isLoading } = useDashboardStatsData()

  const metricCards = [
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      change: stats.appliedWeekChangePct,
      changeText: 'vs last week',
      icon: Briefcase,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      title: 'Applied This Week',
      value: stats.appliedThisWeek,
      subtitle: 'Keep a steady cadence',
      icon: Calendar,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      title: 'Interview Rate',
      value: `${stats.interviewRate}%`,
      change: 2,
      changeText: 'pts increase',
      icon: Target,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
    },
    {
      title: 'Avg Response Time',
      value: `${stats.averageResponseTime}d`,
      subtitle: 'Goal: < 7 days',
      icon: Clock,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10',
    },
  ]

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((metric, index) => (
            <Card 
              key={index}
              className="group relative overflow-hidden border-0 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl hover:from-white/10 hover:to-white/[0.05] transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <CardContent className="relative p-6">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${metric.gradient} mb-4 shadow-lg`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>

                {/* Label */}
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {metric.title}
                </div>

                {/* Value */}
                <div className="text-4xl font-bold text-foreground mb-2 tracking-tight">
                  {metric.value}
                </div>

                {/* Change or Subtitle */}
                {metric.change !== undefined ? (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    Number(metric.change) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Number(metric.change) >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                      {Number(metric.change) >= 0 ? '+' : ''}{metric.change}% {metric.changeText}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {metric.subtitle}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Inbox Status */}
      <Card className="border-0 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl">
        <CardContent className="p-4">
          <InboxStatusChips />
        </CardContent>
      </Card>
    </div>
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
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">Inbox Status:</span>
      </div>
      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        state.gmail 
          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
          : 'bg-white/5 text-muted-foreground border border-white/10'
      }`}>
        Gmail {state.gmail ? '✓' : '○'}
      </span>
      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        state.outlook 
          ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30' 
          : 'bg-white/5 text-muted-foreground border border-white/10'
      }`}>
        Outlook {state.outlook ? '✓' : '○'}
      </span>
      {state.syncing && (
        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 animate-pulse">
          Syncing...
        </span>
      )}
      {state.last && !state.syncing && (
        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-card/5 text-muted-foreground border border-white/10">
          Last sync: {state.last}
        </span>
      )}
    </div>
  )
}



