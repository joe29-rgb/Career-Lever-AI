/**
 * Unified Career Finder Storage Manager
 * Eliminates localStorage key inconsistencies and race conditions
 */

import type { CompanyResearchResult } from './company-research-types'

export interface StoredJob {
  id?: string
  title: string
  company: string
  location: string
  salary?: string
  description?: string
  summary?: string
  url?: string
  postedDate?: string
  skills?: string[]
}

export interface StoredResume {
  _id?: string
  extractedText: string
  fileName?: string
  uploadDate?: string
  personalInfo?: any
}

export type StoredCompanyResearch = CompanyResearchResult

export interface StoredJobAnalysis {
  matchScore?: number
  matchingSkills: string[]
  missingSkills?: string[]
  skillsToHighlight?: string[]
  recommendations: string[]
  estimatedFit?: string
}

export class CareerFinderStorage {
  private static readonly KEYS = {
    SELECTED_JOB: 'cf:selectedJob',
    RESUME_DATA: 'cf:resume',
    COMPANY_RESEARCH: 'cf:companyResearch',
    JOB_ANALYSIS: 'cf:jobAnalysis',
    LOCATION: 'cf:location',
    KEYWORDS: 'cf:keywords',
    PROGRESS: 'cf:progress',
    SELECTED_RESUME_HTML: 'cf:selectedResumeHtml',
    SELECTED_VARIANT: 'cf:selectedVariant'
  } as const

  // ============= JOB MANAGEMENT =============

  static setJob(job: StoredJob): void {
    try {
      localStorage.setItem(this.KEYS.SELECTED_JOB, JSON.stringify(job))
      console.log('[STORAGE] Job saved:', job.title, '@', job.company)
    } catch (error) {
      console.error('[STORAGE] Failed to save job:', error)
    }
  }

