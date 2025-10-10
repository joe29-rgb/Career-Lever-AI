/**
 * Enhanced Company Research API
 * Returns comprehensive intelligence including hiring contacts, AI threat analysis, and strategic recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { companyName, jobTitle, location, industry, companyWebsite } = body

    if (!companyName || companyName.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Company name is required' 
      }, { status: 400 })
    }

    console.log(`[ENHANCED_RESEARCH_API] Starting research for: ${companyName}`)
    
    const result = await PerplexityIntelligenceService.enhancedCompanyResearch({
      companyName: companyName.trim(),
      jobTitle: jobTitle?.trim(),
      location: location?.trim(),
      industry: industry?.trim(),
      companyWebsite: companyWebsite?.trim()
    })

    if (!result.success || !result.data) {
      return NextResponse.json({
        error: 'Research failed',
        message: result.metadata?.error || 'Unable to gather company intelligence'
      }, { status: 500 })
    }

    console.log(`[ENHANCED_RESEARCH_API] Success for ${companyName}:`, {
      contacts: result.data.hiringContactIntelligence?.keyContacts?.length || 0,
      aiThreat: result.data.aiAutomationThreat?.roleRisk || 'N/A',
      newsItems: result.data.recentNews?.length || 0
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        cached: result.cached,
        requestId: result.metadata.requestId,
        duration: result.metadata.duration
      }
    })

  } catch (error: any) {
    console.error('[ENHANCED_RESEARCH_API] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

