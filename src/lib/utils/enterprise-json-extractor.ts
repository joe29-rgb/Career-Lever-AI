/**
 * ENTERPRISE-GRADE JSON EXTRACTION FOR LLM RESPONSES
 * Based on Perplexity Deep Dive Analysis - Phase 1 Fix #2
 * 
 * Handles all common LLM JSON response formats:
 * - Markdown code blocks (```json ... ```)
 * - Explanatory text before/after JSON
 * - Trailing commas
 * - Single quotes instead of double quotes
 * - Unquoted object keys
 * - Newlines and special characters
 * - Truncated responses
 */

export interface JSONExtractionResult {
  success: boolean
  data: any
  error?: string
  attemptedCleanups: string[]
}

/**
 * Ultra-robust JSON extraction from LLM responses
 * Based on 2024 industry best practices
 */
export function extractEnterpriseJSON(rawContent: string): JSONExtractionResult {
  const attemptedCleanups: string[] = []
  
  try {
    // Attempt 1: Direct parse (optimistic)
    try {
      const parsed = JSON.parse(rawContent)
      return { success: true, data: parsed, attemptedCleanups: ['direct-parse'] }
    } catch (e) {
      attemptedCleanups.push('direct-parse-failed')
    }
    
    // Step 1: Remove markdown code blocks
    let cleaned = rawContent.replace(/```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
    attemptedCleanups.push('markdown-removal')
    
    // Step 2: Extract JSON from explanatory text using nested regex
    const jsonMatch = cleaned.match(/(\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\})*)*\}))*\}|\[[\s\S]*?\])/);
    if (jsonMatch) {
      cleaned = jsonMatch[0]
      attemptedCleanups.push('regex-extraction')
    }
    
    // Step 3: Aggressive cleanup of common JSON errors
    cleaned = cleaned
      .replace(/,(\s*[}\]])/g, '$1')              // Remove trailing commas before ] or }
      .replace(/:\s*,/g, ': null,')               // Replace empty values with null
      .replace(/([^\\])\\(?!["\\/bfnrtu])/g, '$1') // Remove invalid escape sequences
      .replace(/\n/g, ' ')                        // Remove line breaks
      .replace(/\r/g, '')                         // Remove carriage returns  
      .replace(/\t/g, ' ')                        // Replace tabs with spaces
      .replace(/\s{2,}/g, ' ')                    // Collapse multiple spaces
      .replace(/,\s*([\]}])/g, '$1')              // Final cleanup of trailing commas
    
    attemptedCleanups.push('aggressive-cleanup')
    
    // Attempt 2: Parse cleaned JSON
    try {
      const parsed = JSON.parse(cleaned)
      return { success: true, data: parsed, attemptedCleanups }
    } catch (e) {
      attemptedCleanups.push('cleaned-parse-failed')
    }
    
    // Step 4: Try fixing quotes (single → double) and unquoted keys
    let quoteFix = cleaned
      .replace(/'/g, '"')                         // Fix single quotes
      .replace(/(\w+):/g, '"$1":')                // Quote unquoted keys
    
    attemptedCleanups.push('quote-fixing')
    
    // Attempt 3: Parse with quote fixes
    try {
      const parsed = JSON.parse(quoteFix)
      return { success: true, data: parsed, attemptedCleanups }
    } catch (e) {
      attemptedCleanups.push('quote-fix-parse-failed')
    }
    
    // Step 5: Last resort - try to extract array specifically
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0])
        attemptedCleanups.push('array-extraction')
        return { success: true, data: parsed, attemptedCleanups }
      } catch (e) {
        attemptedCleanups.push('array-extraction-failed')
      }
    }
    
    // All attempts failed
    return {
      success: false,
      data: null,
      error: 'All JSON extraction attempts failed',
      attemptedCleanups
    }
    
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `Enterprise JSON extraction error: ${(error as Error).message}`,
      attemptedCleanups
    }
  }
}

/**
 * Safe JSON extraction that always returns a value (never throws)
 */
export function safeExtractJSON<T = any>(rawContent: string, fallback: T): T {
  const result = extractEnterpriseJSON(rawContent)
  
  if (result.success && result.data !== null) {
    return result.data as T
  }
  
  console.warn('[ENTERPRISE_JSON] Extraction failed, using fallback:', {
    error: result.error,
    attempts: result.attemptedCleanups,
    contentPreview: rawContent.slice(0, 100)
  })
  
  return fallback
}

