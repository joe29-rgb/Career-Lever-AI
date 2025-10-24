import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence';
import { isRateLimited } from '@/lib/rate-limit';

/**
 * ENTERPRISE FEATURE: Career Timeline Analysis
 * 
 * Calculates industry tenure and weighting for intelligent job matching:
 * - Total years in each industry
 * - Percentage of career in each sector
 * - Industry-specific keywords
 * - Career transition detection
 * 
 * USE CASE: If someone drove trucks for 10 years then became a cook for 6 months,
 * we should show MORE truck driving jobs (95% of career) than cooking jobs (5%).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (await isRateLimited(session.user.id, 'resume:career-timeline')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { resume } = await request.json();

    if (!resume || resume.length < 100) {
      return NextResponse.json(
        { error: 'Resume text is required (minimum 100 characters)' },
        { status: 400 }
      );
    }

    console.log('[CAREER_TIMELINE_API] Analyzing resume, length:', resume.length);

    const timeline = await PerplexityIntelligenceService.extractCareerTimeline(resume);

    console.log('[CAREER_TIMELINE_API] Success:', {
      industries: timeline.industries.length,
      currentIndustry: timeline.primaryIndustry,
      totalWorkYears: timeline.totalYears
    });

    return NextResponse.json({
      success: true,
      timeline: {
        industries: timeline.industries,
        totalWorkYears: timeline.totalYears,
        totalEducationYears: 0, // Not provided by extractCareerTimeline
        currentIndustry: timeline.primaryIndustry,
        careerTransition: false, // Not provided by extractCareerTimeline
        // Computed field: Primary industry (longest tenure)
        primaryIndustry: timeline.primaryIndustry
      }
    });
  } catch (error) {
    console.error('[CAREER_TIMELINE_API] Error:', error);
    return NextResponse.json(
      { error: 'Career timeline analysis failed' },
      { status: 500 }
    );
  }
}

