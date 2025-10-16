/**
 * Salary Utilities
 * Fixes ISSUE #7: No salary information
 */

export interface SalaryRange {
  min: number
  max: number
  currency?: string
  period?: 'yearly' | 'hourly'
}

/**
 * Parse salary string to structured format
 */
export function parseSalary(salaryStr: string | null | undefined): SalaryRange | null {
  if (!salaryStr) return null
  
  const cleaned = salaryStr.toLowerCase().replace(/,/g, '')
  
  // Match patterns like "$50,000 - $80,000" or "$50k-$80k"
  const rangeMatch = cleaned.match(/\$?(\d+)k?\s*[-–—]\s*\$?(\d+)k?/)
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]) * (rangeMatch[1].length <= 3 ? 1000 : 1)
    const max = parseInt(rangeMatch[2]) * (rangeMatch[2].length <= 3 ? 1000 : 1)
    return { min, max, currency: 'USD', period: 'yearly' }
  }
  
  // Match single value like "$75,000" or "$75k"
  const singleMatch = cleaned.match(/\$?(\d+)k?/)
  if (singleMatch) {
    const value = parseInt(singleMatch[1]) * (singleMatch[1].length <= 3 ? 1000 : 1)
    return { min: value, max: value, currency: 'USD', period: 'yearly' }
  }
  
  return null
}

/**
 * Estimate salary based on job title and level
 */
export function estimateSalary(jobTitle: string, location?: string): SalaryRange | null {
  const titleLower = jobTitle.toLowerCase()
  
  // Salary ranges by seniority level (USD yearly)
  const salaryRanges: Record<string, SalaryRange> = {
    'entry level': { min: 35000, max: 55000 },
    'entry-level': { min: 35000, max: 55000 },
    'junior': { min: 40000, max: 65000 },
    'intermediate': { min: 55000, max: 85000 },
    'mid-level': { min: 60000, max: 90000 },
    'senior': { min: 85000, max: 130000 },
    'lead': { min: 100000, max: 160000 },
    'principal': { min: 120000, max: 180000 },
    'staff': { min: 110000, max: 170000 },
    'manager': { min: 90000, max: 140000 },
    'director': { min: 130000, max: 200000 },
    'vp': { min: 150000, max: 250000 },
    'vice president': { min: 150000, max: 250000 },
    'c-level': { min: 200000, max: 400000 },
    'cto': { min: 200000, max: 400000 },
    'ceo': { min: 250000, max: 500000 }
  }
  
  // Find matching level
  for (const [level, range] of Object.entries(salaryRanges)) {
    if (titleLower.includes(level)) {
      // Adjust for location if provided
      if (location) {
        const locationLower = location.toLowerCase()
        if (locationLower.includes('san francisco') || locationLower.includes('new york')) {
          // High cost of living - increase by 30%
          return {
            min: Math.round(range.min * 1.3),
            max: Math.round(range.max * 1.3),
            currency: 'USD',
            period: 'yearly'
          }
        } else if (locationLower.includes('remote')) {
          // Remote - slight increase
          return {
            min: Math.round(range.min * 1.1),
            max: Math.round(range.max * 1.1),
            currency: 'USD',
            period: 'yearly'
          }
        }
      }
      
      return { ...range, currency: 'USD', period: 'yearly' }
    }
  }
  
  // Default range if no match
  return { min: 50000, max: 90000, currency: 'USD', period: 'yearly' }
}

/**
 * Format salary range for display
 */
export function formatSalaryRange(range: SalaryRange | null, includeEstimated = false): string {
  if (!range) return 'Salary not listed'
  
  const { min, max, currency = 'USD' } = range
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
  
  if (min === max) {
    return `${formatter.format(min)}${includeEstimated ? ' (estimated)' : ''}`
  }
  
  return `${formatter.format(min)} - ${formatter.format(max)}${includeEstimated ? ' (estimated)' : ''}`
}

/**
 * Get salary display string with fallback to estimation
 */
export function getSalaryDisplay(
  job: { title: string; salary?: string; location?: string }
): string {
  // Try to parse provided salary
  if (job.salary) {
    const parsed = parseSalary(job.salary)
    if (parsed) {
      return formatSalaryRange(parsed)
    }
  }
  
  // Fallback to estimation
  const estimated = estimateSalary(job.title, job.location)
  return formatSalaryRange(estimated, true)
}
