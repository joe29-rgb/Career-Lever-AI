/**
 * Referral Finder Service
 * 
 * Finds potential referrals at target companies through LinkedIn connections
 */

import { PerplexityService } from './perplexity-service'

export interface ReferralContact {
  name: string
  title: string
  company: string
  linkedinUrl: string
  relationship: 'direct' | 'second-degree' | 'alumni' | 'mutual-group'
  connectionStrength: number // 0-100
  canRefer: boolean
  referralLikelihood: 'high' | 'medium' | 'low'
  sharedConnections: string[]
  sharedExperience: string[]
  reachOutStrategy: string
  messageTemplate: string
}

export interface ReferralSearchResult {
  targetCompany: string
  potentialReferrals: ReferralContact[]
  totalFound: number
  confidence: number
}

export class ReferralFinderService {
  /**
   * Find potential referrals at a target company
   */
  static async findReferrals(
    targetCompany: string,
    userLinkedInUrl?: string,
    userSchool?: string,
    userPreviousCompanies?: string[]
  ): Promise<ReferralSearchResult> {
    try {
      const client = new PerplexityService()
      
      const prompt = `Find potential referrals at ${targetCompany} for a job seeker.

User Background:
${userLinkedInUrl ? `LinkedIn: ${userLinkedInUrl}` : ''}
${userSchool ? `School: ${userSchool}` : ''}
${userPreviousCompanies ? `Previous Companies: ${userPreviousCompanies.join(', ')}` : ''}

Search Strategy:
1. **LinkedIn Connections**: Search "site:linkedin.com/in/ ${targetCompany}" for employees
2. **Alumni Network**: Find ${userSchool} alumni working at ${targetCompany}
3. **Previous Colleagues**: Find people from ${userPreviousCompanies?.join(' OR ')} now at ${targetCompany}
4. **Mutual Groups**: Find people in professional groups related to the industry
5. **Second-Degree**: Find connections of connections

For each potential referral, determine:
- Their role and seniority
- How connected they are to the user
- Likelihood they can/will provide a referral
- Best approach to reach out

Return ONLY valid JSON:
{
  "targetCompany": "${targetCompany}",
  "potentialReferrals": [
    {
      "name": "John Smith",
      "title": "Senior Software Engineer",
      "company": "${targetCompany}",
      "linkedinUrl": "https://linkedin.com/in/john-smith",
      "relationship": "alumni",
      "connectionStrength": 75,
      "canRefer": true,
      "referralLikelihood": "high",
      "sharedConnections": ["Jane Doe", "Bob Wilson"],
      "sharedExperience": ["Stanford University", "Google"],
      "reachOutStrategy": "Mention shared alma mater and ask about team culture before requesting referral",
      "messageTemplate": "Hi John, I noticed we're both Stanford alumni! I'm exploring opportunities at ${targetCompany} and would love to learn more about your experience there..."
    }
  ],
  "totalFound": 5,
  "confidence": 0.85
}

REQUIREMENTS:
- Find REAL people with LinkedIn profiles
- Prioritize by connection strength and referral likelihood
- Include specific reach-out strategies
- Provide personalized message templates
- Focus on people who can actually refer (employees, not contractors)`

      const response = await client.makeRequest(
        'You are a professional networking strategist. Find real referral opportunities and provide actionable outreach strategies.',
        prompt,
        {
          temperature: 0.3,
          maxTokens: 3000,
          model: 'sonar-pro'
        }
      )

      // Parse response
      let cleanedContent = response.content.trim()
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
      
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      }

      const parsed = JSON.parse(cleanedContent) as ReferralSearchResult

      return parsed
    } catch (error) {
      console.error('[REFERRAL_FINDER] Failed to find referrals:', error)
      
      // Return fallback
      return {
        targetCompany,
        potentialReferrals: [],
        totalFound: 0,
        confidence: 0
      }
    }
  }

  /**
   * Generate referral request message
   */
  static generateReferralMessage(
    referral: ReferralContact,
    jobTitle: string,
    personalNote?: string
  ): string {
    const templates = {
      alumni: `Hi ${referral.name},

I hope this message finds you well! I noticed we're both alumni of [School Name], and I wanted to reach out.

I'm currently exploring opportunities at ${referral.company}, specifically for the ${jobTitle} role. I've been following ${referral.company}'s work on [specific project/initiative] and I'm really excited about the potential to contribute.

${personalNote || 'I\'d love to learn more about your experience at the company and the team culture.'}

Would you be open to a brief chat about your experience? And if you think I might be a good fit, I'd greatly appreciate any guidance on the application process.

Thank you for considering!

Best regards`,

      'second-degree': `Hi ${referral.name},

I hope you don't mind me reaching out! We have [X mutual connections] in common, including [Name], who speaks highly of you.

I'm exploring the ${jobTitle} position at ${referral.company} and was impressed by [specific aspect of company]. Given your role as ${referral.title}, I thought you might have valuable insights about the team and culture.

${personalNote || 'I\'d love to learn more about your experience and the role.'}

Would you be open to a brief conversation? I'd really appreciate any advice you could share.

Thank you!`,

      direct: `Hi ${referral.name},

I hope you're doing well! I wanted to reach out because I'm very interested in the ${jobTitle} role at ${referral.company}.

${personalNote || 'I\'ve been following the company\'s work and I\'m excited about the opportunity to contribute.'}

Given your experience as ${referral.title}, I\'d love to learn more about the team and what it\'s like working there. If you think I might be a good fit, I\'d be grateful for any guidance on the application process.

Would you be open to a brief chat?

Thanks so much!`
    }

    return templates[referral.relationship] || templates.direct
  }

  /**
   * Score referral likelihood
   */
  static scoreReferralLikelihood(
    connectionStrength: number,
    sharedExperience: string[],
    canRefer: boolean
  ): 'high' | 'medium' | 'low' {
    if (!canRefer) return 'low'
    
    let score = connectionStrength
    score += sharedExperience.length * 10
    
    if (score >= 80) return 'high'
    if (score >= 50) return 'medium'
    return 'low'
  }
}
