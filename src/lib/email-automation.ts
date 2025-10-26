import { resendProvider, EmailParams, EmailResult } from './email-providers/resend-provider'
import { EnhancedContact } from './contact-enrichment'

export interface ScheduledOutreach {
  id: string
  contact: EnhancedContact
  email: {
    subject: string
    body: string
  }
  scheduled_time: Date
  priority: number
  status: 'scheduled' | 'sent' | 'failed' | 'pending'
  userId: string
  jobId?: string
}

export interface AutomationSettings {
  max_per_hour: number
  spread_hours: number
  skip_weekends: boolean
  preferred_times: string[] // ['09:00', '14:00', '16:00']
  enable_followups: boolean
}

export class EmailAutomationService {
  /**
   * PHASE 3B: Schedule optimal outreach for multiple contacts
   * Spreads emails over time, respects rate limits, optimizes send times
   */
  static async scheduleOptimalOutreach(
    contacts: EnhancedContact[],
    emails: Array<{subject: string; body: string}>,
    settings: AutomationSettings,
    userId: string
  ): Promise<ScheduledOutreach[]> {
    console.log('[EMAIL_AUTOMATION] Scheduling', contacts.length, 'emails')
    
    const schedule: ScheduledOutreach[] = []
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]
      const email = emails[i]
      
      if (!contact.email) {
        console.warn('[EMAIL_AUTOMATION] Skipping contact with no email:', contact.name)
        continue
      }
      
      // Calculate optimal send time
      const sendTime = this.calculateOptimalSendTime(
        contact,
        settings,
        i,
        schedule.length
      )
      
