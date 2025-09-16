'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react'

interface Stats {
  totalApplications: number
  appliedThisWeek: number
  interviewRate: number
  averageResponseTime: number
}

export function StatsOverview() {
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0,
    appliedThisWeek: 0,
    interviewRate: 0,
    averageResponseTime: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch real stats from the analytics API
      const response = await fetch('/api/analytics/dashboard')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      } else {
        // Fallback to basic stats if analytics API fails
        const fallbackStats: Stats = {
          totalApplications: 0,
          appliedThisWeek: 0,
          interviewRate: 0,
          averageResponseTime: 0,
        }
        setStats(fallbackStats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Fallback to zero stats on error
      const fallbackStats: Stats = {
        totalApplications: 0,
        appliedThisWeek: 0,
        interviewRate: 0,
        averageResponseTime: 0,
      }
      setStats(fallbackStats)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Total Applications</span>
            </div>
            <Badge variant="secondary">{stats.totalApplications}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Applied This Week</span>
            </div>
            <Badge variant="secondary">{stats.appliedThisWeek}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Interview Rate</span>
            </div>
            <Badge variant="secondary">{stats.interviewRate}%</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">Avg Response Time</span>
            </div>
            <Badge variant="secondary">{stats.averageResponseTime} days</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Applications this week</span>
              <span className="text-sm font-medium">
                {stats.appliedThisWeek}/5
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(stats.appliedThisWeek / 5) * 100}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Network connections</span>
              <span className="text-sm font-medium">2/3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: '67%' }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Pro Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Customize your resume</strong> for each application to increase your chances by 30%.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                🎯 <strong>Follow up</strong> within 7-10 days if you haven't heard back.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
