/**
 * AI Response Parser
 * 
 * Unified JSON extraction and parsing for AI responses.
 * Handles multiple formats, markdown wrappers, and malformed JSON.
 */

import { PerplexityJSONError, PerplexityErrorContext } from '../errors/perplexity-error'

export interface ParseOptions {
  allowPartial?: boolean
  stripMarkdown?: boolean
  extractFirst?: boolean
  throwOnError?: boolean
}

export interface ParseResult<T> {
  success: boolean
  data?: T
  error?: string
  attempts: string[]
  strategy?: string
}

/**
 * AI Response Parser Class
 */
export class AIResponseParser {
  /**
   * Main parsing method with multiple fallback strategies
   */
  static parse<T = any>(
    text: string,
    options: ParseOptions = {},
    context?: PerplexityErrorContext
  ): T {
    const {
      allowPartial = false,
      stripMarkdown = true,
      extractFirst = true,
      throwOnError = true
    } = options

    const attempts: string[] = []
    let cleaned = text

    // Strategy 1: Direct JSON.parse
    try {
      const result = JSON.parse(text)
      attempts.push('direct_parse')
      return result as T
    } catch (e) {
      attempts.push('direct_parse_failed')
    }

    // Strategy 2: Strip markdown code fences
    if (stripMarkdown) {
      cleaned = this.cleanMarkdown(text)
      try {
        const result = JSON.parse(cleaned)
        attempts.push('markdown_strip_success')
        return result as T
      } catch (e) {
        attempts.push('markdown_strip_failed')
      }
    }

    // Strategy 3: Extract first JSON object/array
    if (extractFirst) {
      const extracted = this.extractJSON(cleaned)
      if (extracted) {
        try {
          const result = JSON.parse(extracted)
          attempts.push('regex_extract_success')
          return result as T
        } catch (e) {
          attempts.push('regex_extract_failed')
        }
      }
    }

    // Strategy 4: Extract code blocks
    const codeBlocks = this.extractCodeBlocks(text)
    for (let i = 0; i < codeBlocks.length; i++) {
      try {
        const result = JSON.parse(codeBlocks[i])
        attempts.push(`code_block_${i}_success`)
        return result as T
      } catch (e) {
        attempts.push(`code_block_${i}_failed`)
      }
    }

    // Strategy 5: Line-by-line parsing for partial JSON
    if (allowPartial) {
      const partial = this.parsePartialJSON(cleaned)
      if (partial) {
        attempts.push('partial_parse_success')
        return partial as T
      }
      attempts.push('partial_parse_failed')
    }

    // Strategy 6: Line-by-line job reconstruction (for Perplexity job responses)
    const lineByLineJobs = this.parseJobsLineByLine(text)
    if (lineByLineJobs.length > 0) {
      attempts.push('line_by_line_success')
      return lineByLineJobs as T
    }
    attempts.push('line_by_line_failed')

    // Strategy 7: Regex pattern matching for jobs
    const regexJobs = this.parseJobsRegexPattern(text)
    if (regexJobs.length > 0) {
      attempts.push('regex_pattern_success')
      return regexJobs as T
    }
    attempts.push('regex_pattern_failed')

    // Strategy 8: Aggressive cleanup and retry
    const aggressive = this.aggressiveCleanup(text)
    if (aggressive !== text) {
      try {
        const result = JSON.parse(aggressive)
        attempts.push('aggressive_cleanup_success')
        return result as T
      } catch (e) {
        attempts.push('aggressive_cleanup_failed')
      }
    }

    // All strategies failed
    if (throwOnError && context) {
      throw new PerplexityJSONError(
        'Failed to parse AI response JSON after trying all strategies',
        context,
        text,
        attempts
      )
    }

    if (throwOnError) {
      throw new Error(`JSON parsing failed after ${attempts.length} attempts: ${attempts.join(', ')}`)
    }

    throw new Error('Unable to parse JSON from AI response')
  }

