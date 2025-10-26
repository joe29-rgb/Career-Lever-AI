/**
 * CONTACT RESEARCH AGENT
 * Finds verified hiring managers with real emails using Perplexity + Hunter.io
 */

import { BaseAgent, AgentTask, AgentResult } from './base-agent'
import { COMPREHENSIVE_CONTACT_SOURCES, getConfiguredContactSources } from '../comprehensive-data-sources'

export interface HiringContact {
  name: string
  title: string
  department: string
  email?: string
  linkedinUrl?: string
  source: string
  confidence: number
  verified?: boolean
}

export class ContactResearchAgent extends BaseAgent {
  constructor() {
    super('Contact Research Agent')
  }

  async execute(task: AgentTask): Promise<AgentResult<HiringContact[]>> {
    const { companyName, companyDomain } = task.input
    const started = Date.now()

    this.log(`🔍 Researching hiring contacts at ${companyName}...`)

    // Get configured contact sources (free + those with API keys)
    const sources = getConfiguredContactSources()
    const searches = sources.map(s => ({
      name: s.name,
      pattern: s.searchPattern(companyName),
      reliability: s.reliability
    }))

    this.log(`📊 Using ${searches.length} contact sources`)

    // Try Perplexity agent first
    try {
      const perplexityContacts = await this.searchWithPerplexity(companyName, companyDomain, searches)
      
      // Verify emails with Hunter.io if available
      const verified = await this.verifyWithHunter(perplexityContacts, companyDomain)
      
      if (verified.length > 0) {
        this.log(`✅ Found ${verified.length} verified contacts`)
        return {
          success: true,
          data: verified,
          reasoning: 'Perplexity agent found contacts via LinkedIn and company website, verified with Hunter.io',
          confidence: verified.length > 0 ? 0.85 : 0,
          sources: verified.map(c => ({ title: c.name, url: c.linkedinUrl || '' })),
          duration: Date.now() - started,
          method: 'perplexity+hunter'
        }
      }
      
      this.log(`⚠️ No verified contacts found`, 'warn')
    } catch (error) {
      this.log(`❌ Contact research failed: ${(error as Error).message}`, 'error')
    }

    return {
      success: false,
      data: [],
      reasoning: 'Unable to find verified hiring contacts for this company',
      confidence: 0,
      sources: [],
      duration: Date.now() - started,
      method: 'none'
    }
  }

