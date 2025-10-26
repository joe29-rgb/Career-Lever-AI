/**
 * Company Validator - Enterprise Grade
 * 
 * ZERO TOLERANCE for:
 * - "UNKNOWN" companies
 * - "Confidential" employers
 * - Generic placeholders
 * - Missing critical data
 */

const INVALID_COMPANY_NAMES = [
  'unknown',
  'confidential',
  'n/a',
  'na',
  'not available',
  'not specified',
  'tbd',
  'to be determined',
  'unnamed',
  'anonymous',
  '[redacted]',
  'private',
  'undisclosed'
]

const GENERIC_PATTERNS = [
  /company name/i,
  /employer name/i,
  /hiring company/i,
  /recruiting firm/i,
  /staffing agency/i,
  /^temp /i,
  /^contract /i
]

export interface CompanyValidationResult {
  valid: boolean
  company: {
    name: string
    normalizedName: string
    website?: string
    location?: string
    industry?: string
  } | null
  issues: string[]
  confidence: number
}

export function validateCompany(companyData: {
  name: string
  website?: string
  location?: string
  industry?: string
}): CompanyValidationResult {
  const issues: string[] = []
  
  // Check company name
  if (!companyData.name || companyData.name.trim().length < 2) {
    return {
      valid: false,
      company: null,
      issues: ['Company name is required'],
      confidence: 0
    }
  }
  
  const normalized = companyData.name.trim().toLowerCase()
  
  // Check against invalid names
  if (INVALID_COMPANY_NAMES.includes(normalized)) {
    return {
      valid: false,
      company: null,
      issues: [`Invalid company name: "${companyData.name}"`],
      confidence: 0
    }
  }
  
  // Check generic patterns
  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(companyData.name)) {
      return {
        valid: false,
        company: null,
        issues: ['Generic/placeholder company name'],
        confidence: 0
      }
    }
  }
  
  // Validate website if provided
  if (companyData.website) {
    const urlPattern = /^https?:\/\//
    if (!urlPattern.test(companyData.website)) {
      issues.push('Invalid website URL format')
    }
  }
  
  // Check for minimum data quality
  let confidence = 70
  
  if (companyData.website) confidence += 10
  if (companyData.location) confidence += 10
  if (companyData.industry) confidence += 10
  
  return {
    valid: true,
    company: {
      name: companyData.name.trim(),
      normalizedName: normalized,
      website: companyData.website,
      location: companyData.location,
      industry: companyData.industry
    },
    issues,
    confidence
  }
}

export function normalizeCompanyName(name: string): string {
  return name
    .trim()
    .replace(/\s+Inc\.?$/i, '')
    .replace(/\s+Ltd\.?$/i, '')
    .replace(/\s+LLC$/i, '')
    .replace(/\s+Corp\.?$/i, '')
    .replace(/\s+Corporation$/i, '')
    .replace(/\s+Company$/i, '')
    .trim()
}
