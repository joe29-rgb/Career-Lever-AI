/**
 * COMPREHENSIVE KEYWORD DATABASE
 * 
 * 50 high-volume keywords across 4 industries
 * Expected: 50 keywords × 150 jobs = 7,500 jobs
 */

export const KEYWORDS = {
  // ========================================
  // TECH (15 keywords)
  // ========================================
  tech: [
    'software developer',
    'web developer',
    'data analyst',
    'DevOps engineer',
    'full stack developer',
    'backend developer',
    'frontend developer',
    'mobile developer',
    'QA engineer',
    'data scientist',
    'machine learning engineer',
    'cloud architect',
    'cybersecurity analyst',
    'network engineer',
    'IT support specialist'
  ],
  
  // ========================================
  // HEALTHCARE (10 keywords)
  // ========================================
  healthcare: [
    'registered nurse',
    'nurse practitioner',
    'medical assistant',
    'physician',
    'pharmacist',
    'physiotherapist',
    'lab technician',
    'dental hygienist',
    'paramedic',
    'radiologist'
  ],
  
  // ========================================
  // TRADES (10 keywords)
  // ========================================
  trades: [
    'electrician',
    'plumber',
    'carpenter',
    'welder',
    'HVAC technician',
    'heavy equipment operator',
    'millwright',
    'pipefitter',
    'machinist',
    'automotive mechanic'
  ],
  
  // ========================================
  // BUSINESS (15 keywords)
  // ========================================
  business: [
    'accountant',
    'financial analyst',
    'business analyst',
    'project manager',
    'sales representative',
    'account manager',
    'marketing manager',
    'HR manager',
    'operations manager',
    'supply chain manager',
    'procurement specialist',
    'business development',
    'management consultant',
    'data analyst',
    'administrative coordinator'
  ]
}

/**
 * Get all keywords as flat array
 */
export function getAllKeywords(): string[] {
  return [
    ...KEYWORDS.tech,
    ...KEYWORDS.healthcare,
    ...KEYWORDS.trades,
    ...KEYWORDS.business
  ]
}

/**
 * Get keywords by category
 */
export function getKeywordsByCategory(category: keyof typeof KEYWORDS): string[] {
  return KEYWORDS[category]
}

/**
 * Get top N keywords (highest volume)
 */
export function getTopKeywords(n: number): string[] {
  const all = getAllKeywords()
  return all.slice(0, Math.min(n, all.length))
}

/**
 * Statistics
 */
export function getKeywordStats() {
  return {
    total: getAllKeywords().length,
    byCategory: {
      tech: KEYWORDS.tech.length,
      healthcare: KEYWORDS.healthcare.length,
      trades: KEYWORDS.trades.length,
      business: KEYWORDS.business.length
    }
  }
}
