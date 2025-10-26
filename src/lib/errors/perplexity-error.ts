/**
 * Custom Error Classes for Perplexity AI Integration
 * 
 * Provides structured error handling with metadata for debugging,
 * monitoring, and user-friendly error messages.
 */

export interface PerplexityErrorContext {
  requestId: string
  prompts: {
    system: string
    user: string
  }
  timestamp: number
  endpoint?: string
  statusCode?: number
  retryAttempt?: number
  cacheKey?: string
}

/**
 * Base Perplexity Error
 */
export class PerplexityError extends Error {
  public readonly code: string
  public readonly requestId: string
  public readonly prompts: { system: string; user: string }
  public readonly timestamp: number
  public readonly endpoint?: string
  public readonly statusCode?: number
  public readonly retryAttempt?: number
  public readonly originalError?: Error

  constructor(
    message: string,
    code: string,
    context: PerplexityErrorContext,
    originalError?: Error
  ) {
    super(message)
    this.name = 'PerplexityError'
    this.code = code
    this.requestId = context.requestId
    this.prompts = context.prompts
    this.timestamp = context.timestamp
    this.endpoint = context.endpoint
    this.statusCode = context.statusCode
    this.retryAttempt = context.retryAttempt
    this.originalError = originalError

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      requestId: this.requestId,
      timestamp: this.timestamp,
      endpoint: this.endpoint,
      statusCode: this.statusCode,
      retryAttempt: this.retryAttempt,
      originalError: this.originalError?.message,
      stack: this.stack
    }
  }
}

/**
 * JSON Parsing Error
 */
export class PerplexityJSONError extends PerplexityError {
  public readonly rawResponse: string
  public readonly parseAttempts: string[]

  constructor(
    message: string,
    context: PerplexityErrorContext,
    rawResponse: string,
    parseAttempts: string[],
    originalError?: Error
  ) {
    super(message, 'JSON_PARSE_ERROR', context, originalError)
    this.name = 'PerplexityJSONError'
    this.rawResponse = rawResponse
    this.parseAttempts = parseAttempts
  }

  toJSON() {
    return {
      ...super.toJSON(),
      rawResponse: this.rawResponse.slice(0, 500), // Truncate for logging
      parseAttempts: this.parseAttempts
    }
  }
}

/**
 * Schema Validation Error
 */
export class PerplexitySchemaError extends PerplexityError {
  public readonly schema: string
  public readonly validationErrors: any[]
  public readonly receivedData: any

  constructor(
    message: string,
    context: PerplexityErrorContext,
    schema: string,
    validationErrors: any[],
    receivedData: any
  ) {
    super(message, 'SCHEMA_VALIDATION_ERROR', context)
    this.name = 'PerplexitySchemaError'
    this.schema = schema
    this.validationErrors = validationErrors
    this.receivedData = receivedData
  }

  toJSON() {
    return {
      ...super.toJSON(),
      schema: this.schema,
      validationErrors: this.validationErrors,
      receivedData: this.receivedData
    }
  }
}

/**
 * API Request Error
 */
export class PerplexityAPIError extends PerplexityError {
  public readonly responseBody?: any
  public readonly headers?: Record<string, string>

  constructor(
    message: string,
    context: PerplexityErrorContext,
    statusCode: number,
    responseBody?: any,
    headers?: Record<string, string>,
    originalError?: Error
  ) {
    super(message, 'API_REQUEST_ERROR', { ...context, statusCode }, originalError)
    this.name = 'PerplexityAPIError'
    this.responseBody = responseBody
    this.headers = headers
  }

  toJSON() {
    return {
      ...super.toJSON(),
      responseBody: this.responseBody,
      headers: this.headers
    }
  }
}

/**
 * Rate Limit Error
 */
export class PerplexityRateLimitError extends PerplexityError {
  public readonly retryAfter?: number
  public readonly limit?: number
  public readonly remaining?: number

  constructor(
    message: string,
    context: PerplexityErrorContext,
    retryAfter?: number,
    limit?: number,
    remaining?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', { ...context, statusCode: 429 })
    this.name = 'PerplexityRateLimitError'
    this.retryAfter = retryAfter
    this.limit = limit
    this.remaining = remaining
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
      limit: this.limit,
      remaining: this.remaining
    }
  }
}

/**
 * Timeout Error
 */
export class PerplexityTimeoutError extends PerplexityError {
  public readonly timeoutDuration: number

  constructor(
    message: string,
    context: PerplexityErrorContext,
    timeoutDuration: number,
    originalError?: Error
  ) {
    super(message, 'TIMEOUT_ERROR', context, originalError)
    this.name = 'PerplexityTimeoutError'
    this.timeoutDuration = timeoutDuration
  }

  toJSON() {
    return {
      ...super.toJSON(),
      timeoutDuration: this.timeoutDuration
    }
  }
}

/**
 * Network Error
 */
export class PerplexityNetworkError extends PerplexityError {
  constructor(
    message: string,
    context: PerplexityErrorContext,
    originalError?: Error
  ) {
    super(message, 'NETWORK_ERROR', context, originalError)
    this.name = 'PerplexityNetworkError'
  }
}

/**
 * Error Factory
 */
export class PerplexityErrorFactory {
  static create(
    error: any,
    context: PerplexityErrorContext
  ): PerplexityError {
    // Rate limit error
    if (error.statusCode === 429 || error.status === 429) {
      return new PerplexityRateLimitError(
        'Perplexity API rate limit exceeded',
        context,
        error.retryAfter,
        error.limit,
        error.remaining
      )
    }

    // Timeout error
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      return new PerplexityTimeoutError(
        'Perplexity API request timed out',
        context,
        error.timeout || 30000,
        error
      )
    }

    // Network error
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return new PerplexityNetworkError(
        'Network error connecting to Perplexity API',
        context,
        error
      )
    }

    // API error
    if (error.statusCode || error.status) {
      return new PerplexityAPIError(
        error.message || 'Perplexity API request failed',
        context,
        error.statusCode || error.status,
        error.body || error.data,
        error.headers,
        error
      )
    }

    // Generic error
    return new PerplexityError(
      error.message || 'Unknown Perplexity error',
      'UNKNOWN_ERROR',
      context,
      error
    )
  }
}

/**
 * User-friendly error messages
 */
export function getUserFriendlyMessage(error: PerplexityError): string {
  switch (error.code) {
    case 'JSON_PARSE_ERROR':
      return 'We received an unexpected response format. Please try again.'
    
    case 'SCHEMA_VALIDATION_ERROR':
      return 'The AI response was incomplete. Please try again or contact support.'
    
    case 'API_REQUEST_ERROR':
      if (error.statusCode === 500) {
        return 'The AI service is temporarily unavailable. Please try again in a moment.'
      }
      if (error.statusCode === 401 || error.statusCode === 403) {
        return 'Authentication error. Please contact support.'
      }
      return 'An error occurred while processing your request. Please try again.'
    
    case 'RATE_LIMIT_ERROR':
      const rateLimitError = error as PerplexityRateLimitError
      if (rateLimitError.retryAfter) {
        return `Rate limit exceeded. Please try again in ${Math.ceil(rateLimitError.retryAfter / 60)} minutes.`
      }
      return 'Too many requests. Please wait a moment and try again.'
    
    case 'TIMEOUT_ERROR':
      return 'The request took too long to process. Please try again with a simpler query.'
    
    case 'NETWORK_ERROR':
      return 'Network connection error. Please check your internet connection and try again.'
    
    default:
      return 'An unexpected error occurred. Please try again or contact support.'
  }
}

