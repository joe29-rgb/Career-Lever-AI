import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
import { extractWeightedKeywords } from '@/lib/keyword-extraction'
import { withRetryOptional } from '@/lib/db-retry'
import connectToDatabase from '@/lib/mongodb'
import Resume from '@/models/Resume'

/**
 * Autopilot Trigger Endpoint
 * 
 * Called after resume upload to:
 * 1. Extract resume signals (keywords, location) - 1 API call
 * 2. Run comprehensive job research - 1 API call
 * 3. Cache everything for Steps 2-7
 * 
 * Total: 2 Perplexity calls to prepare entire flow
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resumeId, jobTitle, company, jobDescription } = await request.json()

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Missing resumeId' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Get the resume
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: session.user.id
    })

    if (!resume || !resume.extractedText) {
      return NextResponse.json(
        { error: 'Resume not found or has no text' },
        { status: 404 }
      )
    }

    const resumeText = resume.extractedText

    console.log('[AUTOPILOT] Starting autopilot flow for resume:', resumeId)
    console.log('[AUTOPILOT] Resume text length:', resumeText.length)

    // STEP 1: Extract weighted keywords using new multi-factor system
    console.log('[AUTOPILOT] Extracting weighted keywords...')
    const keywordResult = await extractWeightedKeywords(resumeText)
    
    console.log('[AUTOPILOT] Weighted keywords extracted:', {
      total: keywordResult.allKeywords.length,
      top: keywordResult.topKeywords.length,
      primaryIndustry: keywordResult.metadata.primaryIndustry
    })

    // STEP 1.5: Extract location from resume signals (still need Perplexity for this)
    const signals = await PerplexityIntelligenceService.extractResumeSignals(
      resumeText,
      50
    )

    // Merge weighted keywords with signals
    const enhancedSignals = {
      ...signals,
      keywords: keywordResult.topKeywords, // Use top 18 weighted keywords
      allKeywords: keywordResult.allKeywords,
      keywordMetadata: keywordResult.metadata
    }

    console.log('[AUTOPILOT] Enhanced signals:', {
      keywords: enhancedSignals.keywords?.length || 0,
      location: enhancedSignals.location,
      primaryIndustry: keywordResult.metadata.primaryIndustry
    })

    // STEP 2: Run comprehensive research if job details provided - API CALL #2
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let comprehensiveResearch: any = null
    if (jobTitle && company && jobDescription) {
      console.log('[AUTOPILOT] Running comprehensive job research...')
      
      const researchResult = await PerplexityIntelligenceService.comprehensiveJobResearch({
        jobTitle,
        company,
        jobDescription,
        location: signals.location,
        resumeText,
        resumeSkills: signals.keywords
      })

      if (researchResult.success && researchResult.data) {
        comprehensiveResearch = researchResult.data
        console.log('[AUTOPILOT] Comprehensive research complete:', {
          matchScore: comprehensiveResearch?.jobAnalysis?.matchScore,
          contacts: comprehensiveResearch?.hiringContacts?.length || 0,
          news: comprehensiveResearch?.news?.length || 0
        })
      }
    }

    // STEP 3: Save to resume document for caching (with retry logic)
    resume.resumeSignals = enhancedSignals
    if (comprehensiveResearch) {
      resume.comprehensiveResearch = comprehensiveResearch
      resume.comprehensiveResearchAt = new Date()
    }
    
    const saveResult = await withRetryOptional(
      () => resume.save(),
      { maxRetries: 3, timeoutMs: 10000 }
    )

    if (saveResult) {
      console.log('[AUTOPILOT] ✅ Data cached to resume document')
    } else {
      console.warn('[AUTOPILOT] ⚠️ Failed to cache to database, but continuing with in-memory data')
    }

    return NextResponse.json({
      success: true,
      signals: enhancedSignals,
      keywordMetadata: keywordResult.metadata,
      comprehensiveResearch,
      message: 'Autopilot data prepared and cached with weighted keywords'
    })

  } catch (error) {
    console.error('[AUTOPILOT] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to prepare autopilot data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
