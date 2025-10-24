/**
 * Job Board Data Sources
 * Comprehensive list of Canadian and international job boards
 */

export const CANADIAN_JOB_BOARDS_EXTENDED = [
  { name: 'Indeed Canada', url: 'indeed.ca', priority: 1, category: 'general' },
  { name: 'LinkedIn Jobs', url: 'linkedin.com/jobs', priority: 1, category: 'general' },
  { name: 'Job Bank', url: 'jobbank.gc.ca', priority: 1, category: 'government' },
  { name: 'Workopolis', url: 'workopolis.com', priority: 2, category: 'general' },
  { name: 'Eluta', url: 'eluta.ca', priority: 2, category: 'general' },
  { name: 'CareerBeacon', url: 'careerbeacon.com', priority: 2, category: 'regional' },
  { name: 'Jobboom', url: 'jobboom.com', priority: 2, category: 'bilingual' },
  { name: 'Communitech', url: 'communitech.ca/work-in-tech', priority: 3, category: 'tech' },
  { name: 'Tech in Motion', url: 'techinmotionevents.com/jobs/canada', priority: 3, category: 'tech' },
  { name: 'Charity Village', url: 'charityvillage.com', priority: 3, category: 'nonprofit' }
]

export const US_JOB_BOARDS = [
  { name: 'ZipRecruiter', url: 'ziprecruiter.com', priority: 1 },
  { name: 'Monster', url: 'monster.com', priority: 2 },
  { name: 'CareerBuilder', url: 'careerbuilder.com', priority: 2 },
  { name: 'SimplyHired', url: 'simplyhired.com', priority: 2 },
  { name: 'Glassdoor', url: 'glassdoor.com/Job', priority: 1 },
  { name: 'Dice', url: 'dice.com', priority: 2 },
  { name: 'Stack Overflow', url: 'stackoverflow.com/jobs', priority: 3 },
  { name: 'Wellfound', url: 'wellfound.com', priority: 2 }
]

export const REMOTE_JOB_BOARDS = [
  { name: 'Remote.co', url: 'remote.co' },
  { name: 'We Work Remotely', url: 'weworkremotely.com' },
  { name: 'FlexJobs', url: 'flexjobs.com' },
  { name: 'Remote OK', url: 'remoteok.io' }
]

/**
 * ATS Platform Detection and URL Patterns
 */
export const ATS_PLATFORMS = {
  greenhouse: {
    pattern: /greenhouse\.io|boards\.greenhouse/,
    urlFormat: 'boards.greenhouse.io/{company}',
    reliability: 0.95
  },
  lever: {
    pattern: /jobs\.lever\.co/,
    urlFormat: 'jobs.lever.co/{company}',
    reliability: 0.95
  },
  workable: {
    pattern: /apply\.workable\.com/,
    urlFormat: 'apply.workable.com/{company}',
    reliability: 0.90
  },
  breezy: {
    pattern: /breezy\.hr/,
    urlFormat: '{company}.breezy.hr',
    reliability: 0.90
  },
  bamboohr: {
    pattern: /bamboohr\.com\/jobs/,
    urlFormat: '{company}.bamboohr.com/jobs',
    reliability: 0.90
  },
  smartrecruiters: {
    pattern: /jobs\.smartrecruiters\.com/,
    urlFormat: 'jobs.smartrecruiters.com/{company}',
    reliability: 0.85
  },
  jobvite: {
    pattern: /jobs\.jobvite\.com/,
    urlFormat: 'jobs.jobvite.com/{company}',
    reliability: 0.85
  },
  icims: {
    pattern: /icims\.com\/jobs/,
    urlFormat: '{company}.icims.com/jobs',
    reliability: 0.85
  },
  taleo: {
    pattern: /taleo\.net/,
    urlFormat: '{company}.taleo.net/careersection',
    reliability: 0.80
  },
  workday: {
    pattern: /myworkdayjobs\.com/,
    urlFormat: '{company}.wd1.myworkdayjobs.com',
    reliability: 0.90
  }
}

/**
 * Detect which ATS platform a URL uses
 */
export function detectATS(url: string): string | null {
  for (const [name, config] of Object.entries(ATS_PLATFORMS)) {
    if (config.pattern.test(url)) {
      return name
    }
  }
  return null
}

/**
 * Get all job boards for a specific category
 */
export function getJobBoardsByCategory(category: 'tech' | 'general' | 'remote' | 'all' = 'all') {
  switch (category) {
    case 'tech':
      return CANADIAN_JOB_BOARDS_EXTENDED.filter(b => b.category === 'tech')
    case 'remote':
      return REMOTE_JOB_BOARDS
    case 'general':
      return CANADIAN_JOB_BOARDS_EXTENDED.filter(b => b.category === 'general')
    default:
      return [...CANADIAN_JOB_BOARDS_EXTENDED, ...US_JOB_BOARDS, ...REMOTE_JOB_BOARDS]
  }
}
