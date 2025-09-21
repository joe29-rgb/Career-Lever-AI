'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, ClipboardList, Sparkles, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ActionCenter() {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/dashboard')
      if (!res.ok) return { stats: { totalApplications: 0, appliedThisWeek: 0, interviewRate: 0 } }
      return res.json()
    }
  })

  const stats = data?.stats || { totalApplications: 0, appliedThisWeek: 0, interviewRate: 0 }

  const actions = [
    {
      title: 'Analyze a Job',
      description: 'Paste a job description to extract key requirements and keywords.',
      icon: ClipboardList,
      href: '/create-application?step=analyze',
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Research a Company',
      description: 'Get culture, news, and talking points for outreach and interviews.',
      icon: Target,
      href: '/create-application?step=research',
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      title: 'Customize Your Resume',
      description: 'Tailor your resume for higher match scores and better responses.',
      icon: Sparkles,
      href: '/create-application?step=customize',
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ]

  return (
    <Card className="glass-card">
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
            <div className="text-sm text-gray-600">
              {stats.appliedThisWeek > 0
                ? `Great work — ${stats.appliedThisWeek} applications this week. Keep momentum with these actions.`
                : 'Kickstart your week with these recommended actions.'}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {actions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex items-center justify-between hover:shadow-md transition"
                  onClick={() => router.push(action.href)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-2 ${action.bg}`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{action.title}</div>
                      <div className="text-xs text-gray-600">{action.description}</div>
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


