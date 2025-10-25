/**
 * COMPREHENSIVE JOB BOARDS + CONTACT SOURCES
 * Production-ready with all Canadian & Global boards
 */

export interface JobBoardSource {
  name: string
  baseUrl: string
  searchUrl: (title: string, location: string) => string
  priority: 1 | 2 | 3 // 1 = highest
  requiresAuth: boolean
  rateLimitPerMin: number
  scrapeSupport: 'easy' | 'medium' | 'hard' // Cheerio difficulty
}

export interface ContactSource {
  name: string
  baseUrl: string
  searchPattern: (company: string) => string
  reliability: number // 0-1
  requiresAuth: boolean
  apiKey?: string
}

// ========================================
// JOB BOARDS (15+ SOURCES)
// ========================================

export const COMPREHENSIVE_JOB_BOARDS: JobBoardSource[] = [
  // TIER 1: Canadian Priority Boards
  {
    name: 'Indeed Canada',
    baseUrl: 'https://ca.indeed.com',
    searchUrl: (title, location) => 
      `https://ca.indeed.com/jobs?q=${encodeURIComponent(title)}&l=${encodeURIComponent(location)}&sort=date&fromage=7`,
    priority: 1,
    requiresAuth: false,
    rateLimitPerMin: 60,
    scrapeSupport: 'easy'
  },
  {
    name: 'LinkedIn Jobs',
    baseUrl: 'https://www.linkedin.com',
    searchUrl: (title, location) => 
      `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}&f_TPR=r86400&sortBy=DD`,
    priority: 1,
    requiresAuth: false,
    rateLimitPerMin: 30,
    scrapeSupport: 'medium'
  },
  {
    name: 'Job Bank Canada',
    baseUrl: 'https://www.jobbank.gc.ca',
    searchUrl: (title, location) => 
      `https://www.jobbank.gc.ca/jobsearch/jobsearch?fjob=${encodeURIComponent(title)}&floc=${encodeURIComponent(location)}&sort=D`,
    priority: 1,
    requiresAuth: false,
    rateLimitPerMin: 60,
    scrapeSupport: 'easy'
  },
  {
    name: 'Workopolis',
    baseUrl: 'https://www.workopolis.com',
    searchUrl: (title, location) => 
      `https://www.workopolis.com/jobsearch/find-jobs?ak=${encodeURIComponent(title)}&l=${encodeURIComponent(location)}`,
    priority: 1,
    requiresAuth: false,
    rateLimitPerMin: 60,
    scrapeSupport: 'easy'
  },
  {
    name: 'Eluta',
    baseUrl: 'https://www.eluta.ca',
    searchUrl: (title, location) => 
      `https://www.eluta.ca/search?q=${encodeURIComponent(title)}&l=${encodeURIComponent(location)}`,
    priority: 2,
    requiresAuth: false,
    rateLimitPerMin: 60,
    scrapeSupport: 'easy'
  },
  {
    name: 'Glassdoor Canada',
    baseUrl: 'https://www.glassdoor.ca',
    searchUrl: (title, location) => 
      `https://www.glassdoor.ca/Job/jobs.htm?sc.keyword=${encodeURIComponent(title)}&locT=C&locKeyword=${encodeURIComponent(location)}`,
    priority: 2,
    requiresAuth: false,
    rateLimitPerMin: 30,
    scrapeSupport: 'medium'
  },
  {
    name: 'Monster Canada',
    baseUrl: 'https://www.monster.ca',
    searchUrl: (title, location) => 
      `https://www.monster.ca/jobs/search?q=${encodeURIComponent(title)}&where=${encodeURIComponent(location)}`,
    priority: 2,
    requiresAuth: false,
    rateLimitPerMin: 60,
    scrapeSupport: 'easy'
  },
  {
    name: 'CareerBeacon',
    baseUrl: 'https://www.careerbeacon.com',
    searchUrl: (title, location) => 
      `https://www.careerbeacon.com/en/search?keywords=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}`,
    priority: 2,
    requiresAuth: false,
    rateLimitPerMin: 60,
    scrapeSupport: 'easy'
  },
  {
    name: 'Jobboom',
    baseUrl: 'https://www.jobboom.com',
    searchUrl: (title, location) => 
      `https://www.jobboom.com/en/job-search?keywords=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}`,
    priority: 2,
    requiresAuth: false,
    rateLimitPerMin: 60,
    scrapeSupport: 'easy'
  },
  {
    name: 'Communitech Work in Tech',
    baseUrl: 'https://www1.communitech.ca',
    searchUrl: (title, location) => 
      `https://www1.communitech.ca/work-in-tech?search=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}`,
    priority: 2,
    requiresAuth: false,
    rateLimitPerMin: 60,
    scrapeSupport: 'easy'
  },

  // TIER 2: Tech-Specific Boards
  {
    name: 'AngelList Talent',
    baseUrl: 'https://wellfound.com',
    searchUrl: (title, location) => 
      `https://wellfound.com/jobs?q=${encodeURIComponent(title)}&l=${encodeURIComponent(location)}`,
    priority: 2,
    requiresAuth: false,
    rateLimitPerMin: 30,
    scrapeSupport: 'medium'
  },
  {
    name: 'Dice',
    baseUrl: 'https://www.dice.com',
    searchUrl: (title, location) => 
      `https://www.dice.com/jobs?q=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}&radius=30&radiusUnit=mi&page=1&pageSize=20&language=en`,
    priority: 3,
    requiresAuth: false,
    rateLimitPerMin: 60,
    scrapeSupport: 'easy'
  },
  {
    name: 'Stack Overflow Jobs',
    baseUrl: 'https://stackoverflow.com/jobs',
    searchUrl: (title, location) => 
      `https://stackoverflow.com/jobs?q=${encodeURIComponent(title)}&l=${encodeURIComponent(location)}`,
    priority: 3,
    requiresAuth: false,
    rateLimitPerMin: 60,
    scrapeSupport: 'medium'
  },

  // TIER 3: ATS Direct Searches
  {
    name: 'Greenhouse Public Boards',
    baseUrl: 'https://boards.greenhouse.io',
    searchUrl: (title, location) => 
      `https://boards.greenhouse.io/embed/job_board?gh_jid=${encodeURIComponent(title)}`,
    priority: 3,
    requiresAuth: false,
    rateLimitPerMin: 120,
    scrapeSupport: 'easy'
  },
  {
    name: 'Lever Jobs',
    baseUrl: 'https://jobs.lever.co',
    searchUrl: (title, location) => 
      `https://jobs.lever.co/search?query=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}`,
    priority: 3,
    requiresAuth: false,
    rateLimitPerMin: 120,
    scrapeSupport: 'easy'
  }
]

