/**
 * Public Job Boards Configuration
 * 
 * This configuration includes ONLY job boards with:
 * 1. Public listings that can be scraped via Perplexity
 * 2. Open APIs that don't require partnerships
 * 3. ATS platforms with public job feeds
 * 
 * Based on October 2025 accessibility research
 */

export type JobBoardAccessType = 
  | 'public-api'           // Has open public API
  | 'ats-public'          // ATS with public job feeds
  | 'scraping-allowed'    // Public listings, scraping via Perplexity
  | 'government-open'     // Government job board with open data

export interface PublicJobBoardConfig {
  name: string
  displayName: string
  country: string
  accessType: JobBoardAccessType
  scrapingConfig?: {
    baseUrl: string
    searchUrl: string
    perplexityQuery: string
    canUsePerplexity: boolean
  }
  apiConfig?: {
    baseUrl: string
    requiresAuth: boolean
    authType?: 'api-key' | 'oauth' | 'none'
    documentation?: string
  }
  features: {
    canDiscoverJobs: boolean
    canApplyDirectly: boolean
    estimatedJobCount: string
    updateFrequency: string
  }
}

/**
 * CANADIAN JOB BOARDS - Priority for your target market
 */
export const CANADIAN_JOB_BOARDS: Record<string, PublicJobBoardConfig> = {
  jobbank: {
    name: 'jobbank',
    displayName: 'Job Bank Canada',
    country: 'Canada',
    accessType: 'government-open',
    scrapingConfig: {
      baseUrl: 'https://www.jobbank.gc.ca',
      searchUrl: 'https://www.jobbank.gc.ca/jobsearch/jobsearch',
      perplexityQuery: 'site:jobbank.gc.ca "{keywords}" "{location}" after:2024-01-01',
      canUsePerplexity: true
    },
    apiConfig: {
      baseUrl: 'https://www.jobbank.gc.ca',
      requiresAuth: false,
      authType: 'none',
      documentation: 'https://www.jobbank.gc.ca/content_pieces-eng.do?cid=8524'
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false, // Redirects to employer sites
      estimatedJobCount: '100,000+',
      updateFrequency: 'Daily'
    }
  },

  jobboom: {
    name: 'jobboom',
    displayName: 'Jobboom',
    country: 'Canada',
    accessType: 'scraping-allowed',
    scrapingConfig: {
      baseUrl: 'https://www.jobboom.com',
      searchUrl: 'https://www.jobboom.com/en/job-search',
      perplexityQuery: 'site:jobboom.com "{keywords}" "{location}" after:2024-01-01',
      canUsePerplexity: true
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '50,000+',
      updateFrequency: 'Daily'
    }
  },

  workopolis: {
    name: 'workopolis',
    displayName: 'Workopolis',
    country: 'Canada',
    accessType: 'scraping-allowed',
    scrapingConfig: {
      baseUrl: 'https://www.workopolis.com',
      searchUrl: 'https://www.workopolis.com/jobsearch/jobs',
      perplexityQuery: 'site:workopolis.com "{keywords}" "{location}" after:2024-01-01',
      canUsePerplexity: true
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '30,000+',
      updateFrequency: 'Daily'
    }
  },

  jooble: {
    name: 'jooble',
    displayName: 'Jooble Canada',
    country: 'Canada',
    accessType: 'public-api',
    apiConfig: {
      baseUrl: 'https://ca.jooble.org/api',
      requiresAuth: true,
      authType: 'api-key',
      documentation: 'https://jooble.org/api/about'
    },
    scrapingConfig: {
      baseUrl: 'https://ca.jooble.org',
      searchUrl: 'https://ca.jooble.org/search',
      perplexityQuery: 'site:ca.jooble.org "{keywords}" "{location}" after:2024-01-01',
      canUsePerplexity: true
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '100,000+',
      updateFrequency: 'Daily'
    }
  },

  indeedca: {
    name: 'indeedca',
    displayName: 'Indeed Canada',
    country: 'Canada',
    accessType: 'scraping-allowed',
    scrapingConfig: {
      baseUrl: 'https://ca.indeed.com',
      searchUrl: 'https://ca.indeed.com/jobs',
      perplexityQuery: 'site:ca.indeed.com "{keywords}" "{location}" after:2024-01-01',
      canUsePerplexity: true
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '500,000+',
      updateFrequency: 'Real-time'
    }
  },

  ziprecruiter_ca: {
    name: 'ziprecruiter_ca',
    displayName: 'ZipRecruiter Canada',
    country: 'Canada',
    accessType: 'scraping-allowed',
    scrapingConfig: {
      baseUrl: 'https://www.ziprecruiter.ca',
      searchUrl: 'https://www.ziprecruiter.ca/jobs-search',
      perplexityQuery: 'site:ziprecruiter.ca "{keywords}" "{location}" after:2024-01-01',
      canUsePerplexity: true
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '50,000+',
      updateFrequency: 'Daily'
    }
  },

  monster_ca: {
    name: 'monster_ca',
    displayName: 'Monster Canada',
    country: 'Canada',
    accessType: 'scraping-allowed',
    scrapingConfig: {
      baseUrl: 'https://www.monster.ca',
      searchUrl: 'https://www.monster.ca/jobs/search',
      perplexityQuery: 'site:monster.ca "{keywords}" "{location}" after:2024-01-01',
      canUsePerplexity: true
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '40,000+',
      updateFrequency: 'Daily'
    }
  },

  glassdoor_ca: {
    name: 'glassdoor_ca',
    displayName: 'Glassdoor Canada',
    country: 'Canada',
    accessType: 'scraping-allowed',
    scrapingConfig: {
      baseUrl: 'https://www.glassdoor.ca',
      searchUrl: 'https://www.glassdoor.ca/Job/jobs.htm',
      perplexityQuery: 'site:glassdoor.ca/Job "{keywords}" "{location}" after:2024-01-01',
      canUsePerplexity: true
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '100,000+',
      updateFrequency: 'Daily'
    }
  },

  dice_ca: {
    name: 'dice_ca',
    displayName: 'Dice Canada',
    country: 'Canada',
    accessType: 'scraping-allowed',
    scrapingConfig: {
      baseUrl: 'https://www.dice.com',
      searchUrl: 'https://www.dice.com/jobs',
      perplexityQuery: 'site:dice.com "{keywords}" Canada after:2024-01-01',
      canUsePerplexity: true
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '20,000+',
      updateFrequency: 'Daily'
    }
  }
}

