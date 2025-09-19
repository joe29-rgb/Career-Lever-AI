'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Insight {
  title: string
  detail: string
}

export function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/analytics/dashboard')
        if (res.ok) {
          const data = await res.json()
          const s = data?.stats || { totalApplications: 0, appliedThisWeek: 0, interviewRate: 0 }
          const items: Insight[] = [
            { title: 'Focus company outreach', detail: `Interview rate at ${s.interviewRate}% — tailor follow-ups to top targets.` },
            { title: 'Consistency wins', detail: `Apply to at least ${(s.appliedThisWeek || 0) + 3} roles this week to maintain momentum.` },
          ]
          setInsights(items)
        } else {
          setInsights([
            { title: 'Get started', detail: 'Upload a resume and analyze a role to unlock insights.' },
          ])
        }
      } catch (e) {
        setInsights([
          { title: 'Get started', detail: 'Upload a resume and analyze a role to unlock insights.' },
        ])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>AI Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-3/5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-2/5 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ) : (
          <ul className="space-y-3">
            {insights.map((insight, idx) => (
              <li key={idx} className="p-3 rounded-md bg-blue-50 text-blue-900">
                <div className="font-medium">{insight.title}</div>
                <div className="text-sm text-blue-800">{insight.detail}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}


