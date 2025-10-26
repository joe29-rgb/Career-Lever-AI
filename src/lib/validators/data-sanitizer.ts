/**
 * Data Sanitizer - Enterprise Grade
 * 
 * Purpose: Remove dangerous/fake data before it reaches the database
 * ZERO TOLERANCE policy for bad data
 */

export class DataSanitizer {
  
  /**
   * Sanitize text - remove HTML, scripts, dangerous characters
   */
  static sanitizeText(text: string): string {
    if (!text) return ''
    
    return text
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/\0/g, '')
      .substring(0, 10000) // Max length
  }
  
  /**
   * Sanitize URL - ensure it's safe
   */
  static sanitizeURL(url: string): string | null {
    if (!url) return null
    
    const trimmed = url.trim()
    
    // Must start with http/https
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return null
    }
    
    // Block dangerous protocols
    if (trimmed.match(/javascript:|data:|vbscript:/i)) {
      return null
    }
    
    try {
      const parsed = new URL(trimmed)
      return parsed.href
    } catch {
      return null
    }
  }
  
  /**
   * Sanitize phone number
   */
  static sanitizePhone(phone: string): string | null {
    if (!phone) return null
    
    // Remove all non-numeric except +
    const cleaned = phone.replace(/[^\d+]/g, '')
    
    // Must be reasonable length
    if (cleaned.length < 10 || cleaned.length > 15) {
      return null
    }
    
    return cleaned
  }
  
  /**
   * Sanitize company data
   */
  static sanitizeCompanyData(data: Record<string, unknown>): Record<string, unknown> {
    return {
      name: this.sanitizeText(String(data.name || '')),
      website: this.sanitizeURL(String(data.website || '')),
      location: this.sanitizeText(String(data.location || '')),
      industry: this.sanitizeText(String(data.industry || '')),
      description: this.sanitizeText(String(data.description || '')),
      employees: this.sanitizeNumber(data.employees),
      founded: this.sanitizeNumber(data.founded)
    }
  }
  
  /**
   * Sanitize job data
   */
  static sanitizeJobData(data: Record<string, unknown>): Record<string, unknown> {
    return {
      title: this.sanitizeText(String(data.title || '')),
      company: this.sanitizeText(String(data.company || '')),
      location: this.sanitizeText(String(data.location || '')),
      url: this.sanitizeURL(String(data.url || '')),
      description: this.sanitizeText(String(data.description || '')),
      salary: this.sanitizeText(String(data.salary || '')),
      source: this.sanitizeText(String(data.source || '')),
      posted: this.sanitizeText(String(data.posted || ''))
    }
  }
  
  /**
   * Sanitize number
   */
  static sanitizeNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null
    
    const num = typeof value === 'string' ? parseInt(value.replace(/[^\d]/g, '')) : Number(value)
    
    if (isNaN(num)) return null
    if (num < 0) return null
    if (num > 1000000000) return null // Reasonable max
    
    return num
  }
  
  /**
   * Remove duplicates from array
   */
  static removeDuplicates<T extends Record<string, unknown>>(array: T[], key: keyof T): T[] {
    const seen = new Set()
    return array.filter(item => {
      const value = item[key]
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
  }
  
  /**
   * Deep clean object - remove null/undefined/empty strings
   */
  static deepClean(obj: unknown): unknown {
    if (obj === null || obj === undefined) return null
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClean(item)).filter(item => item !== null)
    }
    
    if (typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined || value === '') continue
        cleaned[key] = this.deepClean(value)
      }
      return Object.keys(cleaned).length > 0 ? cleaned : null
    }
    
    return obj
  }
}
