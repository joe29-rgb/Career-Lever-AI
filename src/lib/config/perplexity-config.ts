/**
 * Perplexity AI Configuration
 * 
 * Centralized configuration for all Perplexity API interactions.
 * Manages API keys, endpoints, retry logic, caching, and defaults.
 * 
 * Version: 2.0.0
 */

export interface PerplexityConfig {
  // API Configuration
  apiKey: string
  baseURL: string
  defaultModel: 'sonar' | 'sonar-pro'
  
  // Request Defaults
  defaultTemperature: number
  defaultMaxTokens: number
  requestTimeout: number
  
  // Retry Configuration
  maxRetries: number
  retryBaseDelay: number
  retryMaxDelay: number
  
  // Cache Configuration
  cacheEnabled: boolean
  cacheTTL: number
  maxCacheSize: number
  
  // Rate Limiting
  rateLimitPerMinute: number
  rateLimitPerHour: number
  
  // Debug & Monitoring
  debugMode: boolean
  logRequests: boolean
  logResponses: boolean
  enableTelemetry: boolean
  
  // Cost Management
  maxCostPerRequest: number
  dailyCostLimit: number
}

/**
 * Default configuration
 */
export const DEFAULT_PERPLEXITY_CONFIG: PerplexityConfig = {
  // API Configuration
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  baseURL: process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai',
  defaultModel: (process.env.PERPLEXITY_MODEL as 'sonar' | 'sonar-pro') || 'sonar-pro',
  
  // Request Defaults
  defaultTemperature: 0.2,
  defaultMaxTokens: 2000,
  requestTimeout: 60000, // 60 seconds
  
  // Retry Configuration
  maxRetries: 3,
  retryBaseDelay: 400, // ms
  retryMaxDelay: 10000, // 10 seconds max
  
  // Cache Configuration
  cacheEnabled: true,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxCacheSize: 1000, // entries
  
  // Rate Limiting
  rateLimitPerMinute: 20,
  rateLimitPerHour: 600,
  
  // Debug & Monitoring
  debugMode: process.env.NODE_ENV === 'development' || process.env.PPX_DEBUG === 'true',
  logRequests: process.env.PPX_LOG_REQUESTS === 'true',
  logResponses: process.env.PPX_LOG_RESPONSES === 'true',
  enableTelemetry: process.env.PPX_TELEMETRY !== 'false',
  
  // Cost Management
  maxCostPerRequest: 0.50, // $0.50 per request
  dailyCostLimit: 50.00, // $50 per day
}

/**
 * Model-specific configurations
 */
export const MODEL_CONFIGS = {
  'sonar': {
    name: 'sonar',
    speed: 'fast',
    cost: 'low',
    maxTokens: 4000,
    bestFor: ['quick searches', 'simple queries', 'high volume'],
    pricing: {
      input: 1.0, // per 1M tokens
      output: 1.0,
    }
  },
  'sonar-pro': {
    name: 'sonar-pro',
    speed: 'moderate',
    cost: 'medium',
    maxTokens: 8000,
    bestFor: ['detailed analysis', 'complex queries', 'research'],
    pricing: {
      input: 3.0, // per 1M tokens
      output: 15.0,
    }
  }
} as const

/**
 * Cache TTL configurations by operation type
 */
export const CACHE_TTL_BY_OPERATION = {
  'resume-analysis': 7 * 24 * 60 * 60 * 1000, // 7 days
  'job-search': 2 * 60 * 60 * 1000, // 2 hours
  'company-research': 24 * 60 * 60 * 1000, // 24 hours
  'hiring-contacts': 7 * 24 * 60 * 60 * 1000, // 7 days
  'salary-analysis': 30 * 24 * 60 * 60 * 1000, // 30 days
  'market-analysis': 7 * 24 * 60 * 60 * 1000, // 7 days
  'job-matching': 1 * 60 * 60 * 1000, // 1 hour
} as const

/**
 * Timeout configurations by operation type
 */
export const TIMEOUT_BY_OPERATION = {
  'resume-analysis': 90000, // 90 seconds
  'job-search': 120000, // 2 minutes
  'company-research': 60000, // 60 seconds
  'hiring-contacts': 45000, // 45 seconds
  'salary-analysis': 30000, // 30 seconds
  'market-analysis': 120000, // 2 minutes
  'job-matching': 30000, // 30 seconds
} as const

