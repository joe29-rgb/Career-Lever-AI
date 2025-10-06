// Enterprise Logging Service with Structured Output

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string
  level: string
  message: string
  metadata?: any
  requestId?: string
  userId?: string
  context?: string
}

export class Logger {
  private static instance: Logger
  private level: LogLevel
  private context: string

  private constructor(context: string = 'APP') {
    this.context = context
    this.level = this.getLogLevelFromEnv()
  }

  static getInstance(context?: string): Logger {
    if (!Logger.instance || (context && Logger.instance.context !== context)) {
      Logger.instance = new Logger(context)
    }
    return Logger.instance
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase()
    switch (envLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG
      case 'INFO':
        return LogLevel.INFO
      case 'WARN':
        return LogLevel.WARN
      case 'ERROR':
        return LogLevel.ERROR
      default:
        return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
    }
  }

  error(message: string, metadata?: any, context?: { requestId?: string; userId?: string }): void {
    this.log(LogLevel.ERROR, message, metadata, context)
  }

  warn(message: string, metadata?: any, context?: { requestId?: string; userId?: string }): void {
    this.log(LogLevel.WARN, message, metadata, context)
  }

  info(message: string, metadata?: any, context?: { requestId?: string; userId?: string }): void {
    this.log(LogLevel.INFO, message, metadata, context)
  }

  debug(message: string, metadata?: any, context?: { requestId?: string; userId?: string }): void {
    this.log(LogLevel.DEBUG, message, metadata, context)
  }

  private log(level: LogLevel, message: string, metadata?: any, context?: { requestId?: string; userId?: string }): void {
    if (level > this.level) return

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context: this.context,
      metadata,
      requestId: context?.requestId,
      userId: context?.userId
    }

    // Console output
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(level, logEntry)
    } else {
      // Structured JSON for production log aggregation
      console.log(JSON.stringify(logEntry))
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(logEntry)
    }
  }

  private consoleLog(level: LogLevel, entry: LogEntry): void {
    const colorCodes = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.DEBUG]: '\x1b[90m', // Gray
    }
    const resetCode = '\x1b[0m'
    
    const color = colorCodes[level] || ''
    const prefix = `${color}[${entry.level}]${resetCode} ${entry.timestamp} [${entry.context}]`
    
    console.log(`${prefix} ${entry.message}`, entry.metadata || '')
  }

  private async sendToExternalLogger(entry: LogEntry): Promise<void> {
    // Integration points for external logging services
    // Examples: DataDog, Splunk, CloudWatch, Sentry, etc.
    
    // Sentry for errors
    if (entry.level === 'ERROR' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Would integrate with Sentry SDK here
    }

    // Custom logging endpoint
    if (process.env.LOG_ENDPOINT) {
      try {
        await fetch(process.env.LOG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        })
      } catch (error) {
        // Silently fail - don't crash app due to logging issues
        console.error('Failed to send log to external service:', error)
      }
    }
  }

  // Convenience methods for common scenarios
  apiRequest(method: string, path: string, statusCode: number, duration: number, userId?: string): void {
    this.info(`API ${method} ${path}`, {
      method,
      path,
      statusCode,
      duration,
      userId
    })
  }

  apiError(method: string, path: string, error: Error, userId?: string): void {
    this.error(`API ${method} ${path} failed`, {
      method,
      path,
      error: error.message,
      stack: error.stack,
      userId
    })
  }

  dbQuery(operation: string, collection: string, duration: number): void {
    this.debug(`DB ${operation} on ${collection}`, {
      operation,
      collection,
      duration
    })
  }

  dbError(operation: string, collection: string, error: Error): void {
    this.error(`DB ${operation} on ${collection} failed`, {
      operation,
      collection,
      error: error.message,
      stack: error.stack
    })
  }

  aiRequest(service: string, model: string, tokensUsed: number, cost: number): void {
    this.info(`AI request to ${service}`, {
      service,
      model,
      tokensUsed,
      cost
    })
  }

  aiError(service: string, error: Error): void {
    this.error(`AI service ${service} failed`, {
      service,
      error: error.message,
      stack: error.stack
    })
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any): void {
    const level = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : LogLevel.WARN
    this.log(level, `SECURITY: ${event}`, {
      ...details,
      severity
    })
  }
}

// Export convenience instances
export const logger = Logger.getInstance()
export const apiLogger = Logger.getInstance('API')
export const dbLogger = Logger.getInstance('DATABASE')
export const aiLogger = Logger.getInstance('AI')
export const securityLogger = Logger.getInstance('SECURITY')

