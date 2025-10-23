/**
 * Phone Number Extraction & Formatting Service
 * 
 * Extracts and formats phone numbers from text
 */

export interface PhoneNumber {
  raw: string
  formatted: string
  country: string
  type: 'mobile' | 'landline' | 'toll-free' | 'unknown'
  confidence: number
}

export class PhoneExtractionService {
  /**
   * Extract phone numbers from text
   */
  static extractPhoneNumbers(text: string): PhoneNumber[] {
    const phones: PhoneNumber[] = []

    // North American patterns
    const naPatterns = [
      /\+?1?\s*\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})/g, // (555) 123-4567
      /\b(\d{3})[\s.-](\d{3})[\s.-](\d{4})\b/g,              // 555-123-4567
      /\b(\d{3})[\s.](\d{4})\b/g                              // 555.1234
    ]

    // International patterns
    const intlPatterns = [
      /\+(\d{1,3})\s*\(?(\d{1,4})\)?[\s.-]?(\d{1,4})[\s.-]?(\d{1,9})/g
    ]

    // Extract North American numbers
    for (const pattern of naPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const raw = match[0]
        const areaCode = match[1]
        const prefix = match[2]
        const line = match[3]
        
        if (areaCode && prefix && line) {
          const formatted = `+1 (${areaCode}) ${prefix}-${line}`
          phones.push({
            raw,
            formatted,
            country: 'US/CA',
            type: this.determinePhoneType(areaCode),
            confidence: 90
          })
        }
      }
    }

    // Extract international numbers
    for (const pattern of intlPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const raw = match[0]
        const countryCode = match[1]
        const formatted = raw.replace(/\s+/g, ' ').trim()
        
        phones.push({
          raw,
          formatted,
          country: this.getCountryFromCode(countryCode),
          type: 'unknown',
          confidence: 70
        })
      }
    }

    // Remove duplicates
    const unique = phones.filter((phone, index, self) =>
      index === self.findIndex(p => p.formatted === phone.formatted)
    )

    return unique
  }

  /**
   * Determine phone type based on area code
   */
  private static determinePhoneType(areaCode: string): 'mobile' | 'landline' | 'toll-free' | 'unknown' {
    const code = parseInt(areaCode)
    
    // Toll-free numbers
    if ([800, 888, 877, 866, 855, 844, 833].includes(code)) {
      return 'toll-free'
    }
    
    // Most area codes can be either mobile or landline
    return 'unknown'
  }

  /**
   * Get country from country code
   */
  private static getCountryFromCode(code: string): string {
    const countryMap: Record<string, string> = {
      '1': 'US/CA',
      '44': 'UK',
      '61': 'AU',
      '64': 'NZ',
      '91': 'IN',
      '86': 'CN',
      '81': 'JP',
      '49': 'DE',
      '33': 'FR',
      '39': 'IT',
      '34': 'ES'
    }
    return countryMap[code] || 'Unknown'
  }

  /**
   * Format phone number to standard format
   */
  static formatPhoneNumber(phone: string, countryCode: string = '1'): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // North American format
    if (countryCode === '1' && digits.length === 10) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    
    // International format
    if (digits.length > 10) {
      return `+${digits}`
    }
    
    return phone
  }

  /**
   * Validate phone number
   */
  static isValidPhoneNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 15
  }

  /**
   * Extract phone numbers from company website
   */
  static extractFromWebsite(html: string): PhoneNumber[] {
    // Look for common patterns in HTML
    const patterns = [
      /(?:phone|tel|call|contact)[\s:]*([+\d\s().-]{10,})/gi,
      /(?:office|main)[\s:]*([+\d\s().-]{10,})/gi
    ]

    const phones: PhoneNumber[] = []
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        const extracted = this.extractPhoneNumbers(match[1])
        phones.push(...extracted)
      }
    }

    return phones
  }
}
