/**
 * ALBERTA TOP COMPANIES DATABASE
 * 
 * Top 100 Alberta employers mapped to their ATS platforms
 * Based on: Canada's Top 100, Alberta's Top Employers 2025
 * 
 * Sources:
 * - Edmonton's Top Workplaces 2025
 * - Alberta's Top Employers 2025
 * - Canada's Top 100 Employers
 */

interface ATSCompany {
  name: string
  slug: string
  ats: 'greenhouse' | 'lever' | 'workable' | 'ashby' | 'bamboohr' | 'workday' | 'custom'
  location: string
  industry: string
  estimatedJobs: number
}

export const ALBERTA_COMPANIES: ATSCompany[] = [
  // ========================================
  // GREENHOUSE USERS (Tech, Startups, Mid-Market)
  // ========================================
  {
    name: 'PCL Construction',
    slug: 'pcl',
    ats: 'greenhouse',
    location: 'Edmonton',
    industry: 'Construction',
    estimatedJobs: 50
  },
  {
    name: 'ATB Financial',
    slug: 'atbfinancial',
    ats: 'greenhouse',
    location: 'Edmonton',
    industry: 'Financial Services',
    estimatedJobs: 45
  },
  {
    name: 'Parkland Corporation',
    slug: 'parkland',
    ats: 'greenhouse',
    location: 'Calgary',
    industry: 'Energy',
    estimatedJobs: 40
  },
  {
    name: 'Absorb Software',
    slug: 'absorbsoftware',
    ats: 'greenhouse',
    location: 'Calgary',
    industry: 'Tech',
    estimatedJobs: 25
  },
  {
    name: 'BluEarth Renewables',
    slug: 'bluearthrenewables',
    ats: 'greenhouse',
    location: 'Calgary',
    industry: 'Renewable Energy',
    estimatedJobs: 20
  },
  
  // ========================================
  // LEVER USERS (Mid-Market, Tech)
  // ========================================
  {
    name: 'EPCOR Utilities',
    slug: 'epcor',
    ats: 'lever',
    location: 'Edmonton',
    industry: 'Utilities',
    estimatedJobs: 40
  },
  
  // ========================================
  // WORKABLE USERS (SMBs)
  // ========================================
  {
    name: 'Bird Construction',
    slug: 'birdconstruction',
    ats: 'workable',
    location: 'Calgary',
    industry: 'Construction',
    estimatedJobs: 30
  },
  {
    name: 'Dialog',
    slug: 'dialog',
    ats: 'workable',
    location: 'Calgary',
    industry: 'Engineering',
    estimatedJobs: 25
  },
  {
    name: 'Orennia',
    slug: 'orennia',
    ats: 'workable',
    location: 'Calgary',
    industry: 'Tech',
    estimatedJobs: 15
  },
  
  // ========================================
  // ASHBY USERS (Tech Startups)
  // ========================================
  {
    name: 'NovAtel',
    slug: 'novatel',
    ats: 'ashby',
    location: 'Calgary',
    industry: 'Tech',
    estimatedJobs: 20
  },
  
  // ========================================
  // WORKDAY USERS (Large Enterprises)
  // Note: Workday requires OAuth, but listing for completeness
  // ========================================
  {
    name: 'Suncor Energy',
    slug: 'suncor',
    ats: 'workday',
    location: 'Calgary',
    industry: 'Oil & Gas',
    estimatedJobs: 50
  },
  {
    name: 'Shell Canada',
    slug: 'shell',
    ats: 'workday',
    location: 'Calgary',
    industry: 'Oil & Gas',
    estimatedJobs: 45
  },
  {
    name: 'Imperial Oil',
    slug: 'imperialoil',
    ats: 'workday',
    location: 'Calgary',
    industry: 'Oil & Gas',
    estimatedJobs: 40
  },
  {
    name: 'Canadian Natural Resources',
    slug: 'cnrl',
    ats: 'workday',
    location: 'Calgary',
    industry: 'Oil & Gas',
    estimatedJobs: 35
  },
  {
    name: 'Enbridge',
    slug: 'enbridge',
    ats: 'workday',
    location: 'Calgary',
    industry: 'Energy',
    estimatedJobs: 40
  },
  {
    name: 'Cenovus Energy',
    slug: 'cenovus',
    ats: 'workday',
    location: 'Calgary',
    industry: 'Oil & Gas',
    estimatedJobs: 30
  },
  {
    name: 'TransCanada (TC Energy)',
    slug: 'tcenergy',
    ats: 'workday',
    location: 'Calgary',
    industry: 'Energy',
    estimatedJobs: 35
  },
  {
    name: 'Alberta Health Services',
    slug: 'albertahealthservices',
    ats: 'workday',
    location: 'Edmonton',
    industry: 'Healthcare',
    estimatedJobs: 500
  },
  {
    name: 'University of Alberta',
    slug: 'ualberta',
    ats: 'workday',
    location: 'Edmonton',
    industry: 'Education',
    estimatedJobs: 80
  },
  {
    name: 'University of Calgary',
    slug: 'ucalgary',
    ats: 'workday',
    location: 'Calgary',
    industry: 'Education',
    estimatedJobs: 75
  },
  {
    name: 'City of Edmonton',
    slug: 'edmonton',
    ats: 'workday',
    location: 'Edmonton',
    industry: 'Government',
    estimatedJobs: 60
  },
  {
    name: 'City of Calgary',
    slug: 'calgary',
    ats: 'workday',
    location: 'Calgary',
    industry: 'Government',
    estimatedJobs: 65
  },
  {
    name: 'Stantec',
    slug: 'stantec',
    ats: 'workday',
    location: 'Edmonton',
    industry: 'Engineering',
    estimatedJobs: 60
  },
  {
    name: 'Pembina Pipeline',
    slug: 'pembina',
    ats: 'workday',
    location: 'Calgary',
    industry: 'Energy',
    estimatedJobs: 25
  },
  
  // ========================================
  // CUSTOM ATS (Need to check career pages)
  // ========================================
  {
    name: 'ENMAX',
    slug: 'enmax',
    ats: 'custom',
    location: 'Calgary',
    industry: 'Utilities',
    estimatedJobs: 35
  },
  {
    name: 'WestJet',
    slug: 'westjet',
    ats: 'custom',
    location: 'Calgary',
    industry: 'Aviation',
    estimatedJobs: 100
  },
  {
    name: 'Alberta Blue Cross',
    slug: 'albertabluecross',
    ats: 'custom',
    location: 'Edmonton',
    industry: 'Insurance',
    estimatedJobs: 30
  },
  {
    name: 'Covenant Health',
    slug: 'covenanthealth',
    ats: 'custom',
    location: 'Edmonton',
    industry: 'Healthcare',
    estimatedJobs: 150
  },
  {
    name: 'NAIT',
    slug: 'nait',
    ats: 'custom',
    location: 'Edmonton',
    industry: 'Education',
    estimatedJobs: 40
  },
  {
    name: 'SAIT',
    slug: 'sait',
    ats: 'custom',
    location: 'Calgary',
    industry: 'Education',
    estimatedJobs: 35
  },
  {
    name: 'MacEwan University',
    slug: 'macewan',
    ats: 'custom',
    location: 'Edmonton',
    industry: 'Education',
    estimatedJobs: 30
  }
]

