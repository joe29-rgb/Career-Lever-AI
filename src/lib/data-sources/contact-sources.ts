/**
 * Hiring Contact Data Sources
 * Comprehensive list of sources for finding verified hiring contacts
 */

export const CONTACT_DATA_SOURCES = {
  tier1: [
    {
      name: 'LinkedIn',
      url: 'linkedin.com/in',
      searchPattern: 'site:linkedin.com/in "{company}" "{role}"',
      reliability: 0.95,
      requiresAuth: false
    },
    {
      name: 'Company Careers Page',
      urlPatterns: ['/team', '/about/team', '/people', '/leadership', '/about-us', '/careers/team'],
      reliability: 0.90,
      requiresAuth: false
    },
    {
      name: 'ContactOut',
      url: 'contactout.com/company',
      reliability: 0.85,
      requiresAuth: true
    },
    {
      name: 'RocketReach',
      url: 'rocketreach.co',
      reliability: 0.85,
      requiresAuth: true
    }
  ],
  tier2: [
    {
      name: 'Hunter.io',
      url: 'hunter.io/companies',
      reliability: 0.75,
      requiresAuth: true
    },
    {
      name: 'Apollo.io',
      url: 'apollo.io',
      reliability: 0.80,
      requiresAuth: true
    },
    {
      name: 'Clearbit',
      url: 'clearbit.com',
      reliability: 0.75,
      requiresAuth: true
    },
    {
      name: 'SignalHire',
      url: 'signalhire.com',
      reliability: 0.70,
      requiresAuth: true
    }
  ],
  tier3: [
    {
      name: 'Company Press Releases',
      urlPatterns: ['/press', '/news', '/media'],
      reliability: 0.60,
      requiresAuth: false
    },
    {
      name: 'GitHub',
      url: 'github.com/orgs',
      reliability: 0.65,
      requiresAuth: false
    },
    {
      name: 'Crunchbase',
      url: 'crunchbase.com/organization',
      reliability: 0.70,
      requiresAuth: false
    },
    {
      name: 'AngelList',
      url: 'wellfound.com/company',
      reliability: 0.65,
      requiresAuth: false
    }
  ]
}

export const LINKEDIN_ROLE_KEYWORDS = [
  'talent acquisition',
  'recruiter',
  'technical recruiter',
  'hr manager',
  'people operations',
  'hiring manager',
  'head of recruiting',
  'talent partner',
  'people and culture',
  'human resources'
]

export const TEAM_PAGE_PATTERNS = [
  '/team',
  '/about/team',
  '/about-us',
  '/leadership',
  '/people',
  '/careers/team',
  '/company/team',
  '/our-team'
]
