/**
 * Application Tracking System
 * Track job applications, status, and history
 */

export interface Application {
  id: string
  jobId: string
  jobTitle: string
  company: string
  appliedAt: string
  status: 'applied' | 'interview' | 'rejected' | 'offer' | 'accepted'
  resumeVariant: 'A' | 'B'
  coverLetterVariant: 'A' | 'B'
  notes?: string
  followUpDate?: string
}

export class ApplicationTracker {
  private static STORAGE_KEY = 'cf:applications'
  
  /**
   * Track a new application
   */
  static trackApplication(
    job: { id?: string; title: string; company: string },
    resumeVariant: 'A' | 'B',
    coverLetterVariant: 'A' | 'B'
  ): Application {
    const applications = this.getAll()
    
    const newApp: Application = {
      id: this.generateId(),
      jobId: job.id || this.generateId(),
      jobTitle: job.title,
      company: job.company,
      appliedAt: new Date().toISOString(),
      status: 'applied',
      resumeVariant,
      coverLetterVariant
    }
    
    applications.push(newApp)
    this.save(applications)
    
    // Also mark job as applied in search results
    this.markJobApplied(newApp.jobId, newApp.appliedAt)
    
    return newApp
  }
  
  /**
   * Get all applications
   */
  static getAll(): Application[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }
  
  /**
   * Get application by ID
   */
  static getById(id: string): Application | undefined {
    return this.getAll().find(app => app.id === id)
  }
  
  /**
   * Check if already applied to a job
   */
  static hasApplied(jobId: string): boolean {
    return this.getAll().some(app => app.jobId === jobId)
  }
  
  /**
   * Update application status
   */
  static updateStatus(id: string, status: Application['status'], notes?: string): void {
    const applications = this.getAll()
    const index = applications.findIndex(app => app.id === id)
    
    if (index !== -1) {
      applications[index].status = status
      if (notes) applications[index].notes = notes
      this.save(applications)
    }
  }
  
  /**
   * Add follow-up date
   */
  static setFollowUp(id: string, date: string): void {
    const applications = this.getAll()
    const index = applications.findIndex(app => app.id === id)
    
    if (index !== -1) {
      applications[index].followUpDate = date
      this.save(applications)
    }
  }
  
  /**
   * Get applications by status
   */
  static getByStatus(status: Application['status']): Application[] {
    return this.getAll().filter(app => app.status === status)
  }
  
  /**
   * Get recent applications (last 30 days)
   */
  static getRecent(days: number = 30): Application[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    
    return this.getAll().filter(app => 
      new Date(app.appliedAt) >= cutoff
    )
  }
  
  /**
   * Get statistics
   */
  static getStats() {
    const applications = this.getAll()
    
    return {
      total: applications.length,
      applied: applications.filter(a => a.status === 'applied').length,
      interview: applications.filter(a => a.status === 'interview').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      offer: applications.filter(a => a.status === 'offer').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      responseRate: applications.length > 0 
        ? Math.round((applications.filter(a => a.status !== 'applied').length / applications.length) * 100)
        : 0
    }
  }
  
  /**
   * Mark job as applied in search results
   */
  private static markJobApplied(jobId: string, appliedAt: string): void {
    try {
      const jobs = JSON.parse(localStorage.getItem('cf:jobs') || '[]')
      const updated = jobs.map((j: any) => 
        j.id === jobId ? { ...j, applied: true, appliedAt } : j
      )
      localStorage.setItem('cf:jobs', JSON.stringify(updated))
    } catch {}
  }
  
  /**
   * Save applications to localStorage
   */
  private static save(applications: Application[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(applications))
    } catch (error) {
      console.error('[APPLICATION_TRACKER] Save failed:', error)
    }
  }
  
  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Delete application
   */
  static delete(id: string): void {
    const applications = this.getAll().filter(app => app.id !== id)
    this.save(applications)
  }
  
  /**
   * Clear all applications
   */
  static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }
}