/**
 * MAJOR JOB BOARDS - Public listings only (no direct API access)
 */
export const MAJOR_JOB_BOARDS: Record<string, PublicJobBoardConfig> = {
  linkedin: {
    name: 'linkedin',
    displayName: 'LinkedIn',
    country: 'Global',
    accessType: 'scraping-allowed',
    scrapingConfig: {
      baseUrl: 'https://www.linkedin.com',
      searchUrl: 'https://www.linkedin.com/jobs/search',
      perplexityQuery: 'site:linkedin.com/jobs "{keywords}" "{location}" after:2024-01-01',
      canUsePerplexity: true
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false, // Requires frontend automation
      estimatedJobCount: '20M+',
      updateFrequency: 'Real-time'
    }
  },

  indeed: {
    name: 'indeed',
    displayName: 'Indeed Canada',
    country: 'Canada',
    accessType: 'scraping-allowed',
    scrapingConfig: {
      baseUrl: 'https://ca.indeed.com',
      searchUrl: 'https://ca.indeed.com/jobs',
      perplexityQuery: 'site:ca.indeed.com "{keywords}" "{location}" after:2024-01-01',
      canUsePerplexity: true
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '5M+',
      updateFrequency: 'Real-time'
    }
  },

  glassdoor: {
    name: 'glassdoor',
    displayName: 'Glassdoor',
    country: 'Global',
    accessType: 'scraping-allowed',
    scrapingConfig: {
      baseUrl: 'https://www.glassdoor.ca',
      searchUrl: 'https://www.glassdoor.ca/Job/jobs.htm',
      perplexityQuery: 'site:glassdoor.ca/Job "{keywords}" "{location}" after:2024-01-01',
      canUsePerplexity: true
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '2M+',
      updateFrequency: 'Daily'
    }
  }
}

/**
 * OPEN API JOB BOARDS - Require API keys but are publicly accessible
 */
