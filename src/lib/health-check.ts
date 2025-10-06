// Enterprise Health Check System

import { dbService } from './database'
import { logger } from './logger'

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  error?: string
  details?: any
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  services: {
    database: ServiceHealth
    ai: ServiceHealth
    cache: ServiceHealth
  }
  metrics: {
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage?: NodeJS.CpuUsage
  }
}

export class HealthCheckService {
  private static instance: HealthCheckService

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService()
    }
    return HealthCheckService.instance
  }

  async performHealthCheck(): Promise<HealthCheck> {
    const startTime = Date.now()
    
    const healthCheck: HealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: await this.checkDatabase(),
        ai: await this.checkAIService(),
        cache: await this.checkCache()
      },
      metrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    }

    // Determine overall health based on service statuses
    const serviceStatuses = Object.values(healthCheck.services).map(s => s.status)
    if (serviceStatuses.includes('unhealthy')) {
      healthCheck.status = 'unhealthy'
    } else if (serviceStatuses.includes('degraded')) {
      healthCheck.status = 'degraded'
    }

    const duration = Date.now() - startTime
    logger.debug(`Health check completed in ${duration}ms`, {
      status: healthCheck.status,
      services: serviceStatuses
    })

    return healthCheck
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      const start = Date.now()
      await dbService.connect()
      const responseTime = Date.now() - start
      
      const isConnected = dbService.isConnected()
      
      return {
        status: isConnected && responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          connected: isConnected
        }
      }
    } catch (error) {
      logger.error('Database health check failed', error)
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed'
      }
    }
  }

  private async checkAIService(): Promise<ServiceHealth> {
    try {
      const start = Date.now()
      
      // Simple check - verify API key is configured
      const apiKey = process.env.PERPLEXITY_API_KEY
      if (!apiKey) {
        return {
          status: 'unhealthy',
          error: 'Perplexity API key not configured'
        }
      }

      const responseTime = Date.now() - start
      
      return {
        status: 'healthy',
        responseTime,
        details: {
          provider: 'perplexity',
          configured: true
        }
      }
    } catch (error) {
      logger.error('AI service health check failed', error)
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'AI service unavailable'
      }
    }
  }

  private async checkCache(): Promise<ServiceHealth> {
    try {
      const start = Date.now()
      
      // Check if Redis is configured
      const redisUrl = process.env.REDIS_URL
      if (!redisUrl) {
        return {
          status: 'degraded',
          details: {
            configured: false,
            message: 'Cache not configured - using in-memory fallback'
          }
        }
      }

      const responseTime = Date.now() - start
      
      return {
        status: responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          configured: true,
          type: 'redis'
        }
      }
    } catch (error) {
      logger.error('Cache health check failed', error)
      return {
        status: 'degraded',
        error: error instanceof Error ? error.message : 'Cache unavailable',
        details: {
          fallback: 'in-memory'
        }
      }
    }
  }

  // Readiness probe - is the service ready to accept requests?
  async isReady(): Promise<boolean> {
    const health = await this.performHealthCheck()
    return health.status !== 'unhealthy'
  }

  // Liveness probe - is the service alive?
  async isAlive(): Promise<boolean> {
    try {
      // Simple check - can we execute code?
      return Date.now() > 0
    } catch {
      return false
    }
  }
}

export const healthCheckService = HealthCheckService.getInstance()

