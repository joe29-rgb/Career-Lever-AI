import { PerplexityIntelligenceService } from './perplexity-intelligence'

export interface EnhancedContact {
  // Basic info (from existing hiringContactsV2)
  name: string
  title: string
  department: string
  linkedinUrl?: string
  email?: string
  phone?: string
  
  // PHASE 2: Enhanced data
  verified_email: boolean
  email_confidence: number // 0-100
  alternative_emails: string[]
  decision_maker_score: number // 0-100 (hiring influence)
  
  // Personality insights for communication
  personality_insights: {
    communication_style: 'direct' | 'formal' | 'casual'
    best_contact_days: string[]
    preferred_approach: string
    response_likelihood: number // 0-100
  }
  
  // Discovery metadata
  source: string
  emailType?: 'public' | 'inferred' | 'pattern'
  discoveryMethod?: string
}

export class ContactEnrichmentService {
  /**
   * PHASE 2A: Enrich a contact with verification and personality insights
   */
  static async enrichContact(
    contact: any,
    companyDomain: string
  ): Promise<EnhancedContact> {
    try {
      console.log('[CONTACT_ENRICHMENT] Enriching:', contact.name, contact.title)
      
      const [verification, emailVariants, personality, decisionScore] = await Promise.all([
        this.verifyEmail(contact.email, companyDomain, contact.name),
        this.generateEmailVariants(contact.name, companyDomain),
        this.analyzePersonality(contact.linkedinUrl, contact.title),
        this.calculateDecisionMakerScore(contact.title)
      ])
      
      const enriched: EnhancedContact = {
        ...contact,
        verified_email: verification.valid,
        email_confidence: verification.confidence,
        alternative_emails: emailVariants,
        decision_maker_score: decisionScore,
        personality_insights: personality,
        source: contact.source || 'Unknown',
        emailType: contact.emailType,
        discoveryMethod: contact.discoveryMethod
      }
      
      console.log('[CONTACT_ENRICHMENT] Enriched:', {
        name: enriched.name,
        email_confidence: enriched.email_confidence,
        decision_score: enriched.decision_maker_score,
        style: enriched.personality_insights.communication_style
      })
      
      return enriched
      
    } catch (error) {
      console.error('[CONTACT_ENRICHMENT] Error enriching contact:', error)
      // Return basic enrichment if AI fails
      return this.basicEnrichment(contact, companyDomain)
    }
  }
  
  /**
   * Verify email validity using AI pattern analysis
   */
  static async verifyEmail(
    email: string | undefined,
    domain: string,
    name: string
  ): Promise<{ valid: boolean; confidence: number; reasoning: string }> {
    if (!email) {
      return { valid: false, confidence: 0, reasoning: 'No email provided' }
    }
    
    try {
      const prompt = `Verify if this business email is likely valid:
      
EMAIL: ${email}
COMPANY DOMAIN: ${domain}
PERSON NAME: ${name}

ANALYSIS CRITERIA:
1. Does the email match common business patterns? (firstname.lastname, first.last, flast, etc.)
2. Does the domain match the company domain or a known email service?
3. Is the format professional and consistent with business standards?
4. Does the name in the email align with the person's actual name?

Return JSON:
{
  "valid": boolean,
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`

      const result = await PerplexityIntelligenceService.customQuery({
        systemPrompt: "You verify business email validity and patterns with high accuracy.",
        userPrompt: prompt,
        temperature: 0.2,
        maxTokens: 200
      })
      
      // Parse the JSON response
      try {
        const parsed = JSON.parse(result.content)
        if (typeof parsed === 'object' && parsed !== null && 'valid' in parsed) {
          return parsed as { valid: boolean; confidence: number; reasoning: string }
        }
      } catch {
        // JSON parsing failed, continue to fallback
      }
      
      // Fallback if result is unexpected format
      return {
        valid: false,
        confidence: 0,
        reasoning: 'Unexpected response format from AI'
      }
      
    } catch (error) {
      console.error('[CONTACT_ENRICHMENT] Email verification failed:', error)
      // Fallback: basic regex check
      const hasValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      const matchesDomain = email.includes(domain.replace('www.', ''))
      return {
        valid: hasValidFormat,
        confidence: matchesDomain ? 70 : 40,
        reasoning: 'Basic regex validation (AI failed)'
      }
    }
  }
  
  /**
   * Generate alternative email format variations
   */
  static generateEmailVariants(name: string, domain: string): string[] {
    try {
      const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
      const nameParts = name.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
      
      if (nameParts.length < 2) {
        return [`${nameParts[0]}@${cleanDomain}`]
      }
      
      const [firstName, ...lastNameParts] = nameParts
      const lastName = lastNameParts.join('')
      const firstInitial = firstName[0]
      const lastInitial = lastName[0]
      
      return [
        `${firstName}.${lastName}@${cleanDomain}`,
        `${firstName}${lastName}@${cleanDomain}`,
        `${firstInitial}${lastName}@${cleanDomain}`,
        `${firstName}_${lastName}@${cleanDomain}`,
        `${firstName}@${cleanDomain}`,
        `${firstInitial}.${lastName}@${cleanDomain}`,
        `${firstName}${lastInitial}@${cleanDomain}`
      ].filter((email, index, self) => self.indexOf(email) === index) // Dedupe
      
    } catch (error) {
      console.error('[CONTACT_ENRICHMENT] Email variant generation failed:', error)
      return []
    }
  }
  
