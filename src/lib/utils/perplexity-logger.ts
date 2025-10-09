/**
 * Perplexity Debug Logger
 * Captures raw LLM responses, cleanup steps, and parse errors for debugging
 */

export interface PerplexityLogEntry {
  timestamp: number
  requestId: string
  method: string
  rawContent: string
  cleanupSteps: string[]
  finalJson?: string
  parseError?: string
  parseErrorContext?: string
  success: boolean
}

class PerplexityLogger {
  private logs: PerplexityLogEntry[] = []
  private maxLogs = 100

  log(entry: Omit<PerplexityLogEntry, 'timestamp'>): void {
    const fullEntry: PerplexityLogEntry = {
      ...entry,
      timestamp: Date.now()
    }
    
    this.logs.unshift(fullEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs.pop()
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development' || process.env.PERPLEXITY_DEBUG === 'true') {
      console.log('[PERPLEXITY_RAW]', {
        method: entry.method,
        requestId: entry.requestId,
        contentPreview: entry.rawContent.slice(0, 200),
        success: entry.success
      })
      
      if (entry.cleanupSteps.length > 0) {
        console.log('[PERPLEXITY_CLEANUP]', entry.cleanupSteps)
      }
      
      if (entry.parseError) {
        console.error('[PERPLEXITY_PARSE_ERROR]', {
          error: entry.parseError,
          context: entry.parseErrorContext
        })
      }
    }
  }

  getLogs(limit: number = 20): PerplexityLogEntry[] {
    return this.logs.slice(0, limit)
  }

  getFailedLogs(): PerplexityLogEntry[] {
    return this.logs.filter(log => !log.success)
  }

  clear(): void {
    this.logs = []
  }
}

export const perplexityLogger = new PerplexityLogger()

/**
 * Extract detailed error context from JSON parse failure
 */
export function getParseErrorContext(content: string, error: Error): string {
  const posMatch = /position\s+(\d+)/.exec(error.message)
  if (!posMatch) return 'Unknown position'
  
  const pos = parseInt(posMatch[1])
  const start = Math.max(0, pos - 50)
  const end = Math.min(content.length, pos + 50)
  const context = content.substring(start, end)
  
  return JSON.stringify({
    position: pos,
    context: context,
    before: content.substring(start, pos),
    after: content.substring(pos, end)
  })
}