/**
 * Get companies by ATS platform
 */
export function getCompaniesByATS(ats: string): ATSCompany[] {
  return ALBERTA_COMPANIES.filter(c => c.ats === ats)
}

/**
 * Get companies that have public APIs (no auth required)
 */
export function getPublicAPICompanies(): ATSCompany[] {
  return ALBERTA_COMPANIES.filter(c => 
    c.ats === 'greenhouse' || 
    c.ats === 'lever' || 
    c.ats === 'workable' || 
    c.ats === 'ashby'
  )
}

/**
 * Get estimated total jobs
 */
export function getEstimatedTotalJobs(): number {
  return ALBERTA_COMPANIES.reduce((sum, c) => sum + c.estimatedJobs, 0)
}

/**
 * Statistics
 */
export function getStats() {
  const byATS = {
    greenhouse: getCompaniesByATS('greenhouse').length,
    lever: getCompaniesByATS('lever').length,
    workable: getCompaniesByATS('workable').length,
    ashby: getCompaniesByATS('ashby').length,
    workday: getCompaniesByATS('workday').length,
    custom: getCompaniesByATS('custom').length
  }
  
  const publicAPICompanies = getPublicAPICompanies()
  const estimatedPublicAPIJobs = publicAPICompanies.reduce((sum, c) => sum + c.estimatedJobs, 0)
  
  return {
    totalCompanies: ALBERTA_COMPANIES.length,
    byATS,
    publicAPICompanies: publicAPICompanies.length,
    estimatedTotalJobs: getEstimatedTotalJobs(),
    estimatedPublicAPIJobs
  }
}
