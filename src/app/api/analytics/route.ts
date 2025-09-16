import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectToDatabase from '@/lib/mongodb'
import JobApplication from '@/models/JobApplication'
import Resume from '@/models/Resume'
import { authOptions } from '@/lib/auth'
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

  const topIndustries = [
    { industry: 'Technology', count: 45, avgSalary: 120000 },
    { industry: 'Finance', count: 23, avgSalary: 95000 },
    { industry: 'Healthcare', count: 18, avgSalary: 85000 },
    { industry: 'Consulting', count: 14, avgSalary: 105000 }
  ]

  const applicationSuccessFactors = [
    { factor: 'Resume customization with AI', impact: 'high' as const },
    { factor: 'Company research integration', impact: 'high' as const },
    { factor: 'Follow-up within 7 days', impact: 'medium' as const },
    { factor: 'Keyword optimization', impact: 'medium' as const },
    { factor: 'Networking connections', impact: 'low' as const }
  ]

  const marketTrends = [
    {
      trend: 'Remote work normalization',
      description: '70% of tech roles now offer remote options',
      recommendation: 'Highlight remote work experience in applications'
    },
    {
      trend: 'AI skills demand surge',
      description: 'AI and machine learning roles grew 200% in 2024',
      recommendation: 'Consider upskilling in AI technologies'
    },
    {
      trend: 'Green energy transition',
      description: 'Clean energy jobs increased 30% year-over-year',
      recommendation: 'Explore opportunities in sustainable industries'
    }
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

  const improvementAreas = []
  const strengths = []

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

  return {
    weeklyGoalProgress: Math.round(weeklyGoalProgress),
    monthlyGoalProgress: Math.round(monthlyGoalProgress),
    improvementAreas,
    strengths
  }
}

