import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerplexityResumeAnalyzer } from '@/lib/perplexity-resume-analyzer'
import { isRateLimited } from '@/lib/rate-limit'

// Initialize global cache for comprehensive analysis
if (!global.analysisCache) {
  global.analysisCache = new Map()
}

/**
 * COMPETITIVE ADVANTAGE: Comprehensive AI-Powered Resume Analysis
 * 
 * Features that set us apart:
 * - AI/Automation replacement risk assessment
 * - 5-year career outlook projection
 * - Market intelligence with salary trends
 * - Skills gap analysis with learning roadmap
 * - Experience-weighted keyword extraction
 * - Target job recommendations based on career trajectory
 * 
 * This endpoint powers the most advanced resume analysis in the industry.
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting - more generous for this premium feature
    if (await isRateLimited(session.user.id, 'resume-analysis')) {
      return NextResponse.json(
        { 
          error: 'Analysis limit reached. Please wait before analyzing another resume.',
          hint: 'Comprehensive analysis is rate-limited to ensure quality results.'
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { resumeText, options = {} } = body

    // Validation
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 100) {
      return NextResponse.json(
        { 
          error: 'Invalid resume text',
          details: 'Resume text must be at least 100 characters',
          hint: 'Please upload a complete resume with experience, education, and skills sections.'
        },
        { status: 400 }
      )
    }

    console.log('[COMPREHENSIVE_ANALYSIS] Starting analysis for user:', session.user.id)
    console.log('[COMPREHENSIVE_ANALYSIS] Resume length:', resumeText.length, 'characters')
    console.log('[COMPREHENSIVE_ANALYSIS] Options:', options)

    // PERFORMANCE: Check cache first (24 hour TTL)
    const cacheKey = `comprehensive-analysis:${session.user.id}:${resumeText.substring(0, 100)}`
    const cached = global.analysisCache?.get(cacheKey)
    const cacheAge = cached ? Date.now() - cached.timestamp : Infinity
    const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
    
    if (cached && cacheAge < CACHE_TTL) {
      console.log('[COMPREHENSIVE_ANALYSIS] ✅ Using cached result (age:', Math.floor(cacheAge / 1000), 'seconds)')
      return NextResponse.json({
        success: true,
        ...cached.data,
        metadata: {
          ...cached.data.metadata,
          cached: true,
          cacheAge: Math.floor(cacheAge / 1000)
        }
      })
    }

    const startTime = Date.now()

    // Execute comprehensive analysis
    const analysis = await PerplexityResumeAnalyzer.analyzeResume(resumeText)

    const duration = Date.now() - startTime
    console.log('[COMPREHENSIVE_ANALYSIS] Completed in', duration, 'ms')
    console.log('[COMPREHENSIVE_ANALYSIS] AI Risk:', analysis.futureOutlook.aiReplacementRisk)
    console.log('[COMPREHENSIVE_ANALYSIS] Career Outlook:', analysis.futureOutlook.fiveYearOutlook)
    console.log('[COMPREHENSIVE_ANALYSIS] Top Skills:', analysis.topSkills.slice(0, 3).map(s => s.skill).join(', '))

    // Build response data
    const responseData = {
      analysis: {
        // Core extraction data
        keywords: analysis.keywords,
        location: analysis.location,
        experienceLevel: analysis.experienceLevel,
        industries: analysis.industries,
        certifications: analysis.certifications,
        careerSummary: analysis.careerSummary,
        
        // 🚀 COMPETITIVE ADVANTAGE: AI/Automation Risk Analysis
        aiRisk: {
          aiReplacementRisk: analysis.futureOutlook.aiReplacementRisk,
          automationRisk: analysis.futureOutlook.automationRisk,
          fiveYearOutlook: analysis.futureOutlook.fiveYearOutlook,
          reasoning: analysis.futureOutlook.reasoning,
          recommendations: analysis.futureOutlook.recommendations
        },
        
        // 🎯 COMPETITIVE ADVANTAGE: Career Path Intelligence
        careerPath: {
          currentLevel: analysis.careerPath.currentLevel,
          nextPossibleRoles: analysis.careerPath.nextPossibleRoles,
          skillGaps: analysis.careerPath.skillGaps,
          recommendedCertifications: analysis.careerPath.recommendedCertifications
        },
        
        // 💰 COMPETITIVE ADVANTAGE: Market-Based Salary Intelligence
        salaryIntelligence: {
          targetRange: analysis.targetSalaryRange,
          marketData: analysis.targetSalaryRange.marketData,
          currency: analysis.targetSalaryRange.currency
        },
        
        // 🔥 COMPETITIVE ADVANTAGE: Skills Market Demand Analysis
        topSkills: analysis.topSkills.map(skill => ({
          skill: skill.skill,
          yearsExperience: skill.yearsExperience,
          proficiency: skill.proficiency,
          marketDemand: skill.marketDemand,
          growthTrend: skill.growthTrend
        })),
        
        // 🎓 Job Search Optimization Strategy
        searchOptimization: {
          bestJobBoards: analysis.searchOptimization.bestJobBoards,
          optimalApplicationTime: analysis.searchOptimization.optimalApplicationTime,
          competitiveAdvantages: analysis.searchOptimization.competitiveAdvantages,
          marketSaturation: analysis.searchOptimization.marketSaturation,
          applicationStrategy: analysis.searchOptimization.applicationStrategy
        },
        
        // Target job recommendations
        targetJobTitles: analysis.targetJobTitles
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        duration,
        userId: session.user.id,
        features: [
          'ai-risk-analysis',
          'career-path-intelligence',
          'market-salary-intelligence',
          'skills-demand-analysis',
          'job-search-optimization'
        ]
      }
    }

    // PERFORMANCE: Store in cache for 24 hours
    if (!global.analysisCache) global.analysisCache = new Map()
    global.analysisCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })
    console.log('[COMPREHENSIVE_ANALYSIS] ✅ Cached result for 24 hours')

    // Return comprehensive results with competitive advantage features highlighted
    return NextResponse.json({
      success: true,
      ...responseData
    })

  } catch (error) {
    console.error('[COMPREHENSIVE_ANALYSIS] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Resume analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        hint: 'Our AI-powered analysis encountered an issue. Please try again or contact support if the problem persists.'
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for analysis status/info
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    endpoint: '/api/resume/analyze-comprehensive',
    method: 'POST',
    description: 'Comprehensive AI-powered resume analysis with competitive advantage features',
    features: {
      'AI Risk Analysis': 'Assess AI/automation replacement risk for candidate career path',
      'Career Outlook': '5-year career trajectory projection based on market trends',
      'Market Intelligence': 'Real-time salary data and demand analysis',
      'Skills Gap Analysis': 'Identify missing skills with learning roadmap',
      'Job Search Strategy': 'Optimized job board recommendations and application timing'
    },
    rateLimits: {
      perHour: 10,
      perDay: 50
    },
    requiredFields: ['resumeText'],
    optionalFields: {
      options: {
        includeMarketData: 'boolean - Include detailed market intelligence (default: true)',
        includeSkillsAnalysis: 'boolean - Include skills demand analysis (default: true)',
        includeCareerPath: 'boolean - Include career progression recommendations (default: true)'
      }
    }
  })
}

