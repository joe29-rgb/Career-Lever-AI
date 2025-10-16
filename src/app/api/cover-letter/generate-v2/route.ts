import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { 
      jobTitle, 
      company, 
      jobRequirements, 
      resumeText, 
      companyInsights,
      hiringManager,
      userName 
    } = await request.json()
    
    if (!jobTitle || !company || !resumeText) {
      return NextResponse.json(
        { error: 'Missing required fields: jobTitle, company, resumeText' },
        { status: 400 }
      )
    }
    
    const result = await PerplexityIntelligenceService.generateCoverLetters({
      jobTitle,
      company,
      jobRequirements: jobRequirements || [],
      resumeText,
      companyInsights: companyInsights || { 
        culture: '', 
        values: [], 
        recentNews: [] 
      },
      hiringManager,
      userName
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Cover letter generate error:', error)
    return NextResponse.json(
      { error: 'Failed to generate cover letters' },
      { status: 500 }
    )
  }
}