      schedule.push({
        id: `outreach_${Date.now()}_${i}`,
        contact,
        email,
        scheduled_time: sendTime,
        priority: contact.decision_maker_score,
        status: 'scheduled',
        userId
      })
    }
    
    // Sort by priority (decision makers first) then by time
    schedule.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return a.scheduled_time.getTime() - b.scheduled_time.getTime()
    })
    
    console.log('[EMAIL_AUTOMATION] Scheduled', schedule.length, 'emails')
    console.log('[EMAIL_AUTOMATION] First:', schedule[0]?.scheduled_time)
    console.log('[EMAIL_AUTOMATION] Last:', schedule[schedule.length - 1]?.scheduled_time)
    
    return schedule
  }
  
  /**
   * Calculate optimal send time based on multiple factors
   */
  private static calculateOptimalSendTime(
    contact: EnhancedContact,
    settings: AutomationSettings,
    index: number,
    totalScheduled: number
  ): Date {
    const now = new Date()
    
    // Calculate how many hours to add based on rate limiting
    const hoursToAdd = Math.floor(totalScheduled / settings.max_per_hour)
    let sendDate = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000)
    
    // Skip weekends if requested
    if (settings.skip_weekends) {
      const day = sendDate.getDay()
      if (day === 0) { // Sunday
        sendDate.setDate(sendDate.getDate() + 1)
      } else if (day === 6) { // Saturday
        sendDate.setDate(sendDate.getDate() + 2)
      }
    }
    
    // Set to preferred time of day
    const preferredHour = this.getPreferredHour(
      settings.preferred_times,
      index % settings.preferred_times.length
    )
    sendDate.setHours(preferredHour, 0, 0, 0)
    
    // Use contact's best contact days if available
    if (contact.personality_insights?.best_contact_days?.length > 0) {
      sendDate = this.adjustToPreferredDay(
        sendDate,
        contact.personality_insights.best_contact_days
      )
    }
    
    // Ensure time is in the future
    if (sendDate.getTime() < now.getTime()) {
      sendDate.setDate(sendDate.getDate() + 1)
    }
    
    return sendDate
  }
  
  /**
   * Parse preferred time string to hour
   */
  private static getPreferredHour(preferredTimes: string[], index: number): number {
    const timeStr = preferredTimes[index] || '09:00'
    const [hour] = timeStr.split(':').map(Number)
    return hour
  }
  
  /**
   * Adjust date to match preferred contact days
   */
  private static adjustToPreferredDay(date: Date, preferredDays: string[]): Date {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const currentDay = dayNames[date.getDay()]
    
    // If current day is already preferred, return as-is
    if (preferredDays.includes(currentDay)) {
      return date
    }
    
    // Find next preferred day
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + i)
      const nextDay = dayNames[nextDate.getDay()]
      
      if (preferredDays.includes(nextDay)) {
        return nextDate
      }
    }
    
    return date // Fallback
  }
  
  /**
   * Send email immediately (bypasses scheduling)
   */
  static async sendEmailNow(
    contact: EnhancedContact,
    email: {subject: string; body: string},
    fromEmail?: string
  ): Promise<EmailResult> {
    if (!contact.email) {
      return {
        success: false,
        error: 'Contact has no email address',
        provider: 'none'
      }
    }
    
    console.log('[EMAIL_AUTOMATION] Sending email now to:', contact.name)
    
    try {
      const params: EmailParams = {
        to: contact.email,
        subject: email.subject,
        body: email.body,
        from: fromEmail
      }
      
      const result = await resendProvider.send(params)
      
      if (result.success) {
        console.log('[EMAIL_AUTOMATION] Email sent successfully:', result.message_id)
        
        // Log to database for tracking
        await this.logOutreach({
          contact_email: contact.email,
          contact_name: contact.name,
          subject: email.subject,
          sent_at: new Date(),
          message_id: result.message_id,
          status: 'sent'
        })
      }
      
      return result
      
    } catch (error) {
      console.error('[EMAIL_AUTOMATION] Send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'resend'
      }
    }
  }
  
  /**
   * Send multiple emails with rate limiting
   */
  static async sendBatch(
    outreaches: ScheduledOutreach[],
    settings: AutomationSettings
  ): Promise<EmailResult[]> {
    console.log('[EMAIL_AUTOMATION] Sending batch of', outreaches.length, 'emails')
    
    const results: EmailResult[] = []
    const delayMs = (3600 * 1000) / settings.max_per_hour // Convert rate limit to delay
    
    for (const outreach of outreaches) {
      if (!outreach.contact.email) continue
      
      const result = await this.sendEmailNow(outreach.contact, outreach.email)
      results.push(result)
      
      // Wait between sends to respect rate limit
      if (results.length < outreaches.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
    
    const successCount = results.filter(r => r.success).length
    console.log('[EMAIL_AUTOMATION] Batch complete:', successCount, 'of', results.length, 'sent')
    
    return results
  }
  
  /**
   * Log outreach to database for tracking
   */
  private static async logOutreach(data: {
    contact_email: string
    contact_name: string
    subject: string
    sent_at: Date
    message_id?: string
    status: string
  }): Promise<void> {
    try {
      await fetch('/api/outreach/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('[EMAIL_AUTOMATION] Failed to log outreach:', error)
      // Don't throw - logging failure shouldn't break sending
    }
  }
  
  /**
   * Get default automation settings
   */
  static getDefaultSettings(): AutomationSettings {
    return {
      max_per_hour: 3,
      spread_hours: 24,
      skip_weekends: true,
      preferred_times: ['09:00', '14:00', '16:00'],
      enable_followups: true
    }
  }
  
  /**
   * Validate automation settings
   */
  static validateSettings(settings: Partial<AutomationSettings>): AutomationSettings {
    const defaults = this.getDefaultSettings()
    
    return {
      max_per_hour: Math.max(1, Math.min(settings.max_per_hour || defaults.max_per_hour, 10)),
      spread_hours: Math.max(1, settings.spread_hours || defaults.spread_hours),
      skip_weekends: settings.skip_weekends ?? defaults.skip_weekends,
      preferred_times: settings.preferred_times || defaults.preferred_times,
      enable_followups: settings.enable_followups ?? defaults.enable_followups
    }
  }
}

