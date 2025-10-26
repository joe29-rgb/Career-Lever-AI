/**
 * AGENT ORCHESTRATOR
 * Manages all agents and routes tasks with parallel execution
 */

import { JobDiscoveryAgent } from './job-discovery-agent'
import { ContactResearchAgent } from './contact-research-agent'
import { AgentTask, AgentResult } from './base-agent'

export class AgentOrchestrator {
  private jobAgent: JobDiscoveryAgent
  private contactAgent: ContactResearchAgent

  constructor() {
    console.log('🤖 [ORCHESTRATOR] Initializing agent system...')
    this.jobAgent = new JobDiscoveryAgent()
    this.contactAgent = new ContactResearchAgent()
    console.log('✅ [ORCHESTRATOR] All agents ready')
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    console.log(`🎯 [ORCHESTRATOR] Routing task: ${task.type} (priority: ${task.priority})`)
    console.log(`📋 [ORCHESTRATOR] Task input:`, task.input)

    const started = Date.now()

    try {
      let result: AgentResult

      switch (task.type) {
        case 'job_search':
          result = await this.jobAgent.execute(task)
          break
        
        case 'contact_research':
          result = await this.contactAgent.execute(task)
          break
        
        default:
          throw new Error(`Unknown task type: ${task.type}`)
      }

      const duration = Date.now() - started
      console.log(`✅ [ORCHESTRATOR] Task completed in ${duration}ms`)
      console.log(`📊 [ORCHESTRATOR] Success: ${result.success}, Confidence: ${result.confidence}`)

      return result
    } catch (error) {
      const duration = Date.now() - started
      console.error(`❌ [ORCHESTRATOR] Task failed after ${duration}ms:`, error)
      
      return {
        success: false,
        data: null,
        reasoning: `Task failed: ${(error as Error).message}`,
        confidence: 0,
        sources: [],
        duration
      }
    }
  }

  async executeMultiple(tasks: AgentTask[]): Promise<AgentResult[]> {
    console.log(`🚀 [ORCHESTRATOR] Executing ${tasks.length} tasks in parallel...`)
    
    const started = Date.now()
    
    // Execute tasks in parallel
    const results = await Promise.all(
      tasks.map(task => this.executeTask(task))
    )
    
    const duration = Date.now() - started
    const successful = results.filter(r => r.success).length
    
    console.log(`✅ [ORCHESTRATOR] Parallel execution complete in ${duration}ms`)
    console.log(`📊 [ORCHESTRATOR] ${successful}/${tasks.length} tasks succeeded`)
    
    return results
  }

  async executeSequential(tasks: AgentTask[]): Promise<AgentResult[]> {
    console.log(`🔄 [ORCHESTRATOR] Executing ${tasks.length} tasks sequentially...`)
    
    const started = Date.now()
    const results: AgentResult[] = []
    
    for (const task of tasks) {
      const result = await this.executeTask(task)
      results.push(result)
      
      // Stop if critical task fails
      if (task.priority === 1 && !result.success) {
        console.warn(`⚠️ [ORCHESTRATOR] Critical task failed, stopping sequence`)
        break
      }
    }
    
    const duration = Date.now() - started
    const successful = results.filter(r => r.success).length
    
    console.log(`✅ [ORCHESTRATOR] Sequential execution complete in ${duration}ms`)
    console.log(`📊 [ORCHESTRATOR] ${successful}/${results.length} tasks succeeded`)
    
    return results
  }

  generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
