/**
 * Contact Validation Utilities
 * Validates hiring contacts, emails, and LinkedIn profiles
 */

import dns from 'dns/promises'

/**
 * Personal email domains to reject
 */
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com'
]

/**
 * Validate LinkedIn profile URL
 */
export function isValidLinkedInURL(url: string): boolean {
  if (!url) return false
  
  // Match LinkedIn profile URLs
  const patterns = [
    /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,
    /^https?:\/\/(www\.)?linkedin\.com\/pub\/[a-zA-Z0-9-]+\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/?$/
  ]
  
  return patterns.some(pattern => pattern.test(url))
}

/**
 * Validate email format
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email) return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if email is from a personal domain
 */
export function isPersonalEmail(email: string): boolean {
  if (!email) return false
  
  const domain = email.split('@')[1]?.toLowerCase()
  return PERSONAL_EMAIL_DOMAINS.includes(domain)
}

/**
 * Validate corporate email by checking MX records
 */
export async function validateCorporateEmail(email: string): Promise<{
  valid: boolean
  reason?: string
}> {
  // Check format
  if (!isValidEmailFormat(email)) {
    return { valid: false, reason: 'Invalid email format' }
  }
  
  // Check if personal email
  if (isPersonalEmail(email)) {
    return { valid: false, reason: 'Personal email domain' }
  }
  
  // Check MX records
  const domain = email.split('@')[1]
  try {
    const mx = await dns.resolveMx(domain)
    if (mx.length === 0) {
      return { valid: false, reason: 'No MX records found' }
    }
    return { valid: true }
  } catch (error) {
    return { valid: false, reason: 'DNS lookup failed' }
  }
}

/**
 * Validate hiring contact
 */
export interface HiringContact {
  name: string
  title?: string | null
  email?: string | null
  linkedinUrl?: string | null
  company?: string
}

export interface ValidatedContact extends HiringContact {
  validation: {
    emailValid: boolean
    emailReason?: string
    linkedInValid: boolean
    overallScore: number // 0-100
  }
}

export async function validateHiringContact(
  contact: HiringContact
): Promise<ValidatedContact> {
  const validation = {
    emailValid: false,
    emailReason: undefined as string | undefined,
    linkedInValid: false,
    overallScore: 0
  }
  
  // Validate email if present
  if (contact.email) {
    const emailValidation = await validateCorporateEmail(contact.email)
    validation.emailValid = emailValidation.valid
    validation.emailReason = emailValidation.reason
  }
  
  // Validate LinkedIn URL if present
  if (contact.linkedinUrl) {
    validation.linkedInValid = isValidLinkedInURL(contact.linkedinUrl)
  }
  
  // Calculate overall score
  let score = 0
  
  // Name is required (20 points)
  if (contact.name && contact.name.length > 2) {
    score += 20
  }
  
  // Title adds credibility (20 points)
  if (contact.title) {
    score += 20
    
    // Bonus for HR/recruiting titles (10 points)
    const title = contact.title.toLowerCase()
    if (
      title.includes('recruiter') ||
      title.includes('talent') ||
      title.includes('hr') ||
      title.includes('people') ||
      title.includes('hiring')
    ) {
      score += 10
    }
  }
  
  // Valid email is valuable (30 points)
  if (validation.emailValid) {
    score += 30
  }
  
  // Valid LinkedIn is good (20 points)
  if (validation.linkedInValid) {
    score += 20
  }
  
  validation.overallScore = Math.min(100, score)
  
  return {
    ...contact,
    validation
  }
}

/**
 * Batch validate contacts
 */
export async function validateHiringContacts(
  contacts: HiringContact[]
): Promise<ValidatedContact[]> {
  const validated = await Promise.all(
    contacts.map(contact => validateHiringContact(contact))
  )
  
  // Sort by score (highest first)
  return validated.sort((a, b) => b.validation.overallScore - a.validation.overallScore)
}

/**
 * Filter contacts by minimum score
 */
export function filterContactsByScore(
  contacts: ValidatedContact[],
  minScore: number = 50
): ValidatedContact[] {
  return contacts.filter(contact => contact.validation.overallScore >= minScore)
}

/**
 * Get best contact from list
 */
export function getBestContact(contacts: ValidatedContact[]): ValidatedContact | null {
  if (contacts.length === 0) return null
  
  // Prefer contacts with valid email
  const withEmail = contacts.filter(c => c.validation.emailValid)
  if (withEmail.length > 0) {
    return withEmail[0]
  }
  
  // Otherwise return highest scored
  return contacts[0]
}

/**
 * Extract domain from email
 */
export function getEmailDomain(email: string): string | null {
  if (!isValidEmailFormat(email)) return null
  return email.split('@')[1]?.toLowerCase() || null
}

/**
 * Check if email domain matches company
 */
export function emailMatchesCompany(email: string, companyName: string): boolean {
  const domain = getEmailDomain(email)
  if (!domain) return false
  
  const companySlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  
  const domainSlug = domain
    .split('.')[0]
    .replace(/[^a-z0-9]/g, '')
  
  return domainSlug.includes(companySlug) || companySlug.includes(domainSlug)
}
