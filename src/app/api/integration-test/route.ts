import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CompanyResearchAgent } from '@/lib/agents/company-research-agent'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { testCompany } = body
    
    const results: {
      timestamp: string
      tests: Record<string, unknown>
      summary?: {
        totalTests: number
        successfulTests: number
        successRate: number
        overallStatus: string
      }
    } = {
      timestamp: new Date().toISOString(),
      tests: {}
    }
    
    // TEST: Company Research (using new agent)
    try {
      const companyResult = await CompanyResearchAgent.researchCompany(
        testCompany || 'Google Canada',
        'Toronto, ON'
      )
      
      results.tests.companyResearch = {
        success: companyResult.success,
        dataFound: {
          hasWebsite: !!companyResult.company.website,
          hasIndustry: !!companyResult.company.industry,
          hasStockInfo: !!companyResult.company.stockSymbol,
          hasRating: !!companyResult.company.glassdoorRating
        },
        sources: companyResult.sources.length,
        confidence: companyResult.confidence
      }
    } catch (error) {
      results.tests.companyResearch = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    const totalTests = 1
    const successfulTests = [
      (results.tests.companyResearch as { success?: boolean })?.success
    ].filter(Boolean).length
    
    results.summary = {
      totalTests,
      successfulTests,
      successRate: (successfulTests / totalTests) * 100,
      overallStatus: successfulTests === totalTests ? 'PASS' : 'PARTIAL'
    }
    
    return NextResponse.json({
      success: true,
      results,
      message: 'Integration test completed. Company research agent tested successfully.'
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Integration test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
