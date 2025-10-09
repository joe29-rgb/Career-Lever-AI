import { PerplexityIntelligenceService } from './perplexity-intelligence'
import { EnhancedContact } from './contact-enrichment'

export interface PersonalizedOutreach {
  subject: string
  body: string
  cta: string // Call to action
  personalization_score: number // 0-100
  variant_id?: string // For A/B testing
  tone: 'achievement' | 'problem-solving' | 'value-add'
}

export class PersonalizationEngine {
  /**
   * PHASE 2B: Generate highly personalized cold outreach email
   * Uses company research, contact personality, and resume to create unique message
   */
  static async generatePersonalizedOutreach(
    contact: EnhancedContact,
    job: any,
    resumeText: string,
    companyResearch: any
  ): Promise<PersonalizedOutreach> {
    try {
      console.log('[PERSONALIZATION] Generating for:', contact.name, 'at', job.company)
      
      // Extract most relevant experience for this specific job
      const relevantExperience = this.extractRelevantExperience(resumeText, job)
      
      const prompt = `Create a highly personalized cold outreach email for a job application:

CONTACT INFORMATION:
Name: ${contact.name}
Title: ${contact.title}
Communication Style: ${contact.personality_insights.communication_style}
Decision Power: ${contact.decision_maker_score}/100

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Description: ${(job.description || '').slice(0, 500)}

COMPANY INTELLIGENCE:
Culture: ${companyResearch?.culture || 'Not available'}
Recent News: ${companyResearch?.recentNews?.[0] || 'No recent news'}
Tech Stack: ${companyResearch?.techStack?.join(', ') || 'Unknown'}

CANDIDATE'S RELEVANT EXPERIENCE:
${relevantExperience}

PERSONALIZATION REQUIREMENTS:
1. Match ${contact.name}'s ${contact.personality_insights.communication_style} communication style:
   - direct: Get to the point immediately, no fluff
   - formal: Professional greeting, structured approach
   - casual: Friendly but professional tone

2. Reference something SPECIFIC about:
   - ${contact.name}'s role or recent work if possible
   - Company's recent news/achievements
   - How candidate's experience solves their specific challenges

3. Connect candidate's background to ${job.company}'s current needs
4. Include a clear, low-friction call to action
5. Keep under 150 words total
6. Avoid buzzwords: "passionate", "rockstar", "ninja", "guru"
7. Use candidate's actual achievements, not generic claims

Return JSON:
{
  "subject": "specific subject line under 60 chars",
  "body": "personalized email body",
  "cta": "clear call to action",
  "personalization_score": 0-100
}`

      const result = await PerplexityIntelligenceService.customQuery({
        systemPrompt: "You write highly personalized, effective cold outreach emails that get responses. You avoid generic templates and create unique, relevant messages.",
        userPrompt: prompt,
        temperature: 0.4, // Slightly creative but consistent
        maxTokens: 800
      })
      
      // Type-safe result handling
      if (typeof result === 'object' && result !== null && 'subject' in result && 'body' in result) {
        console.log('[PERSONALIZATION] Generated with score:', (result as any).personalization_score)
        return {
          ...(result as any),
          tone: 'value-add' as const
        }
      }
      
      // Fallback if unexpected format
      throw new Error('Invalid response format from AI')
      
    } catch (error) {
      console.error('[PERSONALIZATION] Error generating outreach:', error)
      return this.generateFallbackOutreach(contact, job, resumeText)
    }
  }
  
  /**
   * Extract most relevant parts of resume for this specific job
   */
  private static extractRelevantExperience(
    resume: string,
    job: any
  ): string {
    try {
      // Extract keywords from job description
      const jobDescription = (job.description || job.title || '').toLowerCase()
      const keywords = jobDescription
        .split(/\W+/)
        .filter(word => word.length > 4)
        .slice(0, 20)
      
      // Score each sentence by keyword matches
      const sentences = resume.split(/[.!?]+/).filter(s => s.trim().length > 20)
      
      const scored = sentences.map(sentence => ({
        text: sentence.trim(),
        score: keywords.filter(keyword => 
          sentence.toLowerCase().includes(keyword)
        ).length
      }))
      
      // Take top 5 most relevant sentences
      const topSentences = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(s => s.text)
        .join('. ')
      
      return topSentences.slice(0, 1000) // Limit to 1000 chars
      
    } catch (error) {
      console.error('[PERSONALIZATION] Error extracting experience:', error)
      return resume.slice(0, 1000)
    }
  }
  
  /**
   * Generate A/B testing variants with different angles
   */
  static async generateEmailVariants(
    contact: EnhancedContact,
    job: any,
    resumeText: string,
    companyResearch: any
  ): Promise<PersonalizedOutreach[]> {
    try {
      console.log('[PERSONALIZATION] Generating 3 A/B variants')
      
      const baseData = { contact, job, resumeText, companyResearch }
      
      // Generate 3 variants in parallel with different angles
      const variants = await Promise.all([
        this.generatePersonalizedOutreachWithAngle(baseData, 'achievement'),
        this.generatePersonalizedOutreachWithAngle(baseData, 'problem-solving'),
        this.generatePersonalizedOutreachWithAngle(baseData, 'value-add')
      ])
      
      // Add variant IDs
      return variants.map((variant, index) => ({
        ...variant,
        variant_id: `variant_${String.fromCharCode(65 + index)}` // A, B, C
      }))
      
    } catch (error) {
      console.error('[PERSONALIZATION] Error generating variants:', error)
      // Return single variant as fallback
      const single = await this.generatePersonalizedOutreach(
        contact,
        job,
        resumeText,
        companyResearch
      )
      return [single]
    }
  }
  
