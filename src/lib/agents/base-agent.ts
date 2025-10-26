/**
 * BASE AGENT CLASS
 * All Career Lever agents inherit from this
 */

import { PerplexityService } from '../perplexity-service'

export interface AgentTask {
  id: string
  type: 'job_search' | 'contact_research' | 'company_intel' | 'resume_optimize' | 'outreach'
  input: Record<string, any>
  priority: 1 | 2 | 3
}

export interface AgentResult<T = any> {
  success: boolean
  data: T
  reasoning: string // Why the agent made its decisions
  confidence: number // 0-1
  sources: Array<{ title: string; url: string }>
  duration: number
  method?: string
}

export abstract class BaseAgent {
  protected perplexity: PerplexityService
  protected name: string
  
  constructor(name: string) {
    this.name = name
    this.perplexity = new PerplexityService()
  }

  abstract execute(task: AgentTask): Promise<AgentResult>

  protected async think(prompt: string, options?: { temperature?: number; maxTokens?: number; model?: string }): Promise<string> {
    console.log(`🤖 [${this.name}] Starting autonomous thinking...`)
    
    // Agent's "thinking" process using Perplexity with web_search
    const systemPrompt = `You are ${this.name}, an autonomous AI agent with web search capabilities.

CRITICAL INSTRUCTIONS:
1. You MUST use the web_search tool to find real-time information
2. Visit actual URLs and extract real data
3. Do NOT make up information
4. Provide detailed reasoning for your decisions
5. Return structured JSON data when requested
6. If you cannot find information, say so explicitly

You have access to:
- web_search: Search the internet and visit URLs
- Real-time data from job boards, LinkedIn, company websites
- Ability to extract and structure information`

    const response = await this.perplexity.makeRequest(
      systemPrompt,
      prompt,
      { 
        temperature: options?.temperature ?? 0.2, // Low temp = more factual
        maxTokens: options?.maxTokens ?? 8000,
        model: options?.model ?? 'sonar-pro'
      }
    )
    
    console.log(`✅ [${this.name}] Thinking complete (${response.content.length} chars)`)
    return response.content
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📋'
    console.log(`${emoji} [${this.name.toUpperCase()}] ${message}`)
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
