/**
 * Job Board Configuration - 20+ Canadian Sources
 * Tier-based ranking system with site: operators for Perplexity
 */

export interface JobBoard {
  name: string
  domain: string
  searchPattern: string
  tier: number
  coverage: string[]
  trust: number
  priority: number
}

export const JOB_BOARDS: Record<string, JobBoard> = {
  // TIER 1: Mega Boards (Highest Traffic)
  indeed: {
    name: 'Indeed Canada',
    domain: 'ca.indeed.com',
    searchPattern: 'site:ca.indeed.com/jobs',
    tier: 1,
    coverage: ['all'],
    trust: 95,
    priority: 1
  },
  linkedin: {
    name: 'LinkedIn Jobs',
    domain: 'linkedin.com',
    searchPattern: 'site:linkedin.com/jobs/search',
    tier: 1,
    coverage: ['professional', 'white-collar'],
    trust: 98,
    priority: 2
  },
  googleJobs: {
    name: 'Google for Jobs',
    domain: 'google.com',
    searchPattern: 'jobs near',
    tier: 1,
    coverage: ['all'],
    trust: 99,
    priority: 3
  },
  
  // TIER 2: Canadian Specific
  jobbank: {
    name: 'Job Bank Canada',
    domain: 'jobbank.gc.ca',
    searchPattern: 'site:jobbank.gc.ca',
    tier: 2,
    coverage: ['all', 'government'],
    trust: 99,
    priority: 4
  },
  workopolis: {
    name: 'Workopolis',
    domain: 'workopolis.com',
    searchPattern: 'site:workopolis.com/jobsearch',
    tier: 2,
    coverage: ['all'],
    trust: 92,
    priority: 5
  },
  eluta: {
    name: 'Eluta',
    domain: 'eluta.ca',
    searchPattern: 'site:eluta.ca',
    tier: 2,
    coverage: ['all'],
    trust: 88,
    priority: 6
  },
  glassdoor: {
    name: 'Glassdoor Canada',
    domain: 'glassdoor.ca',
    searchPattern: 'site:glassdoor.ca/Job',
    tier: 2,
    coverage: ['all'],
    trust: 91,
    priority: 7
  },
  jobboom: {
    name: 'Jobboom',
    domain: 'jobboom.com',
    searchPattern: 'site:jobboom.com',
    tier: 2,
    coverage: ['quebec', 'bilingual'],
    trust: 85,
    priority: 8
  },
  
  // TIER 3: Specialized
  monster: {
    name: 'Monster Canada',
    domain: 'monster.ca',
    searchPattern: 'site:monster.ca',
    tier: 3,
    coverage: ['all'],
    trust: 80,
    priority: 9
  },
  ziprecruiter: {
    name: 'ZipRecruiter',
    domain: 'ziprecruiter.com',
    searchPattern: 'site:ziprecruiter.com',
    tier: 3,
    coverage: ['all'],
    trust: 79,
    priority: 10
  },
  weWorkRemotely: {
    name: 'We Work Remotely',
    domain: 'weworkremotely.com',
    searchPattern: 'site:weworkremotely.com',
    tier: 3,
    coverage: ['remote'],
    trust: 87,
    priority: 11
  },
  stackOverflow: {
    name: 'Stack Overflow Jobs',
    domain: 'stackoverflow.com',
    searchPattern: 'site:stackoverflow.com/jobs',
    tier: 3,
    coverage: ['tech', 'development'],
    trust: 94,
    priority: 12
  },
  github: {
    name: 'GitHub Jobs',
    domain: 'github.com',
    searchPattern: 'site:github.com/jobs',
    tier: 3,
    coverage: ['tech', 'development'],
    trust: 93,
    priority: 13
  },
  
  // TIER 4: Niche
  constructionJobs: {
    name: 'Construction Jobs Canada',
    domain: 'constructionjobs.ca',
    searchPattern: 'site:constructionjobs.ca',
    tier: 4,
    coverage: ['trades', 'construction'],
    trust: 82,
    priority: 14
  },
  healthcareJobs: {
    name: 'Healthcare Jobs',
    domain: 'healthcarejobs.ca',
    searchPattern: 'site:healthcarejobs.ca',
    tier: 4,
    coverage: ['healthcare', 'nursing'],
    trust: 89,
    priority: 15
  },
  governmentJobs: {
    name: 'Government of Canada Jobs',
    domain: 'jobs.gc.ca',
    searchPattern: 'site:jobs.gc.ca',
    tier: 4,
    coverage: ['government', 'public-service'],
    trust: 99,
    priority: 16
  },
  
  // TIER 5: Emerging
  angelList: {
    name: 'Angel.co',
    domain: 'angel.co',
    searchPattern: 'site:angel.co/jobs',
    tier: 5,
    coverage: ['startup', 'tech'],
    trust: 75,
    priority: 17
  },
  remoteCo: {
    name: 'Remote.co',
    domain: 'remote.co',
    searchPattern: 'site:remote.co',
    tier: 5,
    coverage: ['remote', 'distributed'],
    trust: 80,
    priority: 18
  },
  flexJobs: {
    name: 'FlexJobs',
    domain: 'flexjobs.com',
    searchPattern: 'site:flexjobs.com',
    tier: 5,
    coverage: ['flexible', 'remote', 'part-time'],
    trust: 88,
    priority: 19
  }
}

/**
 * Get job boards by tier
 */
export function getJobBoardsByTier(tier: number): JobBoard[] {
  return Object.values(JOB_BOARDS).filter(board => board.tier === tier)
}

/**
 * Get top N job boards by priority
 */
export function getTopJobBoards(limit: number = 10): JobBoard[] {
  return Object.values(JOB_BOARDS)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit)
}

/**
 * Get job boards by coverage type
 */
export function getJobBoardsByCoverage(coverageType: string): JobBoard[] {
  return Object.values(JOB_BOARDS).filter(board => 
    board.coverage.includes(coverageType)
  )
}

/**
 * Generate site: operator search query for multiple boards
 */
export function generateSiteSearchQuery(
  jobTitle: string,
  location: string,
  boards: JobBoard[]
): string {
  return boards
    .map(board => `${board.searchPattern} "${jobTitle}" "${location}"`)
    .join(' OR ')
}

/**
 * Get all job board domains for validation
 */
export function getAllJobBoardDomains(): string[] {
  return Object.values(JOB_BOARDS).map(board => board.domain)
}
