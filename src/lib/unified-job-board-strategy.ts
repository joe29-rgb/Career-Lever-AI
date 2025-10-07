/**
 * Unified Job Board Strategy
 * 
 * This service handles job board integrations using TWO approaches:
 * 1. PUBLIC SCRAPING: For closed-API job boards (LinkedIn, Indeed, etc.)
 * 2. OPEN APIs: For job boards with accessible public APIs
 * 
 * IMPORTANT: Most major job boards (LinkedIn, Indeed, ZipRecruiter, Monster)
 * have CLOSED/PRIVATE APIs that require partnerships. We can only access
 * their PUBLIC job listings via web scraping (Perplexity) or browser extensions.
 */

import { PerplexityService } from './perplexity-service'
import { PerplexityIntelligenceService } from './perplexity-intelligence'

export type JobBoardType = 'public-scraping' | 'open-api' | 'frontend-only'

export interface UnifiedJobBoardConfig {
  name: string
  displayName: string
  type: JobBoardType
  accessMethod: {
    scraping?: {
      baseUrl: string
      publicListingsUrl: string
      canScrapePerpeplexity: boolean
    }
    api?: {
      baseUrl: string
      requiresAuth: boolean
      publicEndpoints: string[]
    }
    frontend?: {
      browserExtensionRequired: boolean
      bookmarkletSupported: boolean
      canAutoFill: boolean
    }
  }
  features: {
    canDiscoverJobs: boolean
    canApplyDirectly: boolean
    requiresManualApplication: boolean
    supportsTracking: boolean
  }
}

/**
 * Job Board Configuration Matrix
 * Based on ACTUAL accessibility, not wishful thinking
 */
export const JOB_BOARD_CONFIGS: Record<string, UnifiedJobBoardConfig> = {
  // CLOSED API BOARDS - Can only scrape public listings
  linkedin: {
    name: 'linkedin',
    displayName: 'LinkedIn',
    type: 'frontend-only',
    accessMethod: {
      scraping: {
        baseUrl: 'https://www.linkedin.com',
        publicListingsUrl: 'https://www.linkedin.com/jobs/search',
        canScrapePerpeplexity: true // Can scrape via Perplexity
      },
      frontend: {
        browserExtensionRequired: true,
        bookmarkletSupported: true,
        canAutoFill: true // Can auto-fill Easy Apply
      }
    },
    features: {
      canDiscoverJobs: true,  // Via Perplexity scraping
      canApplyDirectly: false, // No API access
      requiresManualApplication: true, // Need browser extension/bookmarklet
      supportsTracking: false  // Can't track via API
    }
  },

  indeed: {
    name: 'indeed',
    displayName: 'Indeed',
    type: 'frontend-only',
    accessMethod: {
      scraping: {
        baseUrl: 'https://www.indeed.com',
        publicListingsUrl: 'https://www.indeed.com/jobs',
        canScrapePerpeplexity: true
      },
      frontend: {
        browserExtensionRequired: true,
        bookmarkletSupported: true,
        canAutoFill: true
      }
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      requiresManualApplication: true,
      supportsTracking: false
    }
  },

  ziprecruiter: {
    name: 'ziprecruiter',
    displayName: 'ZipRecruiter',
    type: 'frontend-only',
    accessMethod: {
      scraping: {
        baseUrl: 'https://www.ziprecruiter.com',
        publicListingsUrl: 'https://www.ziprecruiter.com/jobs-search',
        canScrapePerpeplexity: true
      },
      frontend: {
        browserExtensionRequired: true,
        bookmarkletSupported: true,
        canAutoFill: true
      }
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      requiresManualApplication: true,
      supportsTracking: false
    }
  },

  monster: {
    name: 'monster',
    displayName: 'Monster',
    type: 'frontend-only',
    accessMethod: {
      scraping: {
        baseUrl: 'https://www.monster.com',
        publicListingsUrl: 'https://www.monster.com/jobs/search',
        canScrapePerpeplexity: true
      },
      frontend: {
        browserExtensionRequired: true,
        bookmarkletSupported: true,
        canAutoFill: true
      }
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      requiresManualApplication: true,
      supportsTracking: false
    }
  },

  glassdoor: {
    name: 'glassdoor',
    displayName: 'Glassdoor',
    type: 'frontend-only',
    accessMethod: {
      scraping: {
        baseUrl: 'https://www.glassdoor.com',
        publicListingsUrl: 'https://www.glassdoor.com/Job/jobs.htm',
        canScrapePerpeplexity: true
      },
      frontend: {
        browserExtensionRequired: true,
        bookmarkletSupported: true,
        canAutoFill: false // More complex forms
      }
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      requiresManualApplication: true,
      supportsTracking: false
    }
  },

  // OPEN/PUBLIC BOARDS - Can use APIs
  jobbank: {
    name: 'jobbank',
    displayName: 'Job Bank Canada',
    type: 'public-scraping',
    accessMethod: {
      scraping: {
        baseUrl: 'https://www.jobbank.gc.ca',
        publicListingsUrl: 'https://www.jobbank.gc.ca/jobsearch/jobsearch',
        canScrapePerpeplexity: true
      },
      api: {
        baseUrl: 'https://www.jobbank.gc.ca',
        requiresAuth: false,
        publicEndpoints: ['/jobsearch/jobsearch']
      }
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false, // Redirects to employer sites
      requiresManualApplication: true,
      supportsTracking: false
    }
  },

  workopolis: {
    name: 'workopolis',
    displayName: 'Workopolis',
    type: 'public-scraping',
    accessMethod: {
      scraping: {
        baseUrl: 'https://www.workopolis.com',
        publicListingsUrl: 'https://www.workopolis.com/jobsearch/jobs',
        canScrapePerpeplexity: true
      }
    },
    features: {
      canDiscoverJobs: true,
      canApplyDirectly: false,
      requiresManualApplication: true,
      supportsTracking: false
    }
  }
}

