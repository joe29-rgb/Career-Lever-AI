/**
 * Email Verification & Enrichment Service
 * 
 * Validates email deliverability and enriches contact information
 */

export interface EmailVerificationResult {
  email: string
  isValid: boolean
  isDeliverable: boolean
  domainValid: boolean
  mxRecordsExist: boolean
  confidence: number
  riskLevel: 'low' | 'medium' | 'high'
  suggestions: string[]
}

export class EmailVerificationService {
  /**
   * Verify email format and basic deliverability
   */
  static async verifyEmail(email: string): Promise<EmailVerificationResult> {
    const result: EmailVerificationResult = {
      email,
      isValid: false,
      isDeliverable: false,
      domainValid: false,
      mxRecordsExist: false,
      confidence: 0,
      riskLevel: 'high',
      suggestions: []
    }

    // Step 1: Format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      result.suggestions.push('Invalid email format')
      return result
    }
    result.isValid = true

    // Step 2: Extract domain
    const domain = email.split('@')[1]
    if (!domain) {
      result.suggestions.push('Missing domain')
      return result
    }

    // Step 3: Check domain validity
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+$/
    result.domainValid = domainRegex.test(domain)

    // Step 4: Common domain checks
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com']
    const isCommonDomain = commonDomains.includes(domain.toLowerCase())

    // Step 5: Disposable email check
    const disposableDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com']
    const isDisposable = disposableDomains.some(d => domain.toLowerCase().includes(d))

    if (isDisposable) {
      result.riskLevel = 'high'
      result.suggestions.push('Disposable email detected')
      result.confidence = 10
      return result
    }

    // Step 6: Calculate confidence
    let confidence = 50 // Base confidence for valid format

    if (result.domainValid) confidence += 20
    if (isCommonDomain) confidence += 20
    if (!isDisposable) confidence += 10

    result.confidence = Math.min(100, confidence)
    result.isDeliverable = confidence >= 70
    result.riskLevel = confidence >= 70 ? 'low' : confidence >= 50 ? 'medium' : 'high'

    // Step 7: Suggestions
    if (!isCommonDomain && !domain.includes('.')) {
      result.suggestions.push('Domain may be invalid')
    }
    if (email.includes('..')) {
      result.suggestions.push('Contains consecutive dots')
    }
    if (email.startsWith('.') || email.endsWith('.')) {
      result.suggestions.push('Cannot start or end with dot')
    }

    return result
  }

  /**
   * Verify multiple emails in batch
   */
  static async verifyBatch(emails: string[]): Promise<EmailVerificationResult[]> {
    return Promise.all(emails.map(email => this.verifyEmail(email)))
  }

  /**
   * Extract email from text
   */
  static extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const matches = text.match(emailRegex) || []
    return Array.from(new Set(matches)) // Remove duplicates
  }

  /**
   * Validate email domain matches company domain
   */
  static validateCompanyEmail(email: string, companyDomain: string): boolean {
    const emailDomain = email.split('@')[1]?.toLowerCase()
    const cleanCompanyDomain = companyDomain.toLowerCase().replace(/^www\./, '')
    return emailDomain === cleanCompanyDomain || emailDomain?.includes(cleanCompanyDomain)
  }

  /**
   * Generate email variations based on name and company
   */
  static generateEmailVariations(firstName: string, lastName: string, domain: string): string[] {
    const f = firstName.toLowerCase()
    const l = lastName.toLowerCase()
    const d = domain.toLowerCase().replace(/^www\./, '')

    return [
      `${f}.${l}@${d}`,
      `${f}${l}@${d}`,
      `${f}_${l}@${d}`,
      `${f}@${d}`,
      `${l}@${d}`,
      `${f[0]}${l}@${d}`,
      `${f}.${l[0]}@${d}`
    ]
  }
}