export const OPEN_API_BOARDS: Record<string, PublicJobBoardConfig> = {
  usajobs: {
    name: 'usajobs',
    displayName: 'USAJobs',
    country: 'United States',
    accessType: 'public-api',
    apiConfig: {
      baseUrl: 'https://data.usajobs.gov/api',
      requiresAuth: true,
      authType: 'api-key',
      documentation: 'https://developer.usajobs.gov'
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '500K+',
      updateFrequency: 'Real-time'
    }
  },

  adzuna: {
    name: 'adzuna',
    displayName: 'Adzuna',
    country: 'Global',
    accessType: 'public-api',
    apiConfig: {
      baseUrl: 'https://api.adzuna.com/v1/api',
      requiresAuth: true,
      authType: 'api-key',
      documentation: 'https://developer.adzuna.com/docs'
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '10M+',
      updateFrequency: 'Real-time'
    }
  },

  careerjet: {
    name: 'careerjet',
    displayName: 'Careerjet',
    country: 'Global',
    accessType: 'public-api',
    apiConfig: {
      baseUrl: 'https://public-api.careerjet.com',
      requiresAuth: true,
      authType: 'api-key',
      documentation: 'https://www.careerjet.com/partners/api/'
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '20M+',
      updateFrequency: 'Real-time'
    }
  }
}

/**
 * ATS PLATFORMS - Public job feeds from company career pages
 */
export const ATS_PLATFORMS: Record<string, PublicJobBoardConfig> = {
  greenhouse: {
    name: 'greenhouse',
    displayName: 'Greenhouse ATS',
    country: 'Global',
    accessType: 'ats-public',
    apiConfig: {
      baseUrl: 'https://api.greenhouse.io/v1/boards',
      requiresAuth: false,
      authType: 'none',
      documentation: 'https://developers.greenhouse.io/job-board.html'
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '200K+',
      updateFrequency: 'Real-time'
    }
  },

  lever: {
    name: 'lever',
    displayName: 'Lever ATS',
    country: 'Global',
    accessType: 'ats-public',
    apiConfig: {
      baseUrl: 'https://api.lever.co/v0/postings',
      requiresAuth: false,
      authType: 'none',
      documentation: 'https://github.com/lever/postings-api'
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '150K+',
      updateFrequency: 'Real-time'
    }
  },

  workable: {
    name: 'workable',
    displayName: 'Workable ATS',
    country: 'Global',
    accessType: 'ats-public',
    apiConfig: {
      baseUrl: 'https://apply.workable.com/api/v1/widget/accounts',
      requiresAuth: false,
      authType: 'none',
      documentation: 'https://workable.readme.io/reference/job-board-api'
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '100K+',
      updateFrequency: 'Real-time'
    }
  },

  ashby: {
    name: 'ashby',
    displayName: 'Ashby ATS',
    country: 'Global',
    accessType: 'ats-public',
    apiConfig: {
      baseUrl: 'https://api.ashbyhq.com/posting-api/job-board',
      requiresAuth: false,
      authType: 'none',
      documentation: 'https://developers.ashbyhq.com/reference/postingapi'
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '50K+',
      updateFrequency: 'Real-time'
    }
  },

  recruitee: {
    name: 'recruitee',
    displayName: 'Recruitee ATS',
    country: 'Global',
    accessType: 'ats-public',
    apiConfig: {
      baseUrl: 'https://{company}.recruitee.com/api/offers',
      requiresAuth: false,
      authType: 'none',
      documentation: 'https://developers.recruitee.com'
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '30K+',
      updateFrequency: 'Real-time'
    }
  },

  jooble_api: {
    name: 'jooble_api',
    displayName: 'Jooble API',
    country: 'Global',
    accessType: 'public-api',
    apiConfig: {
      baseUrl: 'https://jooble.org/api',
      requiresAuth: true,
      authType: 'api-key',
      documentation: 'https://jooble.org/api/about'
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '5M+',
      updateFrequency: 'Real-time'
    }
  },

  careerjet_ca: {
    name: 'careerjet_ca',
    displayName: 'Careerjet Canada',
    country: 'Canada',
    accessType: 'public-api',
    apiConfig: {
      baseUrl: 'https://public-api.careerjet.ca/search',
      requiresAuth: true,
      authType: 'api-key',
      documentation: 'https://www.careerjet.com/partners/api/'
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      estimatedJobCount: '200K+',
      updateFrequency: 'Real-time'
    }
  }
}

/**
 * ALL PUBLIC JOB BOARDS - Combined configuration
 */
export const ALL_PUBLIC_BOARDS = {
  ...CANADIAN_JOB_BOARDS,
  ...MAJOR_JOB_BOARDS,
  ...OPEN_API_BOARDS,
  ...ATS_PLATFORMS
}

/**
 * Get boards by access type
 */
