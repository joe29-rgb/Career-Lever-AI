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
      hiringContact, 
      jobTitle, 
      company, 
      resumeHighlights 
    } = await request.json()
    
    if (!hiringContact || !jobTitle || !company) {
      return NextResponse.json(
        { error: 'Missing required fields: hiringContact, jobTitle, company' },
        { status: 400 }
      )
    }
    
    if (!hiringContact.name || !hiringContact.title) {
      return NextResponse.json(
        { error: 'hiringContact must include name and title' },
        { status: 400 }
      )
    }
    
    const result = await PerplexityIntelligenceService.generateEmailOutreach({
      hiringContact,
      jobTitle,
      company,
      resumeHighlights: resumeHighlights || []
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Email outreach error:', error)
    return NextResponse.json(
      { error: 'Failed to generate email outreach templates' },
      { status: 500 }
    )
  }
}
