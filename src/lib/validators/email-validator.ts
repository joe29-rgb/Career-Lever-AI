/**
 * Email Validator - Enterprise Grade
 * 
 * ZERO TOLERANCE for:
 * - Fake emails (noreply@, test@, example@)
 * - Invalid formats
 * - Disposable email domains
 * - Role-based emails (without verification)
 */

const DISPOSABLE_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'yopmail.com', 'throwaway.email', 'temp-mail.org', 'getnada.com'
]

const FAKE_PATTERNS = [
  /noreply@/i,
  /no-reply@/i,
  /test@/i,
  /example@/i,
  /demo@/i,
  /sample@/i,
  /fake@/i,
  /placeholder@/i
]

const ROLE_BASED = [
  'info', 'admin', 'support', 'sales', 'contact', 'help',
  'service', 'team', 'jobs', 'careers', 'hr', 'recruiting'
]

export interface EmailValidationResult {
  valid: boolean
  email: string | null
  issues: string[]
  confidence: number
  type: 'personal' | 'role' | 'invalid'
}

export function validateEmail(email: string): EmailValidationResult {
  const issues: string[] = []
  
  // Basic validation
  if (!email || email.trim().length === 0) {
    return {
      valid: false,
      email: null,
      issues: ['Email is required'],
      confidence: 0,
      type: 'invalid'
    }
  }
  
  const trimmed = email.trim().toLowerCase()
  
  // Format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      email: null,
      issues: ['Invalid email format'],
      confidence: 0,
      type: 'invalid'
    }
  }
  
  // Check for fake patterns
  for (const pattern of FAKE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        email: null,
        issues: ['Fake/placeholder email detected'],
        confidence: 0,
        type: 'invalid'
      }
    }
  }
  
  // Check domain
  const domain = trimmed.split('@')[1]
  
  // Disposable email check
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return {
      valid: false,
      email: null,
      issues: ['Disposable email domain'],
      confidence: 0,
      type: 'invalid'
    }
  }
  
  // Check if role-based
  const localPart = trimmed.split('@')[0]
  const isRole = ROLE_BASED.includes(localPart)
  
  if (isRole) {
    issues.push('Role-based email (may be generic)')
  }
  
  return {
    valid: true,
    email: trimmed,
    issues,
    confidence: isRole ? 60 : 95,
    type: isRole ? 'role' : 'personal'
  }
}

export function validateEmailBatch(emails: string[]): EmailValidationResult[] {
  return emails.map(validateEmail).filter(result => result.valid)
}

export function extractEmailsFromText(text: string): string[] {
  const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g
  const found = text.match(emailRegex) || []
  return found.filter(email => validateEmail(email).valid)
}
