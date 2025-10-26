'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Share,
  Calendar,
  Briefcase,
  DollarSign,
  Lightbulb
} from 'lucide-react'
import toast from 'react-hot-toast'
// Removed Recharts dependency for serverless build stability

interface AnalyticsData {
  overview: {
    totalApplications: number
    activeApplications: number
    interviewsScheduled: number
    offersReceived: number
    responseRate: number
    averageResponseTime: number
  }
  trends: {
    applicationsByMonth: Array<{ month: string; count: number }>
    statusDistribution: Record<string, number>
    industryBreakdown: Array<{ industry: string; count: number }>
  }
  insights: {
    topIndustries: Array<{ industry: string; count: number; avgSalary?: number }>
    applicationSuccessFactors: Array<{ factor: string; impact: 'high' | 'medium' | 'low' }>
    marketTrends: Array<{ trend: string; description: string; recommendation: string }>
    personalizedTips: string[]
  }
  performance: {
    weeklyGoalProgress: number
    monthlyGoalProgress: number
    improvementAreas: string[]
    strengths: string[]
    variantPerformance?: Array<{ variant: string; views: number; interviews: number; offers: number }>
    sourceLift?: Array<{ source: string; lift: number }>
  }
}

interface AnalyticsDashboardProps {
  userId: string
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [ops, setOps] = useState<{avgLatencyMs:number; p95LatencyMs:number; counters: Record<string, number>}|null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
      } else {
        toast.error('Failed to load analytics')
      }
      try {
        const r2 = await fetch('/api/ops/metrics')
        if (r2.ok) { const j = await r2.json(); setOps({ avgLatencyMs: j.avgLatencyMs || 0, p95LatencyMs: j.p95LatencyMs || 0, counters: j.counters || {} }) }
      } catch {}
    } catch (error) {
      console.error('Analytics fetch error:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return <AnalyticsSkeleton />
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Analytics Available</h3>
          <p className="text-muted-foreground mb-4">
            Start applying to jobs to see your analytics and insights.
          </p>
          <Button>Start Applying</Button>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800'
      case 'interviewing': return 'bg-yellow-100 text-yellow-800'
      case 'offer': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-muted text-foreground'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Your Career Analytics</h2>
          <p className="text-muted-foreground">Data-driven insights to optimize your job search</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchAnalytics}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-3xl font-bold text-foreground">{analytics.overview.totalApplications}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12% this month</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                <p className="text-3xl font-bold text-foreground">{analytics.overview.responseRate}%</p>
                <div className="flex items-center mt-2">
                  {analytics.overview.responseRate >= 20 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${analytics.overview.responseRate >= 20 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.overview.responseRate >= 20 ? 'Above average' : 'Below average'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interviews</p>
                <p className="text-3xl font-bold text-foreground">{analytics.overview.interviewsScheduled}</p>
                <div className="flex items-center mt-2">
                  <Users className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">Scheduled</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offers</p>
                <p className="text-3xl font-bold text-foreground">{analytics.overview.offersReceived}</p>
                <div className="flex items-center mt-2">
                  <Award className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">Received</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        {ops && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Latency (p95)</p>
                  <p className="text-3xl font-bold text-foreground">{ops.p95LatencyMs}ms</p>
                  <div className="text-sm text-muted-foreground">Avg {ops.avgLatencyMs}ms</div>
                </div>
                <div className="p-3 bg-sky-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {/* Application Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Applications</CardTitle>
                <CardDescription>Your application activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.trends.applicationsByMonth.slice(-6).map((item, index) => (
                    <div key={item.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.month}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(item.count / Math.max(...analytics.trends.applicationsByMonth.map(d => d.count))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>Distribution of your application statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.trends.statusDistribution).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge className={getStatusColor(status)}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Industry Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Industry Focus</CardTitle>
              <CardDescription>Industries you're targeting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.trends.industryBreakdown.map((industry, index) => (
                  <div key={industry.industry} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">{industry.industry}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(industry.count / Math.max(...analytics.trends.industryBreakdown.map(d => d.count))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8">{industry.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Success Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Success Factors
              </CardTitle>
              <CardDescription>Factors that impact your application success</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.insights.applicationSuccessFactors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      factor.impact === 'high' ? 'bg-red-500' :
                      factor.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{factor.factor}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Impact: <span className={`font-medium ${getImpactColor(factor.impact)}`}>
                          {factor.impact.charAt(0).toUpperCase() + factor.impact.slice(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Trends
              </CardTitle>
              <CardDescription>Current trends affecting your job search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.insights.marketTrends.map((trend, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">{trend.trend}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{trend.description}</p>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-blue-800">
                        <strong>Recommendation:</strong> {trend.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Personalized Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Personalized Tips
              </CardTitle>
              <CardDescription>Tailored advice based on your activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.insights.personalizedTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-yellow-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Goal Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Goals</CardTitle>
                <CardDescription>Applications per week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">{analytics.performance.weeklyGoalProgress}%</span>
                  </div>
                  <Progress value={analytics.performance.weeklyGoalProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    Target: 4 applications per week
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Goals</CardTitle>
                <CardDescription>Applications per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">{analytics.performance.monthlyGoalProgress}%</span>
                  </div>
                  <Progress value={analytics.performance.monthlyGoalProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    Target: 15 applications per month
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Variant Performance (simple) */}
          {analytics.performance.variantPerformance && analytics.performance.variantPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resume Variant Performance</CardTitle>
                <CardDescription>Views/Interviews/Offers by variant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.performance.variantPerformance.map((row:any)=> (
                    <div key={row.variant} className="space-y-1">
                      <div className="text-sm font-medium">Variant {row.variant}</div>
                      <div className="text-xs text-muted-foreground">Views</div>
                      <div className="w-full bg-gray-200 rounded h-2"><div className="bg-blue-600 h-2 rounded" style={{ width: `${Math.min(100, row.views)}%` }} /></div>
                      <div className="text-xs text-muted-foreground mt-1">Interviews</div>
                      <div className="w-full bg-gray-200 rounded h-2"><div className="bg-yellow-500 h-2 rounded" style={{ width: `${Math.min(100, row.interviews*10)}%` }} /></div>
                      <div className="text-xs text-muted-foreground mt-1">Offers</div>
                      <div className="w-full bg-gray-200 rounded h-2"><div className="bg-green-600 h-2 rounded" style={{ width: `${Math.min(100, row.offers*20)}%` }} /></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Source Lift */}
          {analytics.performance.sourceLift && analytics.performance.sourceLift.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Source Lift</CardTitle>
                <CardDescription>Relative interview/offer lift by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.performance.sourceLift.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{s.source}</span>
                      <Badge variant={s.lift >= 0 ? 'secondary' : 'destructive'}>{(s.lift >= 0 ? '+' : '')}{Math.round(s.lift * 100)}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths and Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.performance.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.performance.improvementAreas.map((area, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          {/* Top Industries */}
          <Card>
            <CardHeader>
              <CardTitle>Top Industries</CardTitle>
              <CardDescription>Most active industries in your job search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.insights.topIndustries.map((industry, index) => (
                  <div key={industry.industry} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{industry.industry}</h4>
                        <p className="text-sm text-muted-foreground">{industry.count} applications</p>
                      </div>
                    </div>
                    {industry.avgSalary && (
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">${industry.avgSalary.toLocaleString()}/year</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Avg Salary</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="animate-pulse">
          <div className="w-64 h-8 bg-gray-200 rounded mb-2"></div>
          <div className="w-96 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="flex gap-3">
          <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-6 shadow-sm animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
            <div className="w-20 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="bg-card rounded-lg shadow-sm">
        <div className="border-b p-6">
          <div className="flex gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-20 h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="w-48 h-6 bg-gray-200 rounded mb-4"></div>
            <div className="w-full h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}