/**
 * Unified Job Board Service
 * Routes requests to appropriate method based on board type
 */
export class UnifiedJobBoardService {
  private perplexity: PerplexityService

  constructor() {
    this.perplexity = new PerplexityService()
  }

  /**
   * Discover jobs from a specific board
   * Uses appropriate method based on board configuration
   */
  async discoverJobs(boardName: string, query: {
    keywords: string
    location: string
    limit?: number
  }): Promise<any[]> {
    const config = JOB_BOARD_CONFIGS[boardName]
    
    if (!config) {
      throw new Error(`Unsupported job board: ${boardName}`)
    }

    if (!config.features.canDiscoverJobs) {
      throw new Error(`${config.displayName} does not support job discovery via our service`)
    }

    // Use Perplexity scraping for all boards
    if (config.accessMethod.scraping?.canScrapePerpeplexity) {
      return this.discoverViaPerplexity(config, query)
    }

    return []
  }

  /**
   * Discover jobs using Perplexity web scraping
   * This works for ALL job boards with public listings
   */
  private async discoverViaPerplexity(
    config: UnifiedJobBoardConfig, 
    query: { keywords: string; location: string; limit?: number }
  ): Promise<any[]> {
    const { keywords, location, limit = 20 } = query
    
    // Build Perplexity search query for this specific board
    const searchQuery = `site:${new URL(config.accessMethod.scraping!.baseUrl).hostname} "${keywords}" "${location}" after:2024-01-01`
    
    try {
      const results = await PerplexityIntelligenceService.jobQuickSearch(
        searchQuery,
        [new URL(config.accessMethod.scraping!.baseUrl).hostname],
        limit,
        'week'
      )
      
      return results.map((result: any) => ({
        ...result,
        source: config.name,
        sourceDisplayName: config.displayName,
        requiresFrontendApplication: config.features.requiresManualApplication
      }))
    } catch (error) {
      console.error(`[JOB_DISCOVERY] Failed to discover jobs from ${config.displayName}:`, error)
      return []
    }
  }

  /**
   * Get application method for a job
   * Returns instructions for how user should apply
   */
  getApplicationMethod(boardName: string): {
    method: 'browser-extension' | 'bookmarklet' | 'manual-guided' | 'api'
    instructions: string
    canAutomate: boolean
  } {
    const config = JOB_BOARD_CONFIGS[boardName]
    
    if (!config) {
      return {
        method: 'manual-guided',
        instructions: 'This job board is not yet supported. Please apply manually.',
        canAutomate: false
      }
    }

    if (config.type === 'frontend-only') {
      if (config.accessMethod.frontend?.browserExtensionRequired) {
        return {
          method: 'browser-extension',
          instructions: `Install the Career Lever browser extension to auto-fill applications on ${config.displayName}`,
          canAutomate: config.accessMethod.frontend.canAutoFill
        }
      }
      
      if (config.accessMethod.frontend?.bookmarkletSupported) {
        return {
          method: 'bookmarklet',
          instructions: `Use the Career Lever bookmarklet to assist with your ${config.displayName} application`,
          canAutomate: config.accessMethod.frontend.canAutoFill
        }
      }
    }

    return {
      method: 'manual-guided',
      instructions: `Follow our step-by-step guide to apply on ${config.displayName}`,
      canAutomate: false
    }
  }

  /**
   * Check if a board supports direct API integration
   * Most major boards DON'T - this is the reality check
   */
  supportsDirectAPI(boardName: string): boolean {
    const config = JOB_BOARD_CONFIGS[boardName]
    return config?.type === 'open-api' && 
           config?.accessMethod.api?.requiresAuth === false
  }

  /**
   * Get all boards that can be scraped via Perplexity
   */
  getScrapableBoards(): UnifiedJobBoardConfig[] {
    return Object.values(JOB_BOARD_CONFIGS).filter(
      config => config.accessMethod.scraping?.canScrapePerpeplexity
    )
  }

  /**
   * Get all boards that require frontend automation
   */
  getFrontendOnlyBoards(): UnifiedJobBoardConfig[] {
    return Object.values(JOB_BOARD_CONFIGS).filter(
      config => config.type === 'frontend-only'
    )
  }
}

