/**
 * Application Deadline Tracker
 * 
 * Tracks and prioritizes job application deadlines
 */

export interface ApplicationDeadline {
  jobId: string
  jobTitle: string
  company: string
  deadline: Date
  daysRemaining: number
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'pending' | 'applied' | 'expired'
  source: string
  reminderSent: boolean
}

export interface DeadlineAlert {
  type: 'urgent' | 'warning' | 'reminder'
  message: string
  deadline: ApplicationDeadline
  actionRequired: string
}

export class DeadlineTrackerService {
  /**
   * Extract deadline from job description
   */
  static extractDeadline(jobDescription: string, postedDate?: Date): Date | null {
    const text = jobDescription.toLowerCase()
    
    // Common deadline patterns
    const patterns = [
      /apply\s+by\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
      /deadline[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
      /applications?\s+close\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
      /closing\s+date[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
      /(\w+\s+\d{1,2},?\s+\d{4})\s+deadline/i,
      /until\s+(\w+\s+\d{1,2},?\s+\d{4})/i
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        try {
          const deadline = new Date(match[1])
          if (!isNaN(deadline.getTime()) && deadline > new Date()) {
            return deadline
          }
        } catch (e) {
          continue
        }
      }
    }

    // Relative deadlines (e.g., "apply within 7 days")
    const relativePatterns = [
      /apply\s+within\s+(\d+)\s+days?/i,
      /(\d+)\s+days?\s+remaining/i,
      /closes?\s+in\s+(\d+)\s+days?/i
    ]

    for (const pattern of relativePatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const days = parseInt(match[1])
        const baseDate = postedDate || new Date()
        const deadline = new Date(baseDate)
        deadline.setDate(deadline.getDate() + days)
        return deadline
      }
    }

    // If no explicit deadline, estimate based on posted date
    if (postedDate) {
      const estimated = new Date(postedDate)
      estimated.setDate(estimated.getDate() + 30) // Default 30 days
      return estimated
    }

    return null
  }

  /**
   * Calculate priority based on deadline
   */
  static calculatePriority(daysRemaining: number): 'urgent' | 'high' | 'medium' | 'low' {
    if (daysRemaining <= 2) return 'urgent'
    if (daysRemaining <= 7) return 'high'
    if (daysRemaining <= 14) return 'medium'
    return 'low'
  }

  /**
   * Get deadline alerts for user
   */
  static getDeadlineAlerts(deadlines: ApplicationDeadline[]): DeadlineAlert[] {
    const alerts: DeadlineAlert[] = []
    const now = new Date()

    for (const deadline of deadlines) {
      if (deadline.status !== 'pending') continue

      const daysRemaining = Math.ceil((deadline.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysRemaining <= 0) {
        alerts.push({
          type: 'urgent',
          message: `EXPIRED: ${deadline.jobTitle} at ${deadline.company}`,
          deadline,
          actionRequired: 'Application deadline has passed'
        })
      } else if (daysRemaining <= 2) {
        alerts.push({
          type: 'urgent',
          message: `URGENT: ${deadline.jobTitle} at ${deadline.company} closes in ${daysRemaining} day(s)`,
          deadline,
          actionRequired: 'Apply immediately'
        })
      } else if (daysRemaining <= 7) {
        alerts.push({
          type: 'warning',
          message: `${deadline.jobTitle} at ${deadline.company} closes in ${daysRemaining} days`,
          deadline,
          actionRequired: 'Apply this week'
        })
      } else if (daysRemaining <= 14 && !deadline.reminderSent) {
        alerts.push({
          type: 'reminder',
          message: `${deadline.jobTitle} at ${deadline.company} closes in ${daysRemaining} days`,
          deadline,
          actionRequired: 'Start preparing application'
        })
      }
    }

    // Sort by urgency
    return alerts.sort((a, b) => {
      const urgencyOrder = { urgent: 0, warning: 1, reminder: 2 }
      return urgencyOrder[a.type] - urgencyOrder[b.type]
    })
  }

  /**
   * Format deadline for display
   */
  static formatDeadline(deadline: Date): string {
    const now = new Date()
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysRemaining < 0) {
      return `Expired ${Math.abs(daysRemaining)} day(s) ago`
    } else if (daysRemaining === 0) {
      return 'Today'
    } else if (daysRemaining === 1) {
      return 'Tomorrow'
    } else if (daysRemaining <= 7) {
      return `In ${daysRemaining} days`
    } else {
      return deadline.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    }
  }

  /**
   * Get recommended application timeline
   */
  static getApplicationTimeline(deadline: Date): {
    startResearch: Date
    startApplication: Date
    submitBy: Date
    buffer: number
  } {
    const now = new Date()
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate recommended dates
    const submitBy = new Date(deadline)
    submitBy.setDate(submitBy.getDate() - 1) // Submit 1 day before deadline

    const startApplication = new Date(deadline)
    startApplication.setDate(startApplication.getDate() - Math.min(7, Math.floor(daysUntilDeadline * 0.5)))

    const startResearch = new Date(deadline)
    startResearch.setDate(startResearch.getDate() - Math.min(14, Math.floor(daysUntilDeadline * 0.7)))

    return {
      startResearch,
      startApplication,
      submitBy,
      buffer: 1 // Days of buffer before deadline
    }
  }

  /**
   * Sort jobs by deadline urgency
   */
  static sortByUrgency(deadlines: ApplicationDeadline[]): ApplicationDeadline[] {
    return deadlines.sort((a, b) => {
      // Pending applications first
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1

      // Then by days remaining
      return a.daysRemaining - b.daysRemaining
    })
  }

  /**
   * Check if deadline is approaching
   */
  static isDeadlineApproaching(deadline: Date, thresholdDays: number = 7): boolean {
    const now = new Date()
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysRemaining <= thresholdDays && daysRemaining > 0
  }

  /**
   * Generate deadline reminder email
   */
  static generateReminderEmail(deadline: ApplicationDeadline): {
    subject: string
    body: string
  } {
    const daysText = deadline.daysRemaining === 1 ? 'tomorrow' : `in ${deadline.daysRemaining} days`
    
    return {
      subject: `⏰ Reminder: ${deadline.company} application deadline ${daysText}`,
      body: `Hi there,

This is a friendly reminder that the application deadline for ${deadline.jobTitle} at ${deadline.company} is ${daysText}.

Deadline: ${deadline.deadline.toLocaleDateString('en-US', { 
  weekday: 'long',
  month: 'long', 
  day: 'numeric', 
  year: 'numeric' 
})}

Make sure to:
✓ Complete your application
✓ Tailor your resume
✓ Write a compelling cover letter
✓ Proofread everything
✓ Submit before the deadline

Good luck with your application!

Best regards,
Career Lever AI`
    }
  }
}
