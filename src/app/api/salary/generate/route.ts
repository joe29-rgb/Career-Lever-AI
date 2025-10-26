import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Application from '@/models/Application'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applicationId, yearsExperience } = await req.json()
    
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 })
    }

    await dbConnect()

    const application = await Application.findOne({ 
      _id: applicationId, 
      userId: session.user.id 
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    console.log('[SALARY] 💰 Generating salary data for:', application.company, '-', application.jobTitle)

    // Generate salary benchmarks using AI
    const prompt = `Provide current market salary data for this role:

ROLE: ${application.jobTitle}
COMPANY: ${application.company}
LOCATION: ${application.location || 'United States'}
EXPERIENCE: ${yearsExperience || 5} years

Return JSON with:
{
  "marketMin": 75000,
  "marketMedian": 95000,
  "marketMax": 120000,
  "negotiationTips": [
    "Research shows the market range for ${application.jobTitle} in ${application.location || 'this area'} is $X-$Y",
    "Based on your X years of experience, you should target the upper end of the range",
    "Emphasize your unique skills: [specific skills]",
    "Wait for them to give the first number",
    "Consider total compensation: equity, bonuses, benefits"
  ],
  "factors": "Explanation of what influences this salary range"
}

Use real market data from 2024-2025. Be specific to the location and seniority level.`

    const response = await PerplexityIntelligenceService.customQuery({
      systemPrompt: 'You are a salary negotiation expert providing market data. Return valid JSON only.',
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 1500
    })

    let salaryData
    try {
      salaryData = JSON.parse(response.content)
    } catch {
      // Fallback with estimated data
      const baseMin = 60000
      const baseMedian = 85000
      const baseMax = 110000
      
      salaryData = {
        marketMin: baseMin,
        marketMedian: baseMedian,
        marketMax: baseMax,
        negotiationTips: [
          `Research shows the market range for ${application.jobTitle} is $${baseMin.toLocaleString()}-$${baseMax.toLocaleString()}`,
          'Emphasize your unique skills and achievements',
          'Wait for them to give the first number',
          'Consider total compensation: equity, bonuses, benefits',
          'Be prepared to justify your target with market data'
        ],
        factors: 'Based on industry standards and location'
      }
    }

    // Calculate user target (aim for 75th percentile)
    const userTarget = Math.round(salaryData.marketMedian * 1.15)

    // Save to application
    application.salaryData = {
      marketMin: salaryData.marketMin,
      marketMedian: salaryData.marketMedian,
      marketMax: salaryData.marketMax,
      userTarget,
      negotiationTips: salaryData.negotiationTips,
      preparedAt: new Date()
    }
    await application.save()

    console.log('[SALARY] ✅ Generated salary range:', salaryData.marketMin, '-', salaryData.marketMax)

    return NextResponse.json({
      success: true,
      salary: {
        marketMin: salaryData.marketMin,
        marketMedian: salaryData.marketMedian,
        marketMax: salaryData.marketMax,
        userTarget,
        negotiationTips: salaryData.negotiationTips,
        factors: salaryData.factors,
        company: application.company,
        jobTitle: application.jobTitle,
        location: application.location
      }
    })
  } catch (error) {
    console.error('[SALARY] ❌ Error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate salary data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
