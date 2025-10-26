/**
 * Company Research Data Sources - 24+ Sources
 * Complete company intelligence gathering
 */

export interface ResearchSource {
  name: string
  url: string
  dataType: string
  coverage: string
  reliability: number
  apiAvailable?: boolean
  free?: boolean
}

export const RESEARCH_SOURCES = {
  // FINANCIAL DATA
  financial: {
    yahooFinance: {
      name: 'Yahoo Finance Canada',
      url: 'finance.yahoo.com',
      dataType: 'stock_price,financials,history',
      coverage: 'all-public',
      reliability: 95
    },
    tmxMoney: {
      name: 'TMX Money (TSX)',
      url: 'tmxmoney.com',
      dataType: 'tsx_stocks,prices,volume',
      coverage: 'tsx-listed',
      reliability: 99
    },
    secEdgar: {
      name: 'SEC EDGAR',
      url: 'sec.gov/cgi-bin',
      dataType: '10k,10q,8k,financials',
      coverage: 'us-public',
      reliability: 99
    },
    fmp: {
      name: 'Financial Modeling Prep',
      url: 'financialmodelingprep.com',
      apiAvailable: true,
      dataType: 'financials,ratios,growth',
      coverage: 'all-stocks',
      reliability: 92
    },
    polygonIO: {
      name: 'Polygon.io',
      url: 'polygon.io',
      apiAvailable: true,
      dataType: 'real-time,historical,corporate-actions',
      coverage: 'all-us-stocks',
      reliability: 94
    },
    alphaVantage: {
      name: 'Alpha Vantage',
      url: 'alphavantage.co',
      apiAvailable: true,
      free: true,
      dataType: 'stock-prices,technical-indicators,fundamentals',
      coverage: 'all-stocks',
      reliability: 88
    }
  },

  // COMPANY INFORMATION
  companyInfo: {
    bloomberg: {
      name: 'Bloomberg',
      url: 'bloomberg.com',
      dataType: 'company_profiles,news,analysis',
      coverage: 'all-major-companies',
      reliability: 99
    },
    forbes: {
      name: 'Forbes',
      url: 'forbes.com',
      dataType: 'rankings,company_features,lists',
      coverage: 'major-companies',
      reliability: 95
    },
    linkedinCompany: {
      name: 'LinkedIn Company Pages',
      url: 'linkedin.com/company',
      dataType: 'employee_count,description,news_feed',
      coverage: 'all-registered-companies',
      reliability: 90
    },
    crunchbase: {
      name: 'Crunchbase',
      url: 'crunchbase.com',
      dataType: 'funding,investors,company_stage',
      coverage: 'startups,venture-backed',
      reliability: 88
    },
    pitchbook: {
      name: 'PitchBook',
      url: 'pitchbook.com',
      dataType: 'valuation,funding,deal_data',
      coverage: 'funded-companies',
      reliability: 92
    },
    googleBusiness: {
      name: 'Google Business',
      url: 'google.com/business',
      dataType: 'contact,hours,reviews',
      coverage: 'all-registered',
      reliability: 85
    },
    bbb: {
      name: 'Better Business Bureau',
      url: 'bbb.org',
      dataType: 'ratings,complaints,accreditation',
      coverage: 'all-businesses',
      reliability: 88
    },
    govCanada: {
      name: 'Government of Canada Corp Search',
      url: 'corps.ic.gc.ca',
      dataType: 'legal_status,officers,registration',
      coverage: 'all-corporations',
      reliability: 99
    }
  },

  // NEWS & MEDIA
  news: {
    googleNews: {
      name: 'Google News',
      url: 'news.google.com',
      dataType: 'aggregated_news,multi_source',
      coverage: 'all-companies',
      reliability: 94
    },
    dowJones: {
      name: 'Dow Jones Newswires',
      url: 'djnewswires.com',
      dataType: 'business_news,press_releases,alerts',
      coverage: 'all-major-corps',
      reliability: 98
    },
    reuters: {
      name: 'Reuters Business',
      url: 'reuters.com/business',
      dataType: 'global_news,corp_announcements',
      coverage: 'international',
      reliability: 97
    },
    financialPost: {
      name: 'Financial Post',
      url: 'financialpost.com',
      dataType: 'canadian_news,company_profiles',
      coverage: 'canada-focused',
      reliability: 93
    },
    bnnBloomberg: {
      name: 'BNN Bloomberg',
      url: 'bnnbloomberg.ca',
      dataType: 'financial_news,interviews,updates',
      coverage: 'canadian',
      reliability: 94
    },
    techCrunch: {
      name: 'TechCrunch',
      url: 'techcrunch.com',
      dataType: 'tech_news,startup_funding',
      coverage: 'tech-companies',
      reliability: 90
    }
  },

  // CULTURE & WORKPLACE
  culture: {
    glassdoor: {
      name: 'Glassdoor Reviews',
      url: 'glassdoor.ca/Reviews',
      dataType: 'employee_reviews,salary,culture',
      coverage: 'all-employers',
      reliability: 85
    },
    indeedReviews: {
      name: 'Indeed Company Reviews',
      url: 'indeed.com/cmp',
      dataType: 'ratings,feedback,interviews',
      coverage: 'all-employers',
      reliability: 82
    },
    kununu: {
      name: 'Kununu',
      url: 'kununu.com',
      dataType: 'employee_reviews,ratings',
      coverage: 'international',
      reliability: 80
    },
    greatPlaceToWork: {
      name: 'Great Place to Work',
      url: 'greatplacetowork.com',
      dataType: 'certifications,awards,culture',
      coverage: 'all-certified',
      reliability: 94
    }
  }
}

/**
 * Get research sources by type
 */
export function getResearchSourcesByType(
  type: keyof typeof RESEARCH_SOURCES
): Record<string, ResearchSource> {
  return RESEARCH_SOURCES[type]
}

/**
 * Get all research sources as flat array
 */
export function getAllResearchSources(): ResearchSource[] {
  return Object.values(RESEARCH_SOURCES).flatMap(category => 
    Object.values(category)
  )
}

/**
 * Get sources by reliability threshold
 */
export function getSourcesByReliability(minReliability: number): ResearchSource[] {
  return getAllResearchSources().filter(
    source => source.reliability >= minReliability
  )
}

/**
 * Get API-available sources
 */
export function getAPIAvailableSources(): ResearchSource[] {
  return getAllResearchSources().filter(source => source.apiAvailable)
}

/**
 * Get free sources
 */
export function getFreeSources(): ResearchSource[] {
  return getAllResearchSources().filter(source => source.free)
}

/**
 * Generate site: operator search for company research
 */
export function generateCompanyResearchQuery(
  companyName: string,
  sources: ResearchSource[]
): string {
  return sources
    .map(source => `site:${source.url} "${companyName}"`)
    .join(' OR ')
}
