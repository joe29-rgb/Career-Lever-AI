/**
 * Salary Normalization Utility
 * Converts various salary formats to consistent yearly amounts
 * Handles: hourly, monthly, yearly, ranges, CAD/USD currencies
 */

export interface NormalizedSalary {
  yearly: string // e.g., "$50,000 - $70,000/year"
  yearlyMin: number
  yearlyMax: number
  currency: string
  original: string
  confidence: 'high' | 'medium' | 'low' // How confident we are in the conversion
}

/**
 * Normalize salary string to yearly amount
 * Examples:
 * - "$25/hour" → "$52,000/year"
 * - "$5,000/month" → "$60,000/year"
 * - "$50K-$70K" → "$50,000 - $70,000/year"
 * - "$50k-60k/mo" → "$600,000 - $720,000/year"
 */
export function normalizeSalary(salaryStr: string | null | undefined): NormalizedSalary | null {
  if (!salaryStr) return null

  const original = salaryStr.trim()
  
  // Detect currency (default to CAD for Canadian jobs, USD otherwise)
  const currency = original.toLowerCase().includes('usd') ? 'USD' : 'CAD'
  
  // Remove currency symbols and normalize
  let cleaned = original
    .replace(/USD|CAD/gi, '')
    .replace(/[$,]/g, '')
    .trim()
  
  // Check if it's a range (e.g., "50-70K", "50000-70000")
  const rangeMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[kK]?\s*[-–—to]\s*(\d+(?:\.\d+)?)\s*[kK]?/)
  
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1])
    let max = parseFloat(rangeMatch[2])
    
    // Handle K notation (50K → 50000)
    if (cleaned.toLowerCase().includes('k')) {
      min *= 1000
      max *= 1000
    }
    
    // Detect period (hourly, monthly, yearly)
    const period = detectPeriod(original)
    
    // Convert to yearly
    const yearlyMin = convertToYearly(min, period)
    const yearlyMax = convertToYearly(max, period)
    
    return {
      yearly: `$${formatNumber(yearlyMin)} - $${formatNumber(yearlyMax)}/year`,
      yearlyMin,
      yearlyMax,
      currency,
      original,
      confidence: getConfidence(period, original)
    }
  }
  
  // Single value (e.g., "$50,000", "$25/hour", "$5,000/month")
  const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[kK]?/)
  
  if (singleMatch) {
    let amount = parseFloat(singleMatch[1])
    
    // Handle K notation
    if (cleaned.toLowerCase().includes('k')) {
      amount *= 1000
    }
    
    // Detect period
    const period = detectPeriod(original)
    
    // Convert to yearly
    const yearly = convertToYearly(amount, period)
    
    // For single values, create a reasonable range (±10%)
    const yearlyMin = Math.round(yearly * 0.9)
    const yearlyMax = Math.round(yearly * 1.1)
    
    return {
      yearly: `$${formatNumber(yearly)}/year`,
      yearlyMin,
      yearlyMax,
      currency,
      original,
      confidence: getConfidence(period, original)
    }
  }
  
  // Couldn't parse - return null
  return null
}

/**
 * Detect time period from salary string
 */
function detectPeriod(salaryStr: string): 'hourly' | 'monthly' | 'yearly' {
  const lower = salaryStr.toLowerCase()
  
  if (lower.includes('/hr') || lower.includes('/hour') || lower.includes('per hour') || lower.includes('hourly')) {
    return 'hourly'
  }
  
  if (lower.includes('/mo') || lower.includes('/month') || lower.includes('per month') || lower.includes('monthly')) {
    return 'monthly'
  }
  
  // Default to yearly if not specified or explicitly yearly
  return 'yearly'
}

/**
 * Convert amount to yearly based on period
 */
function convertToYearly(amount: number, period: 'hourly' | 'monthly' | 'yearly'): number {
  switch (period) {
    case 'hourly':
      // Assume 40 hours/week, 52 weeks/year = 2080 hours/year
      return Math.round(amount * 2080)
    case 'monthly':
      return Math.round(amount * 12)
    case 'yearly':
    default:
      return Math.round(amount)
  }
}

/**
 * Get confidence level based on period and original string
 */
function getConfidence(period: 'hourly' | 'monthly' | 'yearly', original: string): 'high' | 'medium' | 'low' {
  const lower = original.toLowerCase()
  
  // High confidence: explicit period specified
  if (
    lower.includes('/year') || 
    lower.includes('/hour') || 
    lower.includes('/month') ||
    lower.includes('per year') ||
    lower.includes('per hour') ||
    lower.includes('per month')
  ) {
    return 'high'
  }
  
  // Medium confidence: K notation or range
  if (lower.includes('k') || lower.includes('-')) {
    return 'medium'
  }
  
  // Low confidence: ambiguous
  return 'low'
}

/**
 * Format number with commas (e.g., 50000 → "50,000")
 */
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Batch normalize multiple salary strings
 */
export function normalizeSalaries(salaries: (string | null | undefined)[]): (NormalizedSalary | null)[] {
  return salaries.map(s => normalizeSalary(s))
}

/**
 * Get display string for normalized salary
 */
export function getSalaryDisplayString(normalized: NormalizedSalary | null): string {
  if (!normalized) return 'Salary not disclosed'
  
  const currencySymbol = normalized.currency === 'USD' ? 'USD' : ''
  return `${normalized.yearly} ${currencySymbol}`.trim()
}

