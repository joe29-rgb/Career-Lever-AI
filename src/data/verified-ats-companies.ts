/**
 * VERIFIED ATS COMPANIES
 * 
 * Companies with VERIFIED working ATS slugs
 * These are confirmed to have public APIs with active job postings
 * 
 * Source: Perplexity research + manual verification
 */

interface VerifiedATSCompany {
  name: string
  slug: string
  ats: 'greenhouse' | 'lever' | 'workable' | 'ashby' | 'bamboohr'
  location: string
  industry: string
  verified: boolean
}

export const VERIFIED_ATS_COMPANIES: VerifiedATSCompany[] = [
  // ========================================
  // GREENHOUSE (Verified Working)
  // ========================================
  {
    name: 'Shopify',
    slug: 'shopify',
    ats: 'greenhouse',
    location: 'Toronto/Ottawa',
    industry: 'Tech',
    verified: true
  },
  {
    name: 'Wealthsimple',
    slug: 'wealthsimple',
    ats: 'greenhouse',
    location: 'Toronto',
    industry: 'Fintech',
    verified: true
  },
  {
    name: 'Lightspeed Commerce',
    slug: 'lightspeedcommerce',
    ats: 'greenhouse',
    location: 'Montreal',
    industry: 'Tech',
    verified: true
  },
  {
    name: 'Hootsuite',
    slug: 'hootsuite',
    ats: 'greenhouse',
    location: 'Vancouver',
    industry: 'Tech',
    verified: true
  },
  {
    name: 'Ritual',
    slug: 'ritual',
    ats: 'greenhouse',
    location: 'Toronto',
    industry: 'Health Tech',
    verified: true
  },
  {
    name: 'Faire',
    slug: 'faire',
    ats: 'greenhouse',
    location: 'Toronto',
    industry: 'E-commerce',
    verified: true
  },
  {
    name: 'Clearco',
    slug: 'clearbanc',
    ats: 'greenhouse',
    location: 'Toronto',
    industry: 'Fintech',
    verified: true
  },
  {
    name: 'Properly',
    slug: 'properly',
    ats: 'greenhouse',
    location: 'Toronto',
    industry: 'Real Estate Tech',
    verified: true
  },
  {
    name: 'Wattpad',
    slug: 'wattpad',
    ats: 'greenhouse',
    location: 'Toronto',
    industry: 'Media Tech',
    verified: true
  },
  {
    name: 'FreshBooks',
    slug: 'freshbooks',
    ats: 'greenhouse',
    location: 'Toronto',
    industry: 'SaaS',
    verified: true
  },
  
  // ========================================
  // LEVER (Verified Working)
  // ========================================
  {
    name: 'Slack',
    slug: 'slack',
    ats: 'lever',
    location: 'Toronto/Vancouver',
    industry: 'Tech',
    verified: true
  },
  {
    name: 'Stripe',
    slug: 'stripe',
    ats: 'lever',
    location: 'Toronto',
    industry: 'Fintech',
    verified: true
  },
  {
    name: 'Coinbase',
    slug: 'coinbase',
    ats: 'lever',
    location: 'Remote',
    industry: 'Crypto',
    verified: true
  },
  {
    name: 'Twilio',
    slug: 'twilio',
    ats: 'lever',
    location: 'Remote',
    industry: 'Tech',
    verified: true
  },
  {
    name: 'Affirm',
    slug: 'affirm',
    ats: 'lever',
    location: 'Remote',
    industry: 'Fintech',
    verified: true
  },
  
  // ========================================
  // WORKABLE (Verified Working)
  // ========================================
  {
    name: 'Bench Accounting',
    slug: 'bench',
    ats: 'workable',
    location: 'Vancouver',
    industry: 'Fintech',
    verified: true
  },
  {
    name: 'Vendasta',
    slug: 'vendasta',
    ats: 'workable',
    location: 'Saskatoon',
    industry: 'SaaS',
    verified: true
  },
  {
    name: 'Jobber',
    slug: 'getjobber',
    ats: 'workable',
    location: 'Edmonton',
    industry: 'SaaS',
    verified: true
  },
  
  // ========================================
  // ASHBY (Verified Working)
  // ========================================
  {
    name: 'Ramp',
    slug: 'ramp',
    ats: 'ashby',
    location: 'Remote',
    industry: 'Fintech',
    verified: true
  },
  {
    name: 'Watershed',
    slug: 'watershed',
    ats: 'ashby',
    location: 'Remote',
    industry: 'Climate Tech',
    verified: true
  }
]

/**
 * Get all verified companies
 */
export function getVerifiedCompanies(): VerifiedATSCompany[] {
  return VERIFIED_ATS_COMPANIES.filter(c => c.verified)
}

/**
 * Get companies by ATS
 */
export function getVerifiedCompaniesByATS(ats: string): VerifiedATSCompany[] {
  return VERIFIED_ATS_COMPANIES.filter(c => c.ats === ats && c.verified)
}

/**
 * Get Canadian companies only
 */
export function getCanadianCompanies(): VerifiedATSCompany[] {
  const canadianCities = ['Toronto', 'Montreal', 'Vancouver', 'Ottawa', 'Edmonton', 'Calgary', 'Saskatoon', 'Waterloo']
  return VERIFIED_ATS_COMPANIES.filter(c => 
    canadianCities.some(city => c.location.includes(city))
  )
}

/**
 * Statistics
 */
export function getVerifiedStats() {
  return {
    total: VERIFIED_ATS_COMPANIES.length,
    greenhouse: getVerifiedCompaniesByATS('greenhouse').length,
    lever: getVerifiedCompaniesByATS('lever').length,
    workable: getVerifiedCompaniesByATS('workable').length,
    ashby: getVerifiedCompaniesByATS('ashby').length,
    canadian: getCanadianCompanies().length
  }
}
