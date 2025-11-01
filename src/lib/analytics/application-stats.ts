/**
 * Application Analytics Service
 * Provides real-time statistics for dashboard
 */

import Application from '@/models/Application'
import { dbService } from '@/lib/database'

export interface DateRange {
  start: Date
  end: Date
}

export interface ApplicationStats {
  totalApplications: number
  responseRate: number
  interviewsScheduled: number
  offersReceived: number
  conversionRate: number
  avgResponseTime: number
  byIndustry: Record<string, number>
  bySalary: {
    min: number
    max: number
    avg: number
  }
  byStatus: Record<string, number>
}

export interface TrendPoint {
  date: string
  count: number
  interviews: number
  offers: number
}

export interface IndustryBreakdown {
  industry: string
  count: number
  percentage: number
  avgResponseTime: number
  successRate: number
}

/**
 * Get comprehensive application statistics for a user
 */
export async function getUserApplicationStats(
  userId: string,
  dateRange?: DateRange
): Promise<ApplicationStats> {
  await dbService.connect()

  const query: any = { userId }
  if (dateRange) {
    query.appliedAt = {
      $gte: dateRange.start,
      $lte: dateRange.end
    }
  }

  const apps = await Application.find(query).lean()

  if (apps.length === 0) {
    return {
      totalApplications: 0,
      responseRate: 0,
      interviewsScheduled: 0,
      offersReceived: 0,
      conversionRate: 0,
      avgResponseTime: 0,
      byIndustry: {},
      bySalary: { min: 0, max: 0, avg: 0 },
      byStatus: {}
    }
  }

  // Calculate metrics
  const responded = apps.filter(a => 
    a.status !== 'applied' && a.lastContactedAt
  )
  const interviews = apps.filter(a => 
    a.status === 'interview_scheduled' || a.status === 'interviewed'
  )
  const offers = apps.filter(a => 
    a.status === 'offer_received' || a.status === 'accepted'
  )

  // Response time calculation
  const responseTimes = responded
    .filter(a => a.lastContactedAt && a.appliedAt)
    .map(a => {
      const applied = new Date(a.appliedAt).getTime()
      const contacted = new Date(a.lastContactedAt!).getTime()
      return Math.floor((contacted - applied) / (1000 * 60 * 60 * 24)) // days
    })
  
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0

  // Industry breakdown
  const byIndustry: Record<string, number> = {}
  apps.forEach(app => {
    const industry = extractIndustry(app.company, app.jobTitle)
    byIndustry[industry] = (byIndustry[industry] || 0) + 1
  })

  // Salary breakdown
  const salaries = apps
    .filter(a => a.salary)
    .map(a => parseSalary(a.salary!))
    .filter(s => s > 0)
  
  const bySalary = {
    min: salaries.length > 0 ? Math.min(...salaries) : 0,
    max: salaries.length > 0 ? Math.max(...salaries) : 0,
    avg: salaries.length > 0 
      ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
      : 0
  }

  // Status breakdown
  const byStatus: Record<string, number> = {}
  apps.forEach(app => {
    byStatus[app.status] = (byStatus[app.status] || 0) + 1
  })

  return {
    totalApplications: apps.length,
    responseRate: apps.length > 0 
      ? Math.round((responded.length / apps.length) * 100) 
      : 0,
    interviewsScheduled: interviews.length,
    offersReceived: offers.length,
    conversionRate: apps.length > 0
      ? Math.round((offers.length / apps.length) * 100)
      : 0,
    avgResponseTime,
    byIndustry,
    bySalary,
    byStatus
  }
}

/**
 * Get application trend data for charts
 */
export async function getApplicationTrendLine(
  userId: string,
  days: number = 30
): Promise<TrendPoint[]> {
  await dbService.connect()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const apps = await Application.find({
    userId,
    appliedAt: { $gte: startDate }
  }).lean()

  // Group by date
  const trendMap = new Map<string, TrendPoint>()
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i - 1))
    const dateStr = date.toISOString().split('T')[0]
    trendMap.set(dateStr, {
      date: dateStr,
      count: 0,
      interviews: 0,
      offers: 0
    })
  }

  apps.forEach(app => {
    const dateStr = new Date(app.appliedAt).toISOString().split('T')[0]
    const point = trendMap.get(dateStr)
    if (point) {
      point.count++
      if (app.status === 'interview_scheduled' || app.status === 'interviewed') {
        point.interviews++
      }
      if (app.status === 'offer_received' || app.status === 'accepted') {
        point.offers++
      }
    }
  })

  return Array.from(trendMap.values())
}

/**
 * Calculate success rate (interview rate and offer rate)
 */
export async function calculateSuccessRate(userId: string): Promise<{
  interviewRate: number
  offerRate: number
  interviewToOfferRate: number
}> {
  await dbService.connect()

  const apps = await Application.find({ userId }).lean()

  if (apps.length === 0) {
    return {
      interviewRate: 0,
      offerRate: 0,
      interviewToOfferRate: 0
    }
  }

  const interviews = apps.filter(a => 
    a.status === 'interview_scheduled' || 
    a.status === 'interviewed' ||
    a.status === 'offer_received' ||
    a.status === 'accepted'
  )
  
  const offers = apps.filter(a => 
    a.status === 'offer_received' || 
    a.status === 'accepted'
  )

  return {
    interviewRate: Math.round((interviews.length / apps.length) * 100),
    offerRate: Math.round((offers.length / apps.length) * 100),
    interviewToOfferRate: interviews.length > 0
      ? Math.round((offers.length / interviews.length) * 100)
      : 0
  }
}

/**
 * Get industry breakdown with success metrics
 */