  static getJob(): StoredJob | null {
    try {
      const stored = localStorage.getItem(this.KEYS.SELECTED_JOB)
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('[STORAGE] Job loaded:', parsed.title)
        return parsed
      }
    } catch (error) {
      console.error('[STORAGE] Failed to load job:', error)
    }
    return null
  }

  static clearJob(): void {
    try {
      localStorage.removeItem(this.KEYS.SELECTED_JOB)
      console.log('[STORAGE] Job cleared')
    } catch (error) {
      console.error('[STORAGE] Failed to clear job:', error)
    }
  }

  // ============= RESUME MANAGEMENT =============

  static setResume(resume: StoredResume): void {
    try {
      localStorage.setItem(this.KEYS.RESUME_DATA, JSON.stringify(resume))
      console.log('[STORAGE] Resume saved, text length:', resume.extractedText?.length || 0)
    } catch (error) {
      console.error('[STORAGE] Failed to save resume:', error)
    }
  }

  static getResume(): StoredResume | null {
    try {
      // Try unified key first
      const stored = localStorage.getItem(this.KEYS.RESUME_DATA)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.extractedText && parsed.extractedText.length > 100) {
          console.log('[STORAGE] Resume loaded from cf:resume')
          return parsed
        }
      }

      // Fallback to legacy keys
      const legacyKeys = ['uploadedResume', 'selectedResume']
      for (const key of legacyKeys) {
        try {
          const legacy = localStorage.getItem(key)
          if (legacy) {
            const parsed = JSON.parse(legacy)
            if (parsed.extractedText && parsed.extractedText.length > 100) {
              console.log('[STORAGE] Resume loaded from legacy key:', key)
              // Migrate to unified key
              this.setResume(parsed)
              return parsed
            }
          }
        } catch {}
      }
    } catch (error) {
      console.error('[STORAGE] Failed to load resume:', error)
    }
    return null
  }

  static clearResume(): void {
    try {
      localStorage.removeItem(this.KEYS.RESUME_DATA)
      // Also clear legacy keys
      localStorage.removeItem('uploadedResume')
      localStorage.removeItem('selectedResume')
      console.log('[STORAGE] Resume cleared')
    } catch (error) {
      console.error('[STORAGE] Failed to clear resume:', error)
    }
  }

  // ============= COMPANY RESEARCH MANAGEMENT =============

  static setCompanyResearch(data: StoredCompanyResearch): void {
    try {
      localStorage.setItem(this.KEYS.COMPANY_RESEARCH, JSON.stringify(data))
      console.log('[STORAGE] ✅ Company research saved:', data.company, `(${data.hiringContacts.length} contacts)`)
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to save company research:', error)
    }
  }

  static getCompanyResearch(): StoredCompanyResearch | null {
    try {
      const stored = localStorage.getItem(this.KEYS.COMPANY_RESEARCH)
      if (stored) {
        const parsed = JSON.parse(stored) as StoredCompanyResearch
        console.log('[STORAGE] ✅ Company research loaded:', parsed.company)
        return parsed
      }
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to load company research:', error)
    }
    return null
  }

  static clearCompanyResearch(): void {
    try {
      localStorage.removeItem(this.KEYS.COMPANY_RESEARCH)
      console.log('[STORAGE] ✅ Company research cleared')
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to clear company research:', error)
    }
  }

  // ============= JOB ANALYSIS MANAGEMENT =============

  static setJobAnalysis(analysis: StoredJobAnalysis): void {
    try {
      localStorage.setItem(this.KEYS.JOB_ANALYSIS, JSON.stringify(analysis))
      console.log('[STORAGE] ✅ Job analysis saved, match score:', analysis.matchScore)
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to save job analysis:', error)
    }
  }

  static getJobAnalysis(): StoredJobAnalysis | null {
    try {
      const stored = localStorage.getItem(this.KEYS.JOB_ANALYSIS)
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('[STORAGE] ✅ Job analysis loaded')
        return parsed
      }
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to load job analysis:', error)
    }
    return null
  }

  static clearJobAnalysis(): void {
    try {
      localStorage.removeItem(this.KEYS.JOB_ANALYSIS)
      console.log('[STORAGE] ✅ Job analysis cleared')
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to clear job analysis:', error)
    }
  }

  // ============= UTILITY METHODS =============

  static setLocation(location: string): void {
    try {
      localStorage.setItem(this.KEYS.LOCATION, location)
      console.log('[STORAGE] ✅ Location saved:', location)
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to save location:', error)
    }
  }

  static getLocation(): string | null {
    try {
      return localStorage.getItem(this.KEYS.LOCATION)
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to load location:', error)
      return null
    }
  }

  static setKeywords(keywords: string[]): void {
    try {
      localStorage.setItem(this.KEYS.KEYWORDS, JSON.stringify(keywords))
      console.log('[STORAGE] ✅ Keywords saved:', keywords.length, 'keywords')
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to save keywords:', error)
    }
  }

  static getKeywords(): string[] | null {
    try {
      const stored = localStorage.getItem(this.KEYS.KEYWORDS)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to load keywords:', error)
    }
    return null
  }

  static setProgress(step: number, total: number = 7): void {
    try {
      localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify({ step, total }))
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to save progress:', error)
    }
  }

  static getProgress(): { step: number; total: number } | null {
    try {
      const stored = localStorage.getItem(this.KEYS.PROGRESS)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to load progress:', error)
    }
    return null
  }

  static setTemplate(template: string): void {
    try {
      localStorage.setItem('cf:selectedTemplate', template)
      console.log('[STORAGE] ✅ Template saved:', template)
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to save template:', error)
    }
  }

  static getTemplate(): string | null {
    try {
      return localStorage.getItem('cf:selectedTemplate')
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to load template:', error)
      return null
    }
  }

  static setTone(tone: string): void {
    try {
      localStorage.setItem('cf:tone', tone)
      console.log('[STORAGE] ✅ Tone saved:', tone)
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to save tone:', error)
    }
  }

  static getTone(): string | null {
    try {
      return localStorage.getItem('cf:tone')
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to load tone:', error)
      return null
    }
  }

  // ============= BULK OPERATIONS =============

  static clearAll(): void {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      // Also clear legacy keys
      localStorage.removeItem('uploadedResume')
      localStorage.removeItem('selectedResume')
      localStorage.removeItem('selectedJob')
      console.log('[STORAGE] ✅ All Career Finder data cleared')
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to clear all data:', error)
    }
  }

  static exportAll(): Record<string, any> {
    try {
      const data: Record<string, any> = {}
      Object.entries(this.KEYS).forEach(([name, key]) => {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            data[name] = JSON.parse(value)
          } catch {
            data[name] = value
          }
        }
      })
      console.log('[STORAGE] ✅ Exported all data')
      return data
    } catch (error) {
      console.error('[STORAGE] ❌ Failed to export data:', error)
      return {}
    }
  }

  static getDebugInfo(): string {
    try {
      const job = this.getJob()
      const resume = this.getResume()
      const company = this.getCompanyResearch()
      const analysis = this.getJobAnalysis()
      const location = this.getLocation()
      const keywords = this.getKeywords()
      
      return `
📊 Career Finder Storage Debug Info:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Job: ${job ? `${job.title} @ ${job.company}` : '❌ None'}
Resume: ${resume ? `✅ ${resume.extractedText.length} chars` : '❌ None'}
Company: ${company ? `✅ ${company.company} (${company.hiringContacts.length} contacts)` : '❌ None'}
Analysis: ${analysis ? `✅ ${analysis.matchScore || 'N/A'}% match` : '❌ None'}
Location: ${location || '❌ None'}
Keywords: ${keywords ? `✅ ${keywords.length} keywords` : '❌ None'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim()
    } catch (error) {
      return `❌ Failed to generate debug info: ${error}`
    }
  }
}

// Export singleton instance for convenience
export default CareerFinderStorage

