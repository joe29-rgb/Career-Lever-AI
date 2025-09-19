import JobBoardIntegration from '@/models/JobBoardIntegration'
import { Types } from 'mongoose'

// Job board configuration with API details
export interface JobBoardConfig {
  name: string
  displayName: string
  baseUrl: string
  authUrl: string
  tokenUrl: string
  clientId: string
  clientSecret: string
  scopes: string[]
  endpoints: {
    jobs: string
    applications: string
    profile: string
  }
  rateLimits: {
    requestsPerHour: number
    requestsPerDay: number
  }
  features: {
    jobPosting: boolean
    applicationTracking: boolean
    resumeUpload: boolean
    automatedApply: boolean
  }
}

// Job board configurations (in production, these would come from environment variables)
const JOB_BOARD_CONFIGS: Record<string, JobBoardConfig> = {
  linkedin: {
    name: 'linkedin',
    displayName: 'LinkedIn',
    baseUrl: 'https://api.linkedin.com/v2',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'rw_company_admin'],
    endpoints: {
      jobs: '/jobs',
      applications: '/people/~/applications',
      profile: '/people/~'
    },
    rateLimits: {
      requestsPerHour: 100,
      requestsPerDay: 1000
    },
    features: {
      jobPosting: true,
      applicationTracking: true,
      resumeUpload: true,
      automatedApply: false // Requires human verification
    }
  },
  ziprecruiter: {
    name: 'ziprecruiter',
    displayName: 'ZipRecruiter',
    baseUrl: 'https://api.ziprecruiter.com',
    authUrl: 'https://api.ziprecruiter.com/oauth/authorize',
    tokenUrl: 'https://api.ziprecruiter.com/oauth/token',
    clientId: process.env.ZIPRECRUITER_CLIENT_ID || '',
    clientSecret: process.env.ZIPRECRUITER_CLIENT_SECRET || '',
    scopes: ['read', 'write'],
    endpoints: {
      jobs: '/jobs',
      applications: '/applications',
      profile: '/profile'
    },
    rateLimits: {
      requestsPerHour: 1000,
      requestsPerDay: 10000
    },
    features: {
      jobPosting: true,
      applicationTracking: true,
      resumeUpload: true,
      automatedApply: true
    }
  },
  monster: {
    name: 'monster',
    displayName: 'Monster',
    baseUrl: 'https://api.monster.com/v2',
    authUrl: 'https://api.monster.com/oauth/authorize',
    tokenUrl: 'https://api.monster.com/oauth/token',
    clientId: process.env.MONSTER_CLIENT_ID || '',
    clientSecret: process.env.MONSTER_CLIENT_SECRET || '',
    scopes: ['read', 'write', 'apply'],
    endpoints: {
      jobs: '/jobs',
      applications: '/applications',
      profile: '/profile'
    },
    rateLimits: {
      requestsPerHour: 500,
      requestsPerDay: 5000
    },
    features: {
      jobPosting: true,
      applicationTracking: true,
      resumeUpload: true,
      automatedApply: true
    }
  },
  careerbuilder: {
    name: 'careerbuilder',
    displayName: 'CareerBuilder',
    baseUrl: 'https://api.careerbuilder.com/v2',
    authUrl: 'https://api.careerbuilder.com/oauth/authorize',
    tokenUrl: 'https://api.careerbuilder.com/oauth/token',
    clientId: process.env.CAREERBUILDER_CLIENT_ID || '',
    clientSecret: process.env.CAREERBUILDER_CLIENT_SECRET || '',
    scopes: ['read', 'write', 'apply'],
    endpoints: {
      jobs: '/jobs',
      applications: '/applications',
      profile: '/profile'
    },
    rateLimits: {
      requestsPerHour: 1000,
      requestsPerDay: 10000
    },
    features: {
      jobPosting: true,
      applicationTracking: true,
      resumeUpload: true,
      automatedApply: true
    }
  },
  indeed: {
    name: 'indeed',
    displayName: 'Indeed',
    baseUrl: 'https://api.indeed.com/v2',
    authUrl: 'https://secure.indeed.com/oauth/v2/authorize',
    tokenUrl: 'https://secure.indeed.com/oauth/v2/token',
    clientId: process.env.INDEED_CLIENT_ID || '',
    clientSecret: process.env.INDEED_CLIENT_SECRET || '',
    scopes: ['read', 'write', 'apply'],
    endpoints: {
      jobs: '/jobs',
      applications: '/applications',
      profile: '/profile'
    },
    rateLimits: {
      requestsPerHour: 100,
      requestsPerDay: 1000
    },
    features: {
      jobPosting: false, // Indeed doesn't allow direct job posting via API
      applicationTracking: true,
      resumeUpload: true,
      automatedApply: false // Manual application required
    }
  }
}

