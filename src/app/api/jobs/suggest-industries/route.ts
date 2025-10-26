import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence';
import { isRateLimited } from '@/lib/rate-limit';
import Resume from '@/models/Resume';
import { dbService } from '@/lib/database';

/**
 * ENTERPRISE FEATURE: Industry Transition Suggestions
 * 
 * Analyzes user's career history and suggests compatible industries for career switching.
 * Uses transferable skills analysis to find industries where user's experience translates.
 * 
 * EXAMPLE: Truck driver (10 years) → Food Service (6 months)
 * Suggestions: Warehouse Management, Logistics Coordinator, Delivery Operations, Fleet Management
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (await isRateLimited(session.user.id, 'industry-suggestions')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    await dbService.connect();

    // Get user's resume
    const resumeDoc = await Resume.findOne({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    if (!resumeDoc || !(resumeDoc as any).extractedText) {
      return NextResponse.json(
        { error: 'Please upload a resume first' },
        { status: 400 }
      );
    }

    const extractedText = (resumeDoc as any).extractedText;

    console.log('[INDUSTRY_SUGGEST] Analyzing transferable skills for user', session.user.id);

    // Step 1: Get career timeline
    const timeline = await PerplexityIntelligenceService.extractCareerTimeline(extractedText);

    // Step 2: Use Perplexity to suggest compatible industries based on transferable skills
    const client = await import('@/lib/perplexity-service').then(m => new m.PerplexityService());
    
    const prompt = `INDUSTRY TRANSITION ANALYSIS - Suggest compatible career paths.

CAREER HISTORY:
${timeline.industries.map((i: any) => 
  `- ${i.name}: ${i.yearsOfExperience} years (${i.percentage}% of career)\n  Skills: ${i.keywords.join(', ')}`
).join('\n')}

TASK: Identify 5-10 industries where this person's skills are TRANSFERABLE.

INSTRUCTIONS:
1. Analyze transferable skills (soft skills, technical skills, certifications)
2. Identify industries that value these skills
3. For EACH suggested industry:
   - Explain WHY their skills transfer
   - List specific roles they could target
   - Rate transferability (High/Medium/Low)
4. Prioritize industries with HIGH demand and GOOD salary potential

EXAMPLE:
For a truck driver (CDL, logistics, safety compliance):
- Warehouse Management: HIGH transferability (logistics, safety, operations)
  Roles: Warehouse Supervisor, Logistics Coordinator, Operations Manager
- Last-Mile Delivery Operations: HIGH transferability (route planning, customer service)
  Roles: Delivery Operations Manager, Fleet Manager, Route Optimizer

RETURN STRICT JSON (no markdown):
{
  "suggestedIndustries": [
    {
      "name": "Warehouse Management",
      "transferability": "high",
      "reasoning": "Strong logistics and safety compliance background translates directly to warehouse operations",
      "targetRoles": ["Warehouse Supervisor", "Logistics Coordinator", "Operations Manager"],
      "averageSalary": "$55,000-$75,000",
      "demandLevel": "high",
      "requiredTransition": "Minimal additional training - focus on inventory management systems"
    }
  ],
  "transferableSkills": ["Logistics", "Safety Compliance", "Time Management", "Problem Solving"],
  "recommendedCertifications": ["Certified Supply Chain Professional", "Lean Six Sigma Green Belt"]
}`;

    const response = await client.makeRequest(
      'You analyze career histories and suggest compatible industries for career transitions. Return only JSON.',
      prompt,
      { temperature: 0.3, maxTokens: 2500 }
    );

    // JSON extraction
    let cleanedContent = response.content.trim();
    cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '');
    const jsonMatch = cleanedContent.match(/(\{[\s\S]*\})/);
    if (jsonMatch) cleanedContent = jsonMatch[0];

    const suggestions = JSON.parse(cleanedContent);

    console.log('[INDUSTRY_SUGGEST] Success:', {
      suggestedCount: suggestions.suggestedIndustries?.length,
      transferableSkills: suggestions.transferableSkills?.length
    });

    return NextResponse.json({
      success: true,
      currentIndustry: timeline.primaryIndustry,
      careerHistory: timeline.industries.map((i: any) => ({
        name: i.name,
        years: i.years,
        percentage: i.percentage
      })),
      suggestions: suggestions.suggestedIndustries || [],
      transferableSkills: suggestions.transferableSkills || [],
      recommendedCertifications: suggestions.recommendedCertifications || []
    });
  } catch (error) {
    console.error('[INDUSTRY_SUGGEST] Error:', error);
    return NextResponse.json(
      { error: 'Industry suggestion analysis failed' },
      { status: 500 }
    );
  }
}

