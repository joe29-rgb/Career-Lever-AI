'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { isFeatureEnabled } from '@/lib/flags'

interface Insight {
  title: string
  detail: string
}

export default function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        // Compute success probability if cache available
        let success: { score: number } | null = null
        try {
          const jd = localStorage.getItem('job:description') || ''
          const rt = localStorage.getItem('resume:latest') || ''
          if (jd && rt) {
            const r = await fetch('/api/insights/success', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobDescription: jd, resumeText: rt }) })
            const j = await r.json().catch(()=>({}))
            if (r.ok && j.success && j.successScore) success = { score: j.successScore.score }
          }
        } catch {}

        // Use cached stats from shared hook instead of fetching again
        const res = await fetch('/api/analytics/dashboard')
        if (res.ok) {
          const data = await res.json()
          const s = data?.stats || { totalApplications: 0, appliedThisWeek: 0, interviewRate: 0 }
          // TODO: Refactor to use useDashboardStatsData() hook
          const items: Insight[] = [
            { title: 'Focus company outreach', detail: `Interview rate at ${s.interviewRate}% — tailor follow-ups to top targets.` },
            { title: 'Consistency wins', detail: `Apply to at least ${(s.appliedThisWeek || 0) + 3} roles this week to maintain momentum.` },
          ]
          setInsights(items)
          if (typeof success?.score === 'number') {
            setInsights(prev => [{ title: 'Success Probability', detail: `${success!.score}% estimated chance — strengthen missing keywords and quantify recent wins.` }, ...prev])
          }
          // Optional market intel summary (behind flag)
          if (isFeatureEnabled('intel-dashboard')) {
            try {
              const cname = localStorage.getItem('job:company') || ''
              const role = localStorage.getItem('job:title') || ''
              if (cname) {
                const mi = await fetch('/api/v2/company/intel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName: cname, role }) })
                const mj = await mi.json().catch(()=>({}))
                if (mi.ok && mj.success && mj.intel?.summary) {
                  setInsights(prev => [{ title: 'Market Intel', detail: mj.intel.summary.split('\n')[0] || 'New signals available.' }, ...prev])
                }
              }
            } catch {}
          }
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