export function getBoardsByAccessType(accessType: JobBoardAccessType): PublicJobBoardConfig[] {
  return Object.values(ALL_PUBLIC_BOARDS).filter(board => board.accessType === accessType)
}

/**
 * Get Canadian boards only
 */
export function getCanadianBoards(): PublicJobBoardConfig[] {
  return Object.values(ALL_PUBLIC_BOARDS).filter(board => board.country === 'Canada')
}

/**
 * Get boards that can be scraped via Perplexity
 */
export function getPerplexityScrapableBoards(): PublicJobBoardConfig[] {
  return Object.values(ALL_PUBLIC_BOARDS).filter(
    board => board.scrapingConfig?.canUsePerplexity
  )
}

/**
 * Get boards with open APIs
 */
export function getOpenAPIBoards(): PublicJobBoardConfig[] {
  return Object.values(ALL_PUBLIC_BOARDS).filter(
    board => board.apiConfig && !board.apiConfig.requiresAuth
  )
}

/**
 * Priority order for job discovery
 * (Canadian boards first, then major boards, then open APIs)
 */
export const DISCOVERY_PRIORITY_ORDER = [
  'jobbank',         // Canada government (highest priority)
  'jobboom',         // Canadian bilingual
  'workopolis',      // Canadian
  'jooble',          // Canadian job aggregator
  'indeedca',        // Indeed Canada (major board)
  'careerjet_ca',    // Careerjet Canada
  'ziprecruiter_ca', // ZipRecruiter Canada
  'monster_ca',      // Monster Canada
  'glassdoor_ca',    // Glassdoor Canada
  'dice_ca',         // Dice Canada (tech jobs)
  'linkedin',        // LinkedIn (global)
  'indeed',          // Indeed (global)
  'glassdoor',       // Glassdoor (global)
  'greenhouse',      // ATS platform
  'lever',           // ATS platform
  'workable',        // ATS platform
  'recruitee',       // ATS platform
  'ashby',           // ATS platform
  'adzuna',          // Open API aggregator
  'jooble_api',      // Jooble API
  'careerjet',       // Open API aggregator (global)
  'usajobs'          // Government (US)
]

/**
 * Companies using specific ATS platforms (curated list)
 */
export const ATS_COMPANY_DIRECTORY = {
  greenhouse: [
    'airbnb', 'pinterest', 'coinbase', 'robinhood', 'gitlab',
    'doordash', 'figma', 'notion', 'airtable', 'segment',
    'datadog', 'plaid', 'contentful', 'grammarly', 'flexport'
  ],
  lever: [
    'netflix', 'uber', 'spotify', 'postmates', 'box',
    'shopify', 'canva', 'discord', 'coda', 'superhuman',
    'vercel', 'linear', 'mercury', 'ramp', 'brex'
  ],
  workable: [
    'beat', 'workable', 'instacar', 'skroutz', 'persado',
    'epignosis', 'goodvidio', 'scytl', 'quality-unit', 'omnisend'
  ],
  ashby: [
    'ashby', 'descript', 'runway', 'scale', 'ramp',
    'mercury', 'lattice', 'compound', 'rippling', 'scale'
  ],
  recruitee: [
    'recruitee', 'bynder', 'catawiki', 'sendcloud', 'mollie',
    'peak', 'channable', 'trengo', 'effectory', 'piggy'
  ]
}

/**
 * Canadian companies using ATS platforms
 */
export const CANADIAN_ATS_COMPANIES = {
  greenhouse: [
    'shopify', 'hootsuite', 'wealthsimple', 'faire', 'thinkific',
    'lightspeed', 'financeit', 'later', 'clickup', 'copperleaf'
  ],
  lever: [
    'slack', 'wealthsimple', 'hootsuite', 'shopify', 'bench',
    'clio', 'clearco', 'flashfood', 'league', 'properly'
  ],
  workable: [
    'freshbooks', 'visier', 'unbounce', 'axonify', 'crowdriff',
    'soapbox', 'klue', 'samdesk', 'coinsquare', 'tulip'
  ],
  recruitee: [
    'paytm', 'ecobee', 'geotab', 'auvik', 'alida',
    'miovision', 'nulogy', 'ritual', 'wave', 'koho'
  ],
  ashby: [
    'faire', 'clearco', 'notion', 'part', 'properly',
    'district', 'maple', 'borrowell', 'league', 'shakepay'
  ]
}