export async function getIndustryBreakdown(
  userId: string
): Promise<IndustryBreakdown[]> {
  await dbService.connect()

  const apps = await Application.find({ userId }).lean()

  if (apps.length === 0) {
    return []
  }

  const industryMap = new Map<string, {
    count: number
    interviews: number
    offers: number
    responseTimes: number[]
  }>()

  apps.forEach(app => {
    const industry = extractIndustry(app.company, app.jobTitle)
    
    if (!industryMap.has(industry)) {
      industryMap.set(industry, {
        count: 0,
        interviews: 0,
        offers: 0,
        responseTimes: []
      })
    }

    const data = industryMap.get(industry)!
    data.count++

    if (app.status === 'interview_scheduled' || app.status === 'interviewed') {
      data.interviews++
    }
    if (app.status === 'offer_received' || app.status === 'accepted') {
      data.offers++
    }

    if (app.lastContactedAt && app.appliedAt) {
      const days = Math.floor(
        (new Date(app.lastContactedAt).getTime() - new Date(app.appliedAt).getTime()) 
        / (1000 * 60 * 60 * 24)
      )
      data.responseTimes.push(days)
    }
  })

  const breakdown: IndustryBreakdown[] = []
  industryMap.forEach((data, industry) => {
    breakdown.push({
      industry,
      count: data.count,
      percentage: Math.round((data.count / apps.length) * 100),
      avgResponseTime: data.responseTimes.length > 0
        ? Math.round(data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length)
        : 0,
      successRate: Math.round(((data.interviews + data.offers) / data.count) * 100)
    })
  })

  return breakdown.sort((a, b) => b.count - a.count)
}

/**
 * Calculate average response time
 */
export async function calculateAverageResponseTime(
  userId: string
): Promise<number> {
  await dbService.connect()

  const apps = await Application.find({
    userId,
    lastContactedAt: { $exists: true }
  }).lean()

  if (apps.length === 0) {
    return 0
  }

  const responseTimes = apps
    .filter(a => a.lastContactedAt && a.appliedAt)
    .map(a => {
      const applied = new Date(a.appliedAt).getTime()
      const contacted = new Date(a.lastContactedAt!).getTime()
      return Math.floor((contacted - applied) / (1000 * 60 * 60 * 24))
    })

  return responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0
}

/**
 * Predict next offer based on historical data
 */
export async function predictNextOffer(userId: string): Promise<{
  estimatedDays: number
  confidence: number
  basedOnApplications: number
}> {
  await dbService.connect()

  const apps = await Application.find({ userId }).lean()
  const offers = apps.filter(a => 
    a.status === 'offer_received' || a.status === 'accepted'
  )

  if (offers.length === 0) {
    // No historical data - use industry averages
    return {
      estimatedDays: 45, // Industry average
      confidence: 0.3,
      basedOnApplications: 0
    }
  }

  // Calculate average time to offer
  const timesToOffer = offers
    .filter(a => a.appliedAt)
    .map(a => {
      const applied = new Date(a.appliedAt).getTime()
      const offered = new Date(a.updatedAt || a.appliedAt).getTime()
      return Math.floor((offered - applied) / (1000 * 60 * 60 * 24))
    })

  const avgTimeToOffer = timesToOffer.length > 0
    ? Math.round(timesToOffer.reduce((a, b) => a + b, 0) / timesToOffer.length)
    : 45

  // Calculate conversion rate
  const conversionRate = apps.length > 0 ? offers.length / apps.length : 0

  // Get recent applications without offers
  const recentApps = apps
    .filter(a => 
      a.status === 'applied' || 
      a.status === 'interview_scheduled' ||
      a.status === 'interviewed'
    )
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())

  if (recentApps.length === 0) {
    return {
      estimatedDays: avgTimeToOffer,
      confidence: 0.5,
      basedOnApplications: offers.length
    }
  }

  // Estimate based on oldest pending application
  const oldestPending = recentApps[recentApps.length - 1]
  const daysSinceApplied = Math.floor(
    (Date.now() - new Date(oldestPending.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  const estimatedDays = Math.max(0, avgTimeToOffer - daysSinceApplied)
  const confidence = Math.min(0.9, conversionRate * 2) // Cap at 90%

  return {
    estimatedDays,
    confidence: Math.round(confidence * 100) / 100,
    basedOnApplications: offers.length
  }
}

// Helper functions

function extractIndustry(company: string, jobTitle: string): string {
  const text = `${company} ${jobTitle}`.toLowerCase()
  
  if (text.includes('tech') || text.includes('software') || text.includes('engineer')) {
    return 'Technology'
  }
  if (text.includes('health') || text.includes('medical') || text.includes('pharma')) {
    return 'Healthcare'
  }
  if (text.includes('finance') || text.includes('bank') || text.includes('invest')) {
    return 'Finance'
  }
  if (text.includes('retail') || text.includes('store') || text.includes('shop')) {
    return 'Retail'
  }
  if (text.includes('education') || text.includes('school') || text.includes('university')) {
    return 'Education'
  }
  if (text.includes('manufacturing') || text.includes('factory') || text.includes('production')) {
    return 'Manufacturing'
  }
  
  return 'Other'
}

function parseSalary(salaryStr: string): number {
  // Extract numbers from salary string
  const numbers = salaryStr.match(/\d+/g)
  if (!numbers || numbers.length === 0) return 0
  
  // Take the first number (usually the base or minimum)
  const num = parseInt(numbers[0])
  
  // If it's in thousands format (e.g., "120K"), multiply by 1000
  if (salaryStr.toLowerCase().includes('k')) {
    return num * 1000
  }
  
  // If it's already a full number
  if (num > 10000) {
    return num
  }
  
  // Assume it's in thousands
  return num * 1000
}
