import { PerplexityIntelligenceService } from './perplexity-intelligence'
import { resendProvider, EmailParams } from './email-providers/resend-provider'

export interface FollowUpSequence {
  id: string
  original_email_id: string
  contact_email: string
  contact_name: string
  company_name: string
  job_title: string
  userId: string
  
  sequences: FollowUpStep[]
  status: 'active' | 'completed' | 'paused' | 'replied'
  created_at: Date
  last_updated: Date
}

export interface FollowUpStep {
  step_number: number
  days_after: number // 3, 7, 14
  subject: string
  body: string
  status: 'pending' | 'scheduled' | 'sent' | 'skipped'
  scheduled_time?: Date
  sent_at?: Date
  message_id?: string
  tone: 'gentle' | 'value-add' | 'graceful-close'
}

export class FollowUpAutomationService {
  /**
   * PHASE 4A: Create automated follow-up sequence
   * 
   * Generates 3 follow-up emails:
   * - Day 3: Gentle reminder
   * - Day 7: Additional value/insight
   * - Day 14: Graceful close/final attempt
   */
  static async createFollowUpSequence(
    originalEmail: {
      id: string
      contact_email: string
      contact_name: string
      company_name: string
      job_title: string
      original_subject: string
      original_body: string
    },
    userId: string,
    resumeText?: string
  ): Promise<FollowUpSequence> {
    console.log('[FOLLOWUP] Creating sequence for:', originalEmail.contact_name)
    
    const now = new Date()
    
    // Generate all 3 follow-up emails with AI
    const followUps = await this.generateIntelligentFollowUps(
      originalEmail,
      resumeText
    )
    
    const sequence: FollowUpSequence = {
      id: `followup_${Date.now()}_${userId.slice(0, 8)}`,
      original_email_id: originalEmail.id,
      contact_email: originalEmail.contact_email,
      contact_name: originalEmail.contact_name,
      company_name: originalEmail.company_name,
      job_title: originalEmail.job_title,
      userId,
      sequences: followUps,
      status: 'active',
      created_at: now,
      last_updated: now
    }
    
    console.log('[FOLLOWUP] Created 3-step sequence:', sequence.id)
    
    return sequence
  }
  
  /**
   * Generate intelligent follow-ups using Perplexity
   */
  private static async generateIntelligentFollowUps(
    originalEmail: {
      contact_name: string
      company_name: string
      job_title: string
      original_subject: string
      original_body: string
    },
    resumeText?: string
  ): Promise<FollowUpStep[]> {
    const firstName = originalEmail.contact_name.split(' ')[0]
    
    try {
      // Use AI to generate contextual follow-ups
      const prompt = `
Generate 3 professional follow-up emails for a job application to ${originalEmail.company_name} for ${originalEmail.job_title}.

ORIGINAL EMAIL:
Subject: ${originalEmail.original_subject}
Body: ${originalEmail.original_body}

FOLLOW-UP SEQUENCE:
1. Day 3 Follow-up (gentle reminder)
   - Tone: Polite, brief, non-pushy
   - Reference original email
   - Ask if they had a chance to review
   - Keep under 50 words

2. Day 7 Follow-up (value-add)
   - Tone: Helpful, value-focused
   - Share relevant insight, article, or unique perspective
   - Demonstrate continued interest + research
   - 75-100 words

3. Day 14 Follow-up (graceful close)
   - Tone: Professional, understanding, leaves door open
   - Acknowledge they may be busy
   - Express continued interest but no pressure
   - Offer to reconnect in future
   - 50-75 words

Return JSON array with this structure:
[
  {
    "step_number": 1,
    "subject": "Re: [original subject]",
    "body": "email body here",
    "tone": "gentle"
  },
  {
    "step_number": 2,
    "subject": "subject here",
    "body": "email body here",
    "tone": "value-add"
  },
  {
    "step_number": 3,
    "subject": "subject here",
    "body": "email body here",
    "tone": "graceful-close"
  }
]

RULES:
- Use ${firstName} for first name
- Be professional and respectful
- No buzzwords (rockstar, ninja, passionate)
- Keep emails concise
- Don't be desperate or pushy
- Each email stands alone (works if previous wasn't read)
`.trim()
      
      const result = await PerplexityIntelligenceService.customQuery({
        systemPrompt: "You write professional, effective follow-up emails that get responses without being pushy.",
        userPrompt: prompt,
        temperature: 0.4,
        maxTokens: 1000
      })
      
      // Parse and validate result
      if (Array.isArray(result) && result.length === 3) {
        return result.map((email: any, index: number) => ({
          step_number: index + 1,
          days_after: index === 0 ? 3 : index === 1 ? 7 : 14,
          subject: email.subject || `Following up: ${originalEmail.job_title}`,
          body: email.body || '',
          status: 'pending' as const,
          tone: email.tone || (index === 0 ? 'gentle' : index === 1 ? 'value-add' : 'graceful-close')
        }))
      }
    } catch (error) {
      console.error('[FOLLOWUP] AI generation failed, using templates:', error)
    }
    
    // Fallback to templates if AI fails
    return this.getTemplateFollowUps(originalEmail)
  }
  