/**
 * Configuration Manager
 */
export class PerplexityConfigManager {
  private static instance: PerplexityConfigManager
  private config: PerplexityConfig

  private constructor(config?: Partial<PerplexityConfig>) {
    this.config = { ...DEFAULT_PERPLEXITY_CONFIG, ...config }
  }

  static getInstance(config?: Partial<PerplexityConfig>): PerplexityConfigManager {
    if (!PerplexityConfigManager.instance) {
      PerplexityConfigManager.instance = new PerplexityConfigManager(config)
    }
    return PerplexityConfigManager.instance
  }

  getConfig(): PerplexityConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<PerplexityConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.config.apiKey) {
      errors.push('API key is required')
    } else if (!this.config.apiKey.startsWith('pplx-')) {
      errors.push('API key must start with "pplx-"')
    }

    if (!this.config.baseURL) {
      errors.push('Base URL is required')
    } else if (!this.config.baseURL.startsWith('http')) {
      errors.push('Base URL must be a valid HTTP(S) URL')
    }

    if (this.config.defaultTemperature < 0 || this.config.defaultTemperature > 2) {
      errors.push('Temperature must be between 0 and 2')
    }

    if (this.config.defaultMaxTokens < 1 || this.config.defaultMaxTokens > 8000) {
      errors.push('Max tokens must be between 1 and 8000')
    }

    if (this.config.maxRetries < 0 || this.config.maxRetries > 10) {
      errors.push('Max retries must be between 0 and 10')
    }

    if (this.config.cacheTTL < 0) {
      errors.push('Cache TTL must be positive')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  getCacheTTL(operation: keyof typeof CACHE_TTL_BY_OPERATION): number {
    return CACHE_TTL_BY_OPERATION[operation] || this.config.cacheTTL
  }

  getTimeout(operation: keyof typeof TIMEOUT_BY_OPERATION): number {
    return TIMEOUT_BY_OPERATION[operation] || this.config.requestTimeout
  }

  getModelConfig(model: keyof typeof MODEL_CONFIGS) {
    return MODEL_CONFIGS[model]
  }

  calculateCost(usage: { prompt_tokens: number; completion_tokens: number }, model: keyof typeof MODEL_CONFIGS = 'sonar-pro'): number {
    const modelConfig = MODEL_CONFIGS[model]
    const inputCost = (usage.prompt_tokens / 1_000_000) * modelConfig.pricing.input
    const outputCost = (usage.completion_tokens / 1_000_000) * modelConfig.pricing.output
    return inputCost + outputCost
  }

  isDebugMode(): boolean {
    return this.config.debugMode
  }

  shouldLogRequests(): boolean {
    return this.config.logRequests || this.config.debugMode
  }

  shouldLogResponses(): boolean {
    return this.config.logResponses || this.config.debugMode
  }

  isTelemetryEnabled(): boolean {
    return this.config.enableTelemetry
  }
}

/**
 * Singleton instance getter
 */
export function getPerplexityConfig(): PerplexityConfig {
  return PerplexityConfigManager.getInstance().getConfig()
}

/**
 * Validate current configuration
 */
export function validatePerplexityConfig(): { valid: boolean; errors: string[] } {
  return PerplexityConfigManager.getInstance().validateConfig()
}

/**
 * Get cache TTL for operation
 */
export function getCacheTTLForOperation(operation: keyof typeof CACHE_TTL_BY_OPERATION): number {
  return PerplexityConfigManager.getInstance().getCacheTTL(operation)
}

/**
 * Get timeout for operation
 */
export function getTimeoutForOperation(operation: keyof typeof TIMEOUT_BY_OPERATION): number {
  return PerplexityConfigManager.getInstance().getTimeout(operation)
}

/**
 * Calculate request cost
 */
export function calculateRequestCost(
  usage: { prompt_tokens: number; completion_tokens: number },
  model: keyof typeof MODEL_CONFIGS = 'sonar-pro'
): number {
  return PerplexityConfigManager.getInstance().calculateCost(usage, model)
}