export class JobBoardService {
  private config: JobBoardConfig

  constructor(boardName: string) {
    this.config = JOB_BOARD_CONFIGS[boardName]
    if (!this.config) {
      throw new Error(`Unsupported job board: ${boardName}`)
    }
  }

  // Generate OAuth authorization URL
  generateAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: this.config.scopes.join(' '),
      state: state
    })

    return `${this.config.authUrl}?${params.toString()}`
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<any> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    accessToken: string,
    data?: any
  ): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }

    const config: RequestInit = {
      method,
      headers
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data)
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED')
      }
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Get user profile from job board
  async getUserProfile(accessToken: string): Promise<any> {
    return this.makeAuthenticatedRequest(this.config.endpoints.profile, 'GET', accessToken)
  }

  // Post a job to the board
  async postJob(accessToken: string, jobData: any): Promise<any> {
    if (!this.config.features.jobPosting) {
      throw new Error(`Job posting not supported for ${this.config.displayName}`)
    }

    return this.makeAuthenticatedRequest(this.config.endpoints.jobs, 'POST', accessToken, jobData)
  }

  // Apply to a job
  async applyToJob(accessToken: string, jobId: string, applicationData: any): Promise<any> {
    if (!this.config.features.automatedApply) {
      throw new Error(`Automated application not supported for ${this.config.displayName}`)
    }

    const endpoint = `${this.config.endpoints.applications}/${jobId}`
    return this.makeAuthenticatedRequest(endpoint, 'POST', accessToken, applicationData)
  }

  // Get application status
  async getApplicationStatus(accessToken: string, applicationId: string): Promise<any> {
    if (!this.config.features.applicationTracking) {
      throw new Error(`Application tracking not supported for ${this.config.displayName}`)
    }

    const endpoint = `${this.config.endpoints.applications}/${applicationId}`
    return this.makeAuthenticatedRequest(endpoint, 'GET', accessToken)
  }

  // Check rate limits
  async checkRateLimit(integration: any): Promise<boolean> {
    const now = new Date()
    const lastRequest = integration.metadata?.rateLimits?.lastRequestAt

    if (!lastRequest) return true

    const timeSinceLastRequest = now.getTime() - new Date(lastRequest).getTime()
    const requestsPerHour = integration.metadata?.rateLimits?.requestsPerHour || this.config.rateLimits.requestsPerHour

    // Simple rate limiting check (could be more sophisticated)
    return timeSinceLastRequest > (3600000 / requestsPerHour) // milliseconds per request
  }

  // Update rate limit tracking
  async updateRateLimit(integration: any): Promise<void> {
    await JobBoardIntegration.findByIdAndUpdate(integration._id, {
      'metadata.rateLimits.lastRequestAt': new Date()
    })
  }

  // Validate configuration
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.config.clientId) {
      errors.push(`${this.config.displayName} Client ID not configured`)
    }

    if (!this.config.clientSecret) {
      errors.push(`${this.config.displayName} Client Secret not configured`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  getConfig(): JobBoardConfig {
    return this.config
  }
}

// Factory function to create job board service instances
export function createJobBoardService(boardName: string): JobBoardService {
  return new JobBoardService(boardName)
}

// Get all supported job boards
export function getSupportedJobBoards(): Array<{ id: string; name: string; features: JobBoardConfig['features'] }> {
  return Object.values(JOB_BOARD_CONFIGS).map(config => ({
    id: config.name,
    name: config.displayName,
    features: config.features
  }))
}

// Validate all job board configurations
export function validateAllConfigurations(): Record<string, { isValid: boolean; errors: string[] }> {
  const results: Record<string, { isValid: boolean; errors: string[] }> = {}

  for (const [boardName, config] of Object.entries(JOB_BOARD_CONFIGS)) {
    const service = new JobBoardService(boardName)
    results[boardName] = service.validateConfig()
  }

  return results
}


