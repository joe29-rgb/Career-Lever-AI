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
    
    const { resumeText, jobTitle, jobRequirements, companyInsights, template } = await request.json()
    
    if (!resumeText || !jobTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeText, jobTitle' },
        { status: 400 }
      )
    }
    
    const result = await PerplexityIntelligenceService.generateResumeVariants({
      resumeText,
      jobTitle,
      jobRequirements: jobRequirements || [],
      companyInsights: companyInsights || { culture: '', values: [], industry: '' },
      template: template || 'modern'
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Resume optimize error:', error)
    return NextResponse.json(
      { error: 'Failed to generate resume variants' },
      { status: 500 }
    )
  }
}