  /**
   * Template-based follow-ups (fallback)
   */
  private static getTemplateFollowUps(originalEmail: {
    contact_name: string
    company_name: string
    job_title: string
    original_subject: string
  }): FollowUpStep[] {
    const firstName = originalEmail.contact_name.split(' ')[0]
    
    return [
      {
        step_number: 1,
        days_after: 3,
        subject: `Re: ${originalEmail.original_subject}`,
        body: `Hi ${firstName},\n\nJust wanted to follow up on my previous email regarding the ${originalEmail.job_title} position. Have you had a chance to review my application?\n\nThank you for your time.\n\nBest regards`,
        status: 'pending',
        tone: 'gentle'
      },
      {
        step_number: 2,
        days_after: 7,
        subject: `${originalEmail.job_title} - Additional context`,
        body: `Hi ${firstName},\n\nI wanted to share some additional context about how my experience aligns with ${originalEmail.company_name}'s goals for the ${originalEmail.job_title} role.\n\nI've been following ${originalEmail.company_name}'s recent work and I'm particularly excited about the opportunity to contribute to your team's success.\n\nWould you be open to a brief conversation?\n\nBest regards`,
        status: 'pending',
        tone: 'value-add'
      },
      {
        step_number: 3,
        days_after: 14,
        subject: `Final follow-up: ${originalEmail.job_title}`,
        body: `Hi ${firstName},\n\nI understand you're likely very busy. I wanted to reach out one last time regarding the ${originalEmail.job_title} position.\n\nIf the timing isn't right or the role has been filled, I completely understand. I'd still welcome the opportunity to connect in the future.\n\nThank you for considering my application.\n\nBest regards`,
        status: 'pending',
        tone: 'graceful-close'
      }
    ]
  }
  
  /**
   * Process pending follow-ups (called by cron/background job)
   */
  static async processPendingFollowUps(): Promise<{
    processed: number
    sent: number
    failed: number
  }> {
    console.log('[FOLLOWUP] Processing pending follow-ups...')
    
    try {
      // Fetch pending follow-ups from database
      const response = await fetch('/api/outreach/followup/pending')
      if (!response.ok) {
        throw new Error('Failed to fetch pending follow-ups')
      }
      
      const { followups } = await response.json()
      
      let sent = 0
      let failed = 0
      
      for (const followup of followups) {
        try {
          // Send the follow-up email
          const params: EmailParams = {
            to: followup.contact_email,
            subject: followup.subject,
            body: followup.body
          }
          
          const result = await resendProvider.send(params)
          
          if (result.success) {
            // Mark as sent in database
            await fetch('/api/outreach/followup/mark-sent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                followup_id: followup.id,
                message_id: result.message_id,
                sent_at: new Date()
              })
            })
            sent++
            console.log('[FOLLOWUP] Sent:', followup.contact_email)
          } else {
            failed++
            console.error('[FOLLOWUP] Failed:', result.error)
          }
        } catch (error) {
          failed++
          console.error('[FOLLOWUP] Error processing:', error)
        }
      }
      
      console.log('[FOLLOWUP] Processing complete:', { sent, failed, total: followups.length })
      
      return {
        processed: followups.length,
        sent,
        failed
      }
      
    } catch (error) {
      console.error('[FOLLOWUP] Processing error:', error)
      return { processed: 0, sent: 0, failed: 0 }
    }
  }
  
  /**
   * Cancel follow-up sequence (user got response)
   */
  static async cancelSequence(sequenceId: string, reason: 'replied' | 'hired' | 'not-interested'): Promise<void> {
    try {
      await fetch('/api/outreach/followup/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence_id: sequenceId, reason })
      })
      
      console.log('[FOLLOWUP] Cancelled sequence:', sequenceId, reason)
    } catch (error) {
      console.error('[FOLLOWUP] Cancel error:', error)
    }
  }
  
  /**
   * Get active sequences for user
   */
  static async getActiveSequences(userId: string): Promise<FollowUpSequence[]> {
    try {
      const response = await fetch(`/api/outreach/followup/list?userId=${userId}&status=active`)
      if (!response.ok) return []
      
      const { sequences } = await response.json()
      return sequences || []
    } catch {
      return []
    }
  }
}

