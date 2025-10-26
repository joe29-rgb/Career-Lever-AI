'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react'
import { useDashboardStatsData } from '@/hooks/use-dashboard-stats'

export function StatsOverview() {
  const { stats, isLoading: loading } = useDashboardStatsData()

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
    <div className="space-y-4">
      {/* Quick Stats */}
      <Card className="border-0 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-card/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">Total Applications</span>
            </div>
            <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30">{stats.totalApplications}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-card/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">Applied This Week</span>
            </div>
            <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30">{stats.appliedThisWeek}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-card/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">Interview Rate</span>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30">{stats.interviewRate}%</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-card/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">Avg Response Time</span>
            </div>
            <Badge className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30 hover:from-orange-500/30 hover:to-red-500/30">{stats.averageResponseTime} days</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card className="border-0 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            Weekly Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Applications this week</span>
                <span className="text-sm font-bold text-primary">
                  {stats.appliedThisWeek}/5
                </span>
              </div>
              <div className="w-full bg-card/10 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/50"
                  style={{ width: `${Math.max(0, Math.min(100, (stats.appliedThisWeek / 5) * 100))}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Network connections</span>
                <span className="text-sm font-bold text-primary">2/3</span>
              </div>
              <div className="w-full bg-card/10 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500 shadow-lg shadow-green-500/50"
                  style={{ width: '67%' }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-0 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <span className="text-white text-sm">💡</span>
            </div>
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
              <p className="text-sm text-foreground relative z-10">
                <span className="font-bold text-blue-400">Customize your resume</span> for each application to increase your chances by 30%.
              </p>
            </div>
            <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl" />
              <p className="text-sm text-foreground relative z-10">
                <span className="font-bold text-green-400">Follow up</span> within 7-10 days if you haven't heard back.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
