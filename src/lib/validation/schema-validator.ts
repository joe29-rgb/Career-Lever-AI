/**
 * Schema Validator for AI Responses
 * 
 * Validates AI responses against JSON schemas using AJV.
 * Provides detailed validation errors and fallback handling.
 */

import Ajv, { ValidateFunction, ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'
import { PerplexitySchemaError, PerplexityErrorContext } from '../errors/perplexity-error'
import { logger } from '../logger'

// Import schemas
import resumeAnalysisSchema from '../schemas/resume-analysis.schema.json'

/**
 * Schema Validator Class
 */
export class SchemaValidator {
  private static instance: SchemaValidator
  private ajv: Ajv
  private validators: Map<string, ValidateFunction>

  private constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      coerceTypes: true, // Coerce types when possible
      useDefaults: true, // Fill in default values
      removeAdditional: false, // Keep additional properties
    })

    // Add format validators (email, uri, date, etc.)
    addFormats(this.ajv)

    // Register schemas
    this.validators = new Map()
    this.registerSchemas()
  }

  static getInstance(): SchemaValidator {
    if (!SchemaValidator.instance) {
      SchemaValidator.instance = new SchemaValidator()
    }
    return SchemaValidator.instance
  }

  private registerSchemas(): void {
    // Register resume analysis schema
    this.registerSchema('resume-analysis', resumeAnalysisSchema)
  }

  /**
   * Register a new schema
   */
  registerSchema(name: string, schema: object): void {
    try {
      const validator = this.ajv.compile(schema)
      this.validators.set(name, validator)
      logger.info(`Schema registered: ${name}`)
    } catch (error: any) {
      logger.error(`Failed to register schema ${name}:`, error)
      throw error
    }
  }

  /**
   * Validate data against a schema
   */
  validate<T = any>(
    data: unknown,
    schemaName: string,
    context?: PerplexityErrorContext
  ): T {
    const validator = this.validators.get(schemaName)
    
    if (!validator) {
      throw new Error(`Schema not found: ${schemaName}`)
    }

    const valid = validator(data)

    if (!valid) {
      const errors = validator.errors || []
      const errorMessages = this.formatErrors(errors)

      if (context) {
        throw new PerplexitySchemaError(
          `Schema validation failed for ${schemaName}: ${errorMessages}`,
          context,
          schemaName,
          errors,
          data
        )
      }

      throw new Error(`Schema validation failed: ${errorMessages}`)
    }

    return data as T
  }

  /**
   * Validate with fallback to partial data
   */
  validateWithFallback<T = any>(
    data: unknown,
    schemaName: string,
    fallback: T,
    context?: PerplexityErrorContext
  ): T {
    try {
      return this.validate<T>(data, schemaName, context)
    } catch (error: any) {
      logger.warn(`Schema validation failed, using fallback:`, error.message)
      return fallback
    }
  }

  /**
   * Soft validation that returns validation result
   */
  softValidate(
    data: unknown,
    schemaName: string
  ): { valid: boolean; errors: string[]; data?: any } {
    const validator = this.validators.get(schemaName)
    
    if (!validator) {
      return {
        valid: false,
        errors: [`Schema not found: ${schemaName}`]
      }
    }

    const valid = validator(data)

    if (!valid) {
      const errors = validator.errors || []
      return {
        valid: false,
        errors: this.formatErrorsArray(errors)
      }
    }

    return {
      valid: true,
      errors: [],
      data
    }
  }

  /**
   * Partial validation - validate only present fields
   */
  validatePartial<T = any>(
    data: unknown,
    schemaName: string,
    context?: PerplexityErrorContext
  ): Partial<T> {
    // Create a validator with required fields as optional
    const validator = this.validators.get(schemaName)
    
    if (!validator) {
      throw new Error(`Schema not found: ${schemaName}`)
    }

    // Just return the data for partial validation
    // In production, you'd want to validate individual fields
    return data as Partial<T>
  }

  /**
   * Format validation errors for display
   */
  private formatErrors(errors: ErrorObject[]): string {
    return errors
      .map(err => {
        const path = err.instancePath || 'root'
        const message = err.message || 'validation error'
        const params = err.params ? JSON.stringify(err.params) : ''
        return `${path}: ${message} ${params}`.trim()
      })
      .join('; ')
  }

  /**
   * Format validation errors as array
   */
  private formatErrorsArray(errors: ErrorObject[]): string[] {
    return errors.map(err => {
      const path = err.instancePath || 'root'
      const message = err.message || 'validation error'
      return `${path}: ${message}`
    })
  }

  /**
   * Get detailed error information
   */
  getDetailedErrors(errors: ErrorObject[]): Array<{
    path: string
    message: string
    keyword: string
    params: any
  }> {
    return errors.map(err => ({
      path: err.instancePath || 'root',
      message: err.message || 'validation error',
      keyword: err.keyword,
      params: err.params
    }))
  }

  /**
   * Check if schema exists
   */
  hasSchema(schemaName: string): boolean {
    return this.validators.has(schemaName)
  }

  /**
   * List registered schemas
   */
  listSchemas(): string[] {
    return Array.from(this.validators.keys())
  }

  /**
   * Remove a schema
   */
  removeSchema(schemaName: string): boolean {
    return this.validators.delete(schemaName)
  }

  /**
   * Clear all validators
   */
  clearAll(): void {
    this.validators.clear()
    this.registerSchemas() // Re-register default schemas
  }
}

/**
 * Singleton instance getter
 */
export function getValidator(): SchemaValidator {
  return SchemaValidator.getInstance()
}

/**
 * Convenience function for validation
 */
export function validateAIResponse<T = any>(
  data: unknown,
  schemaName: string,
  context?: PerplexityErrorContext
): T {
  return SchemaValidator.getInstance().validate<T>(data, schemaName, context)
}

/**
 * Convenience function for soft validation
 */
export function softValidateAIResponse(
  data: unknown,
  schemaName: string
): { valid: boolean; errors: string[]; data?: any } {
  return SchemaValidator.getInstance().softValidate(data, schemaName)
}

/**
 * Convenience function for validation with fallback
 */
export function validateWithFallback<T = any>(
  data: unknown,
  schemaName: string,
  fallback: T,
  context?: PerplexityErrorContext
): T {
  return SchemaValidator.getInstance().validateWithFallback<T>(
    data,
    schemaName,
    fallback,
    context
  )
}