// ========================================
// CONTACT SOURCES (10+ SOURCES)
// ========================================

export const COMPREHENSIVE_CONTACT_SOURCES: ContactSource[] = [
  {
    name: 'LinkedIn Company Search',
    baseUrl: 'https://www.linkedin.com',
    searchPattern: (company) => 
      `site:linkedin.com/in/ "${company}" (recruiter OR "talent acquisition" OR "human resources" OR "hiring manager")`,
    reliability: 0.95,
    requiresAuth: false
  },
  {
    name: 'LinkedIn Company Page',
    baseUrl: 'https://www.linkedin.com',
    searchPattern: (company) => 
      `site:linkedin.com/company/${company.toLowerCase().replace(/\s+/g, '-')} people`,
    reliability: 0.90,
    requiresAuth: false
  },
  {
    name: 'Company Careers Page',
    baseUrl: '',
    searchPattern: (company) => 
      `"${company}" (careers OR jobs OR "join our team") contact email`,
    reliability: 0.85,
    requiresAuth: false
  },
  {
    name: 'Hunter.io',
    baseUrl: 'https://hunter.io',
    searchPattern: (company) => 
      `${company.toLowerCase().replace(/\s+/g, '')}.com`,
    reliability: 0.80,
    requiresAuth: true,
    apiKey: process.env.HUNTER_API_KEY
  },
  {
    name: 'RocketReach',
    baseUrl: 'https://rocketreach.co',
    searchPattern: (company) => 
      `${company} recruiter`,
    reliability: 0.85,
    requiresAuth: true,
    apiKey: process.env.ROCKETREACH_API_KEY
  },
  {
    name: 'ContactOut',
    baseUrl: 'https://contactout.com',
    searchPattern: (company) => 
      `${company} hiring manager`,
    reliability: 0.80,
    requiresAuth: true
  },
  {
    name: 'Apollo.io',
    baseUrl: 'https://apollo.io',
    searchPattern: (company) => 
      `${company} talent acquisition`,
    reliability: 0.85,
    requiresAuth: true,
    apiKey: process.env.APOLLO_API_KEY
  },
  {
    name: 'Clearbit',
    baseUrl: 'https://clearbit.com',
    searchPattern: (company) => 
      `${company.toLowerCase().replace(/\s+/g, '')}.com`,
    reliability: 0.75,
    requiresAuth: true,
    apiKey: process.env.CLEARBIT_API_KEY
  },
  {
    name: 'ZoomInfo',
    baseUrl: 'https://www.zoominfo.com',
    searchPattern: (company) => 
      `${company} contacts`,
    reliability: 0.90,
    requiresAuth: true,
    apiKey: process.env.ZOOMINFO_API_KEY
  },
  {
    name: 'Lusha',
    baseUrl: 'https://www.lusha.com',
    searchPattern: (company) => 
      `${company} employees`,
    reliability: 0.75,
    requiresAuth: true
  }
]

// Helper: Get top N job boards by priority
export function getTopJobBoards(count: number = 10): JobBoardSource[] {
  return COMPREHENSIVE_JOB_BOARDS
    .sort((a, b) => a.priority - b.priority)
    .slice(0, count)
}

// Helper: Get all contact sources (free + paid)
export function getAllContactSources(includeAuth: boolean = false): ContactSource[] {
  return includeAuth 
    ? COMPREHENSIVE_CONTACT_SOURCES 
    : COMPREHENSIVE_CONTACT_SOURCES.filter(s => !s.requiresAuth)
}

// Helper: Get contact sources with API keys configured
export function getConfiguredContactSources(): ContactSource[] {
  return COMPREHENSIVE_CONTACT_SOURCES.filter(s => 
    !s.requiresAuth || (s.apiKey && s.apiKey.length > 0)
  )
}