  /**
   * Safe parse that returns a result object instead of throwing
   */
  static safeParse<T = any>(
    text: string,
    options: ParseOptions = {}
  ): ParseResult<T> {
    try {
      const data = this.parse<T>(text, { ...options, throwOnError: false })
      return {
        success: true,
        data,
        attempts: ['successful']
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        attempts: error.parseAttempts || ['unknown']
      }
    }
  }

  /**
   * Clean markdown code fences and formatting
   */
  static cleanMarkdown(text: string): string {
    return text
      // Remove markdown code fences
      .replace(/^```(?:json|javascript|typescript)?\s*/gm, '')
      .replace(/^```\s*$/gm, '')
      // Remove backticks
      .replace(/`/g, '')
      // Trim whitespace
      .trim()
  }

  /**
   * Extract first JSON object or array using regex
   */
  static extractJSON(text: string): string | null {
    // Try to find JSON object
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      return objectMatch[0]
    }

    // Try to find JSON array
    const arrayMatch = text.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      return arrayMatch[0]
    }

    return null
  }

  /**
   * Extract code blocks from markdown
   */
  static extractCodeBlocks(text: string): string[] {
    const codeBlockRegex = /```(?:json|javascript|typescript)?\s*([\s\S]*?)```/g
    const blocks: string[] = []
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push(match[1].trim())
    }

    return blocks
  }

  /**
   * Attempt to parse partial/incomplete JSON
   */
  static parsePartialJSON(text: string): any | null {
    try {
      // Try to find the last complete object/array
      let depth = 0
      let start = -1
      let lastComplete = -1

      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        
        if (char === '{' || char === '[') {
          if (depth === 0) start = i
          depth++
        } else if (char === '}' || char === ']') {
          depth--
          if (depth === 0 && start !== -1) {
            lastComplete = i
            const substring = text.substring(start, i + 1)
            try {
              return JSON.parse(substring)
            } catch (e) {
              // Continue looking
            }
          }
        }
      }
    } catch (e) {
      return null
    }

    return null
  }

  /**
   * Line-by-line job object reconstruction for severely broken JSON
   * Specifically designed for Perplexity job listing responses
   */
  static parseJobsLineByLine(text: string): any[] {
    const lines = text.split('\n')
    let currentJob: any = null
    const extractedJobs: any[] = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Start of new job
      if (trimmed.includes('"title":')) {
        if (currentJob && currentJob.title && currentJob.company) {
          extractedJobs.push(currentJob)
        }
        currentJob = {}
        
        // Extract title
        const titleMatch = trimmed.match(/"title":\s*"([^"]+)"/)
        if (titleMatch) currentJob.title = titleMatch[1]
      }
      
      if (!currentJob) continue
      
      // Extract company
      if (trimmed.includes('"company":')) {
        const companyMatch = trimmed.match(/"company":\s*"([^"]+)"/)
        if (companyMatch) currentJob.company = companyMatch[1]
      }
      
      // Extract location
      if (trimmed.includes('"location":')) {
        const locMatch = trimmed.match(/"location":\s*"([^"]+)"/)
        if (locMatch) currentJob.location = locMatch[1]
      }
      
      // Extract URL
      if (trimmed.includes('"url":')) {
        const urlMatch = trimmed.match(/"url":\s*"([^"]+)"/)
        if (urlMatch) currentJob.url = urlMatch[1]
      }
      
      // Extract summary
      if (trimmed.includes('"summary":')) {
        const summaryMatch = trimmed.match(/"summary":\s*"([^"]+)"/)
        if (summaryMatch) currentJob.summary = summaryMatch[1]
      }
      
      // Extract salary
      if (trimmed.includes('"salary":')) {
        const salaryMatch = trimmed.match(/"salary":\s*(?:"([^"]+)"|null)/)
        if (salaryMatch) currentJob.salary = salaryMatch[1] || null
      }
      
      // Extract source
      if (trimmed.includes('"source":')) {
        const sourceMatch = trimmed.match(/"source":\s*"([^"]+)"/)
        if (sourceMatch) currentJob.source = sourceMatch[1]
      }
      
      // Extract postedDate
      if (trimmed.includes('"postedDate":')) {
        const dateMatch = trimmed.match(/"postedDate":\s*"([^"]+)"/)
        if (dateMatch) currentJob.postedDate = dateMatch[1]
      }
    }
    
    // Add last job
    if (currentJob && currentJob.title && currentJob.company) {
      extractedJobs.push(currentJob)
    }
    
    return extractedJobs
  }

  /**
   * Regex pattern matching for job objects as last resort
   */
  static parseJobsRegexPattern(text: string): any[] {
    const jobPattern = /"title":\s*"([^"]+)"[\s\S]*?"company":\s*"([^"]+)"[\s\S]*?"location":\s*"([^"]+)"[\s\S]*?"url":\s*"([^"]+)"/g
    const matches = [...text.matchAll(jobPattern)]
    
    if (matches.length > 0) {
      return matches.map(match => ({
        title: match[1],
        company: match[2],
        location: match[3],
        url: match[4],
        source: 'perplexity',
        postedDate: new Date().toISOString().split('T')[0],
        summary: '' // Will need enrichment
      }))
    }
    
    return []
  }

  /**
   * Aggressive cleanup for malformed JSON
   */
  static aggressiveCleanup(text: string): string {
    return text
      // Remove non-JSON content before first { or [
      .replace(/^[^{\[]*/, '')
      // Remove non-JSON content after last } or ]
      .replace(/[^}\]]*$/, '')
      // Fix common formatting issues
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
      .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Quote unquoted keys
      .replace(/:\s*'([^']*)'/g, ':"$1"') // Convert single quotes to double
      .replace(/\\'/g, "'") // Unescape single quotes
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim()
  }

  /**
   * Validate if text contains parseable JSON
   */
  static hasJSON(text: string): boolean {
    return /[{\[][\s\S]*[}\]]/.test(text)
  }

  /**
   * Extract multiple JSON objects/arrays from text
   */
  static extractMultiple(text: string): any[] {
    const results: any[] = []
    
    // Try to extract all objects
    const objectRegex = /\{[^{}]*\}/g
    let match
    while ((match = objectRegex.exec(text)) !== null) {
      try {
        results.push(JSON.parse(match[0]))
      } catch (e) {
        // Skip invalid JSON
      }
    }

    // Try to extract all arrays
    const arrayRegex = /\[[^\[\]]*\]/g
    while ((match = arrayRegex.exec(text)) !== null) {
      try {
        results.push(JSON.parse(match[0]))
      } catch (e) {
        // Skip invalid JSON
      }
    }

    return results
  }

  /**
   * Pretty print JSON for debugging
   */
  static prettyPrint(obj: any, indent: number = 2): string {
    try {
      return JSON.stringify(obj, null, indent)
    } catch (e) {
      return String(obj)
    }
  }

  /**
   * Estimate JSON completeness (0-1 score)
   */
  static estimateCompleteness(text: string): number {
    const openBraces = (text.match(/\{/g) || []).length
    const closeBraces = (text.match(/\}/g) || []).length
    const openBrackets = (text.match(/\[/g) || []).length
    const closeBrackets = (text.match(/\]/g) || []).length

    const braceMatch = openBraces === 0 ? 1 : Math.min(closeBraces / openBraces, 1)
    const bracketMatch = openBrackets === 0 ? 1 : Math.min(closeBrackets / openBrackets, 1)

    return (braceMatch + bracketMatch) / 2
  }
}

/**
 * Convenience function for quick parsing
 */
export function parseAIResponse<T = any>(
  text: string,
  options?: ParseOptions,
  context?: PerplexityErrorContext
): T {
  return AIResponseParser.parse<T>(text, options, context)
}

/**
 * Safe parse convenience function
 */
export function safeParseAIResponse<T = any>(
  text: string,
  options?: ParseOptions
): ParseResult<T> {
  return AIResponseParser.safeParse<T>(text, options)
}

