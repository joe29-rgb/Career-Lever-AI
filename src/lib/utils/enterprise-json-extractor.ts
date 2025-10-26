/**
 * ENTERPRISE JSON EXTRACTOR
 * 
 * 5-stage fallback pipeline for extracting JSON from AI responses
 * Handles markdown, malformed JSON, partial responses, and edge cases
 * 
 * Used by: Perplexity AI responses, external APIs, any JSON parsing
 */

export interface ExtractionResult<T = any> {
  success: boolean
  data: T | null
  error?: string
  attemptedCleanups: string[]
  rawContent?: string
}

/**
 * Main extraction function with 5-stage fallback pipeline
 * WITH ENHANCED DEBUG LOGGING (Perplexity recommendation)
 */
export function extractEnterpriseJSON<T = any>(content: string, debug = false): ExtractionResult<T> {
  const attemptedCleanups: string[] = []
  let workingContent = content.trim()
  
  // DEBUG: Log before cleanup
  if (debug || process.env.PERPLEXITY_DEBUG === 'true') {
    console.log('[EXTRACT_JSON] Before cleanup:', content.slice(0, 200))
  }
  
  if (!workingContent) {
    return {
      success: false,
      data: null,
      error: 'Empty content provided',
      attemptedCleanups: ['empty-check'],
      rawContent: content
    }
  }

  // STAGE 1: Remove markdown code blocks
  if (workingContent.includes('```')) {
    workingContent = workingContent
      .replace(/```(?:json|javascript|js)?\s*/gi, '')
      .replace(/```\s*/g, '')
    attemptedCleanups.push('markdown-removal')
    
    // DEBUG: Log after markdown removal
    if (debug) {
      console.log('[EXTRACT_JSON] After markdown removal:', workingContent.slice(0, 200))
    }
  }

  // STAGE 2: Extract JSON array or object
  const arrayMatch = workingContent.match(/(\[[\s\S]*\])/);
  const objectMatch = workingContent.match(/(\{[\s\S]*\})/);
  
  if (arrayMatch) {
    workingContent = arrayMatch[1]
    attemptedCleanups.push('array-extraction')
    
    // DEBUG: Log matched JSON
    if (debug) {
      console.log('[EXTRACT_JSON] Matched JSON array:', workingContent.slice(0, 200))
    }
  } else if (objectMatch) {
    workingContent = objectMatch[1]
    attemptedCleanups.push('object-extraction')
    
    // DEBUG: Log matched JSON
    if (debug) {
      console.log('[EXTRACT_JSON] Matched JSON object:', workingContent.slice(0, 200))
    }
  }

  // STAGE 3: Fix common JSON issues
  workingContent = cleanupJSON(workingContent)
  attemptedCleanups.push('json-cleanup')
  
  // DEBUG: Log after regex fixes
  if (debug) {
    console.log('[EXTRACT_JSON] After regex fixes:', workingContent.slice(0, 200))
  }

  // STAGE 4: Attempt JSON parsing
  try {
    const parsed = JSON.parse(workingContent)
    return {
      success: true,
      data: parsed,
      attemptedCleanups
    }
  } catch (parseError) {
    attemptedCleanups.push('initial-parse-failed')
    
    // DEBUG: Capture parse error details with context
    if (parseError instanceof Error) {
      const posMatch = /position\s+(\d+)/.exec(parseError.message)
      const pos = posMatch ? parseInt(posMatch[1]) : 0
      const context = workingContent.substring(Math.max(0, pos - 20), Math.min(workingContent.length, pos + 100))
      
      console.error('[JSON PARSE ERROR]', parseError.message, 'context:', JSON.stringify(context))
    }
    
    // STAGE 5: Aggressive partial extraction
    const partialResult = extractPartialJSON<T>(workingContent, attemptedCleanups)
    if (partialResult.success) {
      return partialResult
    }
    
    return {
      success: false,
      data: null,
      error: `JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      attemptedCleanups: [...attemptedCleanups, 'all-attempts-failed'],
      rawContent: content.slice(0, 500) // First 500 chars for debugging
    }
  }
}

/**
 * Clean up common JSON formatting issues
 */
function cleanupJSON(content: string): string {
  return content
    // Remove BOM and special characters
    .replace(/^\uFEFF/, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    
    // Fix trailing commas
    .replace(/,(\s*[\]}])/g, '$1')
    
    // Fix unescaped quotes in strings (basic)
    .replace(/"([^"]*)"([^",\]}]*)"([^"]*)":/g, '"$1\\"$2\\"$3":')
    
    // Fix missing quotes around object keys
    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
    
    // Fix single quotes to double quotes
    .replace(/'([^']*)':/g, '"$1":')
    
    // Remove comments (// and /* */)
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    
    // Fix NaN, Infinity, undefined
    .replace(/:\s*NaN/g, ': null')
    .replace(/:\s*Infinity/g, ': null')
    .replace(/:\s*undefined/g, ': null')
}

/**
 * Extract partial JSON by walking through character by character
 */
function extractPartialJSON<T>(content: string, attemptedCleanups: string[]): ExtractionResult<T> {
  try {
    let braceCount = 0
    let bracketCount = 0
    let validJson = ''
    let inString = false
    let escaped = false
    let startChar = ''

    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      
      // Handle escape sequences
      if (escaped) {
        escaped = false
        validJson += char
        continue
      }
      
      if (char === '\\' && inString) {
        escaped = true
        validJson += char
        continue
      }
      
      // Handle string boundaries
      if (char === '"' && !escaped) {
        inString = !inString
        validJson += char
        continue
      }
      
      // Only count braces/brackets outside of strings
      if (!inString) {
        if (char === '{') {
          if (!startChar) startChar = '{'
          braceCount++
        } else if (char === '}') {
          braceCount--
        } else if (char === '[') {
          if (!startChar) startChar = '['
          bracketCount++
        } else if (char === ']') {
          bracketCount--
        }
      }
      
      validJson += char
      
      // Check if we've closed all braces/brackets
      const isComplete = braceCount === 0 && bracketCount === 0 && validJson.trim().length > 0
      const hasValidStart = startChar === '{' || startChar === '['
      
      if (isComplete && hasValidStart) {
        try {
          const parsed = JSON.parse(validJson.trim())
          return {
            success: true,
            data: parsed,
            attemptedCleanups: [...attemptedCleanups, 'partial-extraction-success']
          }
        } catch {
          // Continue building if this chunk didn't parse
          continue
        }
      }
    }
    
    throw new Error('No valid complete JSON found')
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Partial extraction failed',
      attemptedCleanups: [...attemptedCleanups, 'partial-extraction-failed']
    }
  }
}

/**
 * Validate that extracted data is an array
 */
export function ensureArray<T>(data: any): T[] {
  if (Array.isArray(data)) {
    return data
  }
  if (data && typeof data === 'object') {
    // Check if it's an object with array-like properties
    const keys = Object.keys(data)
    if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
      return Object.values(data)
    }
    // Single object - wrap in array
    return [data]
  }
  return []
}

/**
 * Validate that extracted data is an object
 */
export function ensureObject<T extends object>(data: any): T | null {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data) && data.length > 0) {
    return data[0]
  }
  return null
}

/**
 * Extract JSON with type safety and fallback
 */
export function extractWithFallback<T>(
  content: string,
  fallback: T,
  validator?: (data: any) => data is T
): T {
  const result = extractEnterpriseJSON<T>(content)
  
  if (!result.success || !result.data) {
    console.warn('[ENTERPRISE_JSON] Extraction failed, using fallback:', result.error)
    return fallback
  }
  
  if (validator && !validator(result.data)) {
    console.warn('[ENTERPRISE_JSON] Validation failed, using fallback')
    return fallback
  }
  
  return result.data
}