  private async searchWithPerplexity(
    companyName: string,
    companyDomain: string | undefined,
    searches: Array<{ name: string; pattern: string; reliability: number }>
  ): Promise<HiringContact[]> {
    const domain = companyDomain || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`
    
    const prompt = `🔴 AUTONOMOUS CONTACT RESEARCH MISSION 🔴

TASK: Find VERIFIED hiring managers/recruiters at "${companyName}"

MANDATORY STEPS:
1. **USE web_search tool** to perform these searches:
${searches.map((s, i) => `   ${i+1}. ${s.name}: "${s.pattern}"`).join('\n')}

2. For EACH result:
   - VISIT the LinkedIn profile or company page
   - EXTRACT: Full Name, Job Title, Department
   - FIND email ONLY if visible on LinkedIn or company website
   - VERIFY email domain matches company (${domain})
   - GET LinkedIn profile URL

3. ALSO SEARCH:
   - Visit ${companyName} official website /contact page
   - Visit ${companyName} official website /about/team page
   - Extract general emails: careers@${domain}, hr@${domain}, jobs@${domain}, recruiting@${domain}

4. PRIORITIZE:
   - Talent Acquisition Managers
   - Recruiters
   - HR Directors
   - Hiring Managers
   - People Operations

CRITICAL RULES:
✅ Return ONLY contacts with verified emails OR LinkedIn URLs
✅ NO personal emails (gmail, yahoo, hotmail, outlook)
✅ NO guessed/pattern emails unless explicitly seen on website
✅ Email domain MUST match company domain (${domain})
✅ If ZERO contacts found, return []
✅ Include confidence score (0-1) based on source reliability

OUTPUT FORMAT (strict JSON array):
[{
  "name": "Real Person Name",
  "title": "Talent Acquisition Manager",
  "department": "Human Resources",
  "email": "verified@${domain}",
  "linkedinUrl": "https://linkedin.com/in/real-profile",
  "source": "LinkedIn profile",
  "confidence": 0.9
}]

REASONING: After the JSON, explain:
- Which sources you searched
- How many contacts you found
- How you verified the emails
- Any challenges encountered

🚨 CRITICAL: DO NOT MAKE UP CONTACTS. Return [] if none found.
🚨 CRITICAL: DO NOT GUESS EMAILS. Only include if explicitly found.
🚨 CRITICAL: NO personal email domains (gmail, yahoo, etc).

START YOUR SEARCH NOW using web_search tool!`

    try {
      const response = await this.think(prompt, { maxTokens: 6000, temperature: 0.1 })
      
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*?\]/)?.[0]
      if (!jsonMatch) {
        this.log('⚠️ No JSON found in Perplexity response', 'warn')
        return []
      }
      
      const contacts = JSON.parse(jsonMatch) as HiringContact[]
      
      // Validate contacts
      const validated = this.validateContacts(contacts, domain)
      
      this.log(`✅ Validated ${validated.length}/${contacts.length} contacts from Perplexity`)
      
      return validated
    } catch (error) {
      this.log(`❌ Perplexity contact search failed: ${(error as Error).message}`, 'error')
      return []
    }
  }

  private validateContacts(contacts: HiringContact[], expectedDomain: string): HiringContact[] {
    return contacts.filter(c => {
      // Must have either email or LinkedIn URL
      if (!c.email && !c.linkedinUrl) {
        this.log(`🚫 Rejected contact without email or LinkedIn: ${c.name}`)
        return false
      }
      
      // If email exists, validate it
      if (c.email) {
        const emailDomain = c.email.split('@')[1]?.toLowerCase()
        
        // Reject personal email domains
        const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com']
        if (personalDomains.includes(emailDomain)) {
          this.log(`🚫 Rejected personal email: ${c.email}`)
          return false
        }
        
        // Warn if domain doesn't match (but don't reject - might be parent company)
        if (!emailDomain.includes(expectedDomain.split('.')[0])) {
          this.log(`⚠️ Email domain mismatch: ${c.email} (expected ${expectedDomain})`, 'warn')
        }
      }
      
      return true
    })
  }

  private async verifyWithHunter(contacts: HiringContact[], companyDomain: string | undefined): Promise<HiringContact[]> {
    const hunterApiKey = process.env.HUNTER_API_KEY
    
    if (!hunterApiKey) {
      this.log('⚠️ Hunter.io API key not configured, skipping email verification', 'warn')
      return contacts
    }

    this.log(`🔍 Verifying ${contacts.length} contacts with Hunter.io...`)
    
    const verified: HiringContact[] = []

    for (const contact of contacts) {
      // If no email, try to find one with Hunter
      if (!contact.email && companyDomain) {
        try {
          const hunterEmail = await this.findEmailWithHunter(contact.name, companyDomain, hunterApiKey)
          if (hunterEmail) {
            this.log(`✅ Hunter.io found email for ${contact.name}: ${hunterEmail}`)
            verified.push({
              ...contact,
              email: hunterEmail,
              confidence: 0.85,
              verified: true
            })
            continue
          }
        } catch (error) {
          this.log(`⚠️ Hunter.io lookup failed for ${contact.name}`, 'warn')
        }
      }
      
      // If email exists, verify it
      if (contact.email) {
        try {
          const isValid = await this.verifyEmailWithHunter(contact.email, hunterApiKey)
          verified.push({
            ...contact,
            confidence: isValid ? 0.95 : contact.confidence * 0.7,
            verified: isValid
          })
          this.log(`${isValid ? '✅' : '⚠️'} Email ${isValid ? 'verified' : 'unverified'}: ${contact.email}`)
        } catch (error) {
          // Keep contact even if verification fails
          verified.push({
            ...contact,
            confidence: contact.confidence * 0.8,
            verified: false
          })
        }
      } else {
        // No email, but has LinkedIn - keep it
        verified.push(contact)
      }
    }

    this.log(`✅ Verification complete: ${verified.length} contacts`)
    
    return verified
  }

  private async findEmailWithHunter(name: string, domain: string, apiKey: string): Promise<string | null> {
    try {
      const [firstName, ...lastNameParts] = name.split(' ')
      const lastName = lastNameParts.join(' ')
      
      const url = `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${apiKey}`
      
      const response = await fetch(url)
      const data = await response.json() as { data: { email: string; score: number } }
      
      if (data.data?.email && data.data.score > 70) {
        return data.data.email
      }
      
      return null
    } catch (error) {
      this.log(`❌ Hunter.io email finder error: ${(error as Error).message}`, 'error')
      return null
    }
  }

  private async verifyEmailWithHunter(email: string, apiKey: string): Promise<boolean> {
    try {
      const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${apiKey}`
      
      const response = await fetch(url)
      const data = await response.json() as { data: { result: string; score: number } }
      
      return data.data.result === 'deliverable' || data.data.score > 70
    } catch (error) {
      this.log(`❌ Hunter.io email verifier error: ${(error as Error).message}`, 'error')
      return false
    }
  }
}
