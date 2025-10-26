'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, ClipboardList, Sparkles, Target, Bell, Route } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDashboardStatsData } from '@/hooks/use-dashboard-stats'

export function ActionCenter() {
  const router = useRouter()
  const { stats, isLoading } = useDashboardStatsData()

  const actions = [
    {
      title: 'Find Jobs',
      description: 'Search for jobs with AI-powered matching and analysis.',
      icon: ClipboardList,
      href: '/career-finder/search',
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Research a Company',
      description: 'Get culture, news, and talking points for outreach and interviews.',
      icon: Target,
      href: '/career-finder/company',
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      title: 'Optimize Resume',
      description: 'Tailor your resume for higher match scores and better responses.',
      icon: Sparkles,
      href: '/career-finder/optimizer',
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Alerts & Preferences',
      description: 'Manage job alerts, locations, and frequency to get daily finds.',
      icon: Bell,
      href: '/settings/alerts',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Commute Filters',
      description: 'Filter jobs by travel time and preferred mode from your address.',
      icon: Route,
      href: '/jobs?commute=1',
      color: 'text-sky-600',
      bg: 'bg-sky-100',
    },
  ]

  return (
    <Card className="glass-card action-center">
      <CardHeader>
        <CardTitle>Smart Action Center</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              {stats.appliedThisWeek > 0
                ? `Great work — ${stats.appliedThisWeek} applications this week. Keep momentum with these actions.`
                : 'Kickstart your week with these recommended actions.'}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {actions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex items-center justify-between hover:shadow-md transition whitespace-pre-wrap break-words text-left action-primary"
                  onClick={() => router.push(action.href)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-2 ${action.bg}`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground leading-normal">{action.title}</div>
                      <div className="text-xs text-muted-foreground leading-normal">{action.description}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}