  /**
   * Generate outreach with specific angle/tone
   */
  private static async generatePersonalizedOutreachWithAngle(
    data: {
      contact: EnhancedContact;
      job: any;
      resumeText: string;
      companyResearch: any;
    },
    angle: 'achievement' | 'problem-solving' | 'value-add'
  ): Promise<PersonalizedOutreach> {
    const { contact, job, resumeText, companyResearch } = data
    
    const angleFocus = {
      achievement: 'Focus on specific quantifiable achievements and results',
      'problem-solving': 'Focus on challenges the company faces and how you can solve them',
      'value-add': 'Focus on unique value and skills you bring to their team'
    }
    
    try {
      const relevantExperience = this.extractRelevantExperience(resumeText, job)
      
      const prompt = `Create a ${angle}-focused cold outreach email:

ANGLE: ${angleFocus[angle]}

CONTACT: ${contact.name}, ${contact.title}
STYLE: ${contact.personality_insights.communication_style}

JOB: ${job.title} at ${job.company}

RELEVANT EXPERIENCE:
${relevantExperience}

COMPANY INSIGHTS:
${companyResearch?.culture || 'Professional environment'}

Requirements:
- Match ${contact.personality_insights.communication_style} style
- ${angleFocus[angle]}
- Keep under 150 words
- Specific and unique (not generic)

Return JSON: {"subject": "...", "body": "...", "cta": "...", "personalization_score": 0-100}`

      const result = await PerplexityIntelligenceService.customQuery({
        systemPrompt: `You write ${angle}-focused cold outreach emails that get responses.`,
        userPrompt: prompt,
        temperature: 0.4,
        maxTokens: 800
      })
      
      // Type-safe result handling
      if (typeof result === 'object' && result !== null && 'subject' in result && 'body' in result) {
        return {
          ...(result as any),
          tone: angle
        }
      }
      
      // Fallback if unexpected format
      throw new Error('Invalid response format from AI')
      
    } catch (error) {
      console.error(`[PERSONALIZATION] Error generating ${angle} variant:`, error)
      return this.generateFallbackOutreach(contact, job, resumeText, angle)
    }
  }
  
  /**
   * Fallback: Template-based outreach (if AI fails)
   */
  private static generateFallbackOutreach(
    contact: EnhancedContact,
    job: any,
    resumeText: string,
    tone: 'achievement' | 'problem-solving' | 'value-add' = 'value-add'
  ): PersonalizedOutreach {
    console.log('[PERSONALIZATION] Using fallback template')
    
    // Extract basic info
    const companyName = job.company || 'your company'
    const jobTitle = job.title || 'the role'
    const contactFirstName = contact.name.split(' ')[0]
    
    // Try to extract a skill or experience
    const skills = resumeText.match(/\b(JavaScript|Python|React|Node|AWS|SQL|Java|C\+\+|Machine Learning|Data|Design|Marketing|Sales|Management)\b/gi) || []
    const mainSkill = skills[0] || 'relevant experience'
    
    const templates = {
      achievement: {
        subject: `${jobTitle} - ${mainSkill} Results for ${companyName}`,
        body: `Hi ${contactFirstName},

I noticed ${companyName}'s opening for ${jobTitle}. With my background in ${mainSkill}, I've consistently delivered measurable results in similar roles.

I'd appreciate a brief conversation to discuss how my experience aligns with your team's goals.

Are you available for a 15-minute call this week?

Best regards`,
        cta: '15-minute intro call'
      },
      'problem-solving': {
        subject: `Solving [Challenge] - ${jobTitle} at ${companyName}`,
        body: `Hi ${contactFirstName},

I came across the ${jobTitle} role at ${companyName}. My experience with ${mainSkill} has prepared me to tackle the challenges your team is facing.

I'd love to discuss how I can contribute to your objectives.

Would you be open to a brief conversation?

Best regards`,
        cta: 'Brief discussion of fit'
      },
      'value-add': {
        subject: `${mainSkill} Expertise for ${companyName}`,
        body: `Hi ${contactFirstName},

I'm reaching out regarding the ${jobTitle} position. My background in ${mainSkill} and proven track record could add immediate value to your team at ${companyName}.

I've attached my resume for your review. Would you be available for a quick call to discuss the opportunity?

Best regards`,
        cta: 'Quick introductory call'
      }
    }
    
    const template = templates[tone]
    
    return {
      subject: template.subject,
      body: template.body,
      cta: template.cta,
      personalization_score: 30, // Low score for template
      tone
    }
  }
  
  /**
   * Analyze outreach performance (for future optimization)
   */
  static analyzeOutreachPerformance(
    outreach: PersonalizedOutreach,
    opened: boolean,
    replied: boolean
  ): {
    effectiveness_score: number;
    insights: string[];
  } {
    const score = 
      (outreach.personalization_score * 0.4) + // Quality of personalization
      (opened ? 30 : 0) + // Email was opened
      (replied ? 30 : 0) // Got a reply
    
    const insights: string[] = []
    
    if (opened && !replied) {
      insights.push('Email opened but no reply - consider stronger CTA')
    }
    
    if (!opened) {
      insights.push('Email not opened - test different subject lines')
    }
    
    if (replied) {
      insights.push(`${outreach.tone} angle was effective - use more often`)
    }
    
    if (outreach.personalization_score < 50) {
      insights.push('Low personalization score - increase specificity')
    }
    
    return {
      effectiveness_score: score,
      insights
    }
  }
}