  /**
   * Analyze personality and communication preferences using AI
   */
  static async analyzePersonality(
    linkedinUrl?: string,
    title?: string
  ): Promise<{
    communication_style: 'direct' | 'formal' | 'casual';
    best_contact_days: string[];
    preferred_approach: string;
    response_likelihood: number;
  }> {
    try {
      // If no LinkedIn, infer from title
      if (!linkedinUrl) {
        return this.inferPersonalityFromTitle(title || '')
      }
      
      const prompt = `Analyze this professional's communication style for cold outreach:
      
LINKEDIN: ${linkedinUrl}
TITLE: ${title || 'Unknown'}

Based on their role and seniority, predict:
1. Communication style (direct/formal/casual)
2. Best days to contact (weekday preferences)
3. Preferred approach (value_proposition/relationship_building/direct_ask)
4. Response likelihood (0-100 based on role accessibility)

Return JSON:
{
  "communication_style": "direct" | "formal" | "casual",
  "best_contact_days": ["Tuesday", "Wednesday", "Thursday"],
  "preferred_approach": "brief description",
  "response_likelihood": 0-100
}`

      const result = await PerplexityIntelligenceService.customQuery({
        systemPrompt: "You analyze professional communication styles and preferences.",
        userPrompt: prompt,
        temperature: 0.3,
        maxTokens: 300
      })
      
      // Parse the JSON response
      try {
        const parsed = JSON.parse(result.content)
        if (typeof parsed === 'object' && parsed !== null && 'communication_style' in parsed) {
          return parsed as {
            communication_style: 'direct' | 'formal' | 'casual';
            best_contact_days: string[];
            preferred_approach: string;
            response_likelihood: number;
          }
        }
      } catch {
        // JSON parsing failed, continue to fallback
      }
      
      // Fallback if unexpected format
      return this.inferPersonalityFromTitle(title || '')
      
    } catch (error) {
      console.error('[CONTACT_ENRICHMENT] Personality analysis failed:', error)
      return this.inferPersonalityFromTitle(title || '')
    }
  }
  
  /**
   * Infer personality from job title (fallback when no LinkedIn)
   */
  private static inferPersonalityFromTitle(title: string): {
    communication_style: 'direct' | 'formal' | 'casual';
    best_contact_days: string[];
    preferred_approach: string;
    response_likelihood: number;
  } {
    const titleLower = title.toLowerCase()
    
    // Executive level - prefer direct, high-level communication
    if (/ceo|cto|cfo|vp|chief|president|director/.test(titleLower)) {
      return {
        communication_style: 'direct',
        best_contact_days: ['Tuesday', 'Wednesday', 'Thursday'],
        preferred_approach: 'Clear value proposition with minimal fluff',
        response_likelihood: 30 // Busy, harder to reach
      }
    }
    
    // HR/Recruiting - prefer formal, relationship-focused
    if (/recruiter|talent|hr|people|hiring/.test(titleLower)) {
      return {
        communication_style: 'formal',
        best_contact_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        preferred_approach: 'Professional introduction with clear fit',
        response_likelihood: 70 // Most responsive
      }
    }
    
    // Manager level - balanced approach
    if (/manager|lead|head/.test(titleLower)) {
      return {
        communication_style: 'formal',
        best_contact_days: ['Tuesday', 'Wednesday', 'Thursday'],
        preferred_approach: 'Concise with relevant experience highlights',
        response_likelihood: 50
      }
    }
    
    // Default for other roles
    return {
      communication_style: 'formal',
      best_contact_days: ['Tuesday', 'Wednesday', 'Thursday'],
      preferred_approach: 'Professional and courteous',
      response_likelihood: 40
    }
  }
  
  /**
   * Calculate decision maker score based on title and role
   */
  static calculateDecisionMakerScore(title: string): number {
    const titleLower = title.toLowerCase()
    
    // C-level and VPs - highest decision power
    if (/ceo|cto|cfo|coo|vp|chief|president/.test(titleLower)) {
      return 95
    }
    
    // Directors - high decision power
    if (/director/.test(titleLower)) {
      return 85
    }
    
    // HR/Recruiting - high for hiring decisions
    if (/recruiter|talent|hr manager|hiring manager|people/.test(titleLower)) {
      return 90
    }
    
    // Managers and leads - moderate decision power
    if (/manager|lead|head/.test(titleLower)) {
      return 70
    }
    
    // Coordinators and specialists - lower decision power
    if (/coordinator|specialist|analyst/.test(titleLower)) {
      return 40
    }
    
    // Default
    return 50
  }
  
  /**
   * Fallback: Basic enrichment without AI
   */
  private static basicEnrichment(
    contact: any,
    companyDomain: string
  ): EnhancedContact {
    console.log('[CONTACT_ENRICHMENT] Using basic enrichment fallback')
    
    return {
      ...contact,
      verified_email: !!contact.email,
      email_confidence: contact.email ? 60 : 0,
      alternative_emails: this.generateEmailVariants(contact.name, companyDomain),
      decision_maker_score: this.calculateDecisionMakerScore(contact.title),
      personality_insights: this.inferPersonalityFromTitle(contact.title),
      source: contact.source || 'Unknown',
      emailType: contact.emailType,
      discoveryMethod: contact.discoveryMethod
    }
  }
  
  /**
   * Batch enrich multiple contacts
   */
  static async enrichContacts(
    contacts: any[],
    companyDomain: string
  ): Promise<EnhancedContact[]> {
    console.log('[CONTACT_ENRICHMENT] Batch enriching', contacts.length, 'contacts')
    
    // Process in parallel with limit
    const BATCH_SIZE = 3
    const enriched: EnhancedContact[] = []
    
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(contact => this.enrichContact(contact, companyDomain))
      )
      enriched.push(...batchResults)
    }
    
    // Sort by decision maker score (highest first)
    return enriched.sort((a, b) => b.decision_maker_score - a.decision_maker_score)
  }
}

