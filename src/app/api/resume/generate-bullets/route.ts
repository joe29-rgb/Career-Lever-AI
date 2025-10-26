import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, company, input, achievements } = await req.json()
    
    if (!role && !input) {
      return NextResponse.json({ error: 'Role or input text required' }, { status: 400 })
    }

    console.log('[BULLET_GENERATOR] 🎯 Generating bullets for:', role || 'custom input')

    const prompt = `Generate 5 achievement-focused bullet points for this role:

${role ? `Role: ${role}` : ''}
${company ? `Company: ${company}` : ''}
${input ? `Context: ${input}` : ''}
${achievements?.length ? `Current bullets: ${achievements.join('\n')}` : ''}

Requirements:
- Start with strong action verbs (Spearheaded, Orchestrated, Pioneered, Architected, etc.)
- Include quantifiable metrics (numbers, percentages, dollar amounts, time saved)
- Focus on RESULTS and IMPACT, not just tasks
- Keep under 20 words per bullet
- Use past tense for previous roles, present for current

Examples of GOOD bullets:
❌ BAD: "Managed sales team"
✅ GOOD: "Led 8-person sales team, increasing quarterly revenue by 45% ($2.1M) through strategic territory expansion"

❌ BAD: "Handled customer complaints"
✅ GOOD: "Resolved 200+ escalated customer issues monthly, improving satisfaction scores from 72% to 94%"

❌ BAD: "Wrote code for new features"
✅ GOOD: "Architected microservices platform serving 2M+ users, reducing API latency by 60% and infrastructure costs by $40K/year"

Return ONLY a JSON array of 5 bullet points:
["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"]`

    const response = await PerplexityIntelligenceService.customQuery({
      systemPrompt: 'You are an expert resume writer. Generate achievement-focused bullet points with metrics. Return ONLY a JSON array.',
      userPrompt: prompt,
      temperature: 0.8,
      maxTokens: 1000
    })

    let bullets
    try {
      bullets = JSON.parse(response.content)
      if (!Array.isArray(bullets)) {
        throw new Error('Response is not an array')
      }
    } catch {
      // Fallback: extract bullets from text
      const lines = response.content.split('\n').filter(line => 
        line.trim().length > 10 && 
        (line.trim().startsWith('-') || line.trim().startsWith('•') || line.match(/^\d+\./))
      )
      bullets = lines.map(line => line.replace(/^[-•\d.]\s*/, '').trim()).slice(0, 5)
      
      if (bullets.length === 0) {
        bullets = [
          `${input || 'Managed key initiatives'} resulting in measurable business impact`,
          `Collaborated with cross-functional teams to deliver high-quality results`,
          `Implemented best practices and optimized processes for efficiency`,
          `Analyzed data and metrics to drive informed decision-making`,
          `Mentored team members and contributed to organizational growth`
        ]
      }
    }

    console.log('[BULLET_GENERATOR] ✅ Generated', bullets.length, 'bullets')

    return NextResponse.json({ 
      success: true, 
      bullets: bullets.slice(0, 5)
    })
  } catch (error) {
    console.error('[BULLET_GENERATOR] ❌ Error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate bullets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
