import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import Resume from '@/models/Resume'
import { authOptions } from '@/lib/auth'
import { MarketIntelligenceService } from '@/lib/market-intelligence-service'
export const dynamic = 'force-dynamic'

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
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    // Get user's applications
    const applications = await JobApplication.find({ userId: session.user.id })

    // Calculate overview metrics
    const totalApplications = applications.length
    const activeApplications = applications.filter(app =>
      ['saved', 'applied'].includes(app.applicationStatus)
    ).length
    const interviewsScheduled = applications.filter(app =>
      app.applicationStatus === 'interviewing'
    ).length
    const offersReceived = applications.filter(app =>
      app.applicationStatus === 'offer'
    ).length

    const respondedApplications = applications.filter(app =>
      !['saved', 'applied'].includes(app.applicationStatus)
    )
    const responseRate = totalApplications > 0
      ? (respondedApplications.length / totalApplications) * 100
      : 0

    // Calculate average response time (simplified)
    const responseTimes = applications
      .filter(app => app.appliedDate && app.updatedAt)
      .map(app => app.updatedAt.getTime() - app.appliedDate.getTime())
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / (1000 * 60 * 60 * 24)
      : 0

    // Calculate trends
    const applicationsByMonth = calculateMonthlyTrends(applications)
    const statusDistribution = calculateStatusDistribution(applications)
    const industryBreakdown = calculateIndustryBreakdown(applications)

    // Generate insights
    const insights = await generateInsights(applications, session.user.id)

    // Calculate performance metrics
    const performance = calculatePerformanceMetrics(applications)

    const analyticsData: AnalyticsData = {
      overview: {
        totalApplications,
        activeApplications,
        interviewsScheduled,
        offersReceived,
        responseRate: Math.round(responseRate * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100
      },
      trends: {
        applicationsByMonth,
        statusDistribution,
        industryBreakdown
      },
      insights,
      performance
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

function calculateMonthlyTrends(applications: any[]) {
  const monthlyData: Record<string, number> = {}

  applications.forEach(app => {
    const month = app.createdAt.toISOString().slice(0, 7) // YYYY-MM format
    monthlyData[month] = (monthlyData[month] || 0) + 1
  })

  return Object.entries(monthlyData)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12) // Last 12 months
}

function calculateStatusDistribution(applications: any[]) {
  const distribution: Record<string, number> = {}

  applications.forEach(app => {
    distribution[app.applicationStatus] = (distribution[app.applicationStatus] || 0) + 1
  })

  return distribution
}

function getMostCommonIndustry(applications: any[]): string | undefined {
  const industryBreakdown = calculateIndustryBreakdown(applications)
  if (industryBreakdown.length === 0) return undefined
  
  // Sort by count and return top industry
  const sorted = industryBreakdown.sort((a, b) => b.count - a.count)
  return sorted[0]?.industry
}

function calculateIndustryBreakdown(applications: any[]) {
  const industryData: Record<string, number> = {}

  applications.forEach(app => {
    // For now, we'll use a simple heuristic - extract industry from company name
    // In a real app, this would come from the company research data
    const companyName = app.companyName.toLowerCase()
    let industry = 'Other'

    if (companyName.includes('tech') || companyName.includes('software') || companyName.includes('google') || companyName.includes('microsoft')) {
      industry = 'Technology'
    } else if (companyName.includes('bank') || companyName.includes('finance') || companyName.includes('capital')) {
      industry = 'Finance'
    } else if (companyName.includes('health') || companyName.includes('medical') || companyName.includes('clinic')) {
      industry = 'Healthcare'
    } else if (companyName.includes('consulting') || companyName.includes('advisory')) {
      industry = 'Consulting'
    }

    industryData[industry] = (industryData[industry] || 0) + 1
  })

  return Object.entries(industryData)
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
}

async function generateInsights(applications: any[], userId: string) {
  // Get user's resumes for additional insights
  const resumes = await Resume.find({ userId })
  const totalResumes = resumes.length
  const customizedResumes = resumes.reduce((acc, resume) => acc + resume.customizedVersions.length, 0)

  // Get real market intelligence data
  const marketIntelService = MarketIntelligenceService.getInstance()
  
  // Determine user's primary industry and role from their applications
  const userIndustry = getMostCommonIndustry(applications)
  const userRole = applications[0]?.jobTitle || 'Software Engineer' // Fallback to common role
  
  let topIndustries, marketTrends
  try {
    // Fetch real market data (with caching)
    [topIndustries, marketTrends] = await Promise.all([
      marketIntelService.getTopIndustries(),
      marketIntelService.getMarketTrends(userIndustry)
    ])
  } catch (error) {
    console.error('[ANALYTICS] Failed to fetch market intelligence:', error)
    // Fallback to basic data
    topIndustries = [
      { industry: 'Technology', count: 0, avgSalary: 120000 },
      { industry: 'Healthcare', count: 0, avgSalary: 85000 },
      { industry: 'Finance', count: 0, avgSalary: 95000 }
    ]
    marketTrends = [
      {
        trend: 'Remote work adoption',
        description: 'Remote work is now standard across industries',
        recommendation: 'Highlight remote work experience in applications'
      }
    ]
  }

  const applicationSuccessFactors = [
    { factor: 'Resume customization with AI', impact: 'high' as const },
    { factor: 'Company research integration', impact: 'high' as const },
    { factor: 'Follow-up within 7 days', impact: 'medium' as const },
    { factor: 'Keyword optimization', impact: 'medium' as const },
    { factor: 'Networking connections', impact: 'low' as const }
  ]

  const personalizedTips = [
    `You've customized ${customizedResumes} resumes - this increases interview chances by 40%!`,
    totalResumes > 0 ? 'Keep uploading more resumes to expand your opportunities' : 'Upload your first resume to get started with AI customization',
    applications.length > 10 ? 'Great progress! Focus on quality follow-ups for better response rates' : 'Apply to 2-3 jobs per week to maintain momentum',
    'Companies respond 3x faster to applications with personalized cover letters'
  ]

  return {
    topIndustries,
    applicationSuccessFactors,
    marketTrends,
    personalizedTips
  }
}

function calculatePerformanceMetrics(applications: any[]) {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyApplications = applications.filter(app => {
    const appDate = new Date(app.createdAt)
    return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear
  }).length

  const weeklyApplications = applications.filter(app => {
    const appDate = new Date(app.createdAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return appDate >= weekAgo
  }).length

  // Goals: 15 applications per month, 4 per week
  const monthlyGoalProgress = Math.min((monthlyApplications / 15) * 100, 100)
  const weeklyGoalProgress = Math.min((weeklyApplications / 4) * 100, 100)

  const improvementAreas: string[] = []
  const strengths: string[] = []

  if (weeklyApplications < 2) {
    improvementAreas.push('Increase application volume - aim for 3-4 per week')
  } else {
    strengths.push('Consistent application activity')
  }

  const responseRate = applications.length > 0
    ? (applications.filter(app => !['saved', 'applied'].includes(app.applicationStatus)).length / applications.length) * 100
    : 0

  if (responseRate < 10) {
    improvementAreas.push('Improve response rate through better customization')
  } else {
    strengths.push('Good response rate from applications')
  }

  if (applications.filter(app => app.applicationStatus === 'interviewing').length === 0) {
    improvementAreas.push('Focus on interview preparation and follow-ups')
  } else {
    strengths.push('Successfully securing interviews')
  }

  // Variant performance
  const byVariant: Record<string, { views: number; interviews: number; offers: number }> = {}
  applications.forEach(app => {
    const v = app.variantUsed || 'A'
    if (!byVariant[v]) byVariant[v] = { views: 0, interviews: 0, offers: 0 }
    byVariant[v].views += app.views || 0
    byVariant[v].interviews += app.interviews || 0
    byVariant[v].offers += app.offers || 0
  })
  const variantPerformance = Object.entries(byVariant).map(([variant, vals]) => ({ variant, ...vals }))

  // Source lift: compute (interviews+offers)/views per source vs overall
  const bySource: Record<string, { views: number; conv: number }> = {}
  applications.forEach(app => {
    const s = app.applicationSource || 'unknown'
    if (!bySource[s]) bySource[s] = { views: 0, conv: 0 }
    bySource[s].views += app.views || 0
    bySource[s].conv += (app.interviews || 0) + (app.offers || 0)
  })
  const overallViews = Object.values(bySource).reduce((a,b)=>a+b.views,0) || 1
  const overallConv = Object.values(bySource).reduce((a,b)=>a+b.conv,0)
  const overallRate = overallConv / overallViews
  const sourceLift = Object.entries(bySource).map(([source, vals]) => ({ source, lift: (vals.views ? (vals.conv/vals.views) : 0) - overallRate }))

  return {
    weeklyGoalProgress: Math.round(weeklyGoalProgress),
    monthlyGoalProgress: Math.round(monthlyGoalProgress),
    improvementAreas,
    strengths,
    variantPerformance,
    sourceLift
  }
}

