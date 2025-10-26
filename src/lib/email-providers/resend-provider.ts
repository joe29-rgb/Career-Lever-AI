/**
 * PHASE 3A: Resend Email Provider
 * 
 * Integrates with Resend.com for reliable email delivery
 * Requires RESEND_API_KEY in environment variables
 * 
 * Setup Instructions:
 * 1. Sign up at https://resend.com
 * 2. Get API key from dashboard
 * 3. Add to Railway: RESEND_API_KEY=re_xxxxx
 * 4. (Optional) Verify your domain for better deliverability
 */

export interface EmailParams {
  to: string
  subject: string
  body: string
  from?: string
  attachments?: EmailAttachment[]
  replyTo?: string
}

export interface EmailAttachment {
  filename: string
  content: string // Base64 encoded
  contentType: string
}

export interface EmailResult {
  success: boolean
  message_id?: string
  error?: string
  provider: string
}

export class ResendProvider {
  private apiKey: string
  private fromEmail: string
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY || ''
    // Use Resend's default test email until domain is verified
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'
    
    if (!this.apiKey) {
      console.warn('[RESEND] No API key found. Email sending will fail.')
      console.warn('[RESEND] Set RESEND_API_KEY environment variable.')
    }
  }
  
  /**
   * Send email via Resend API
   */
  async send(params: EmailParams): Promise<EmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Resend API key not configured',
        provider: 'resend'
      }
    }
    
    try {
      console.log('[RESEND] Sending email to:', params.to)
      
      // Convert HTML body to proper format
      const emailBody = this.formatBody(params.body)
      
      // Prepare request
      const requestBody = {
        from: params.from || this.fromEmail,
        to: [params.to],
        subject: params.subject,
        html: emailBody,
        reply_to: params.replyTo,
        attachments: params.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          content_type: att.contentType
        }))
      }
      
      // Send via Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Resend API error: ${response.status}`)
      }
      
      const result = await response.json()
      
      console.log('[RESEND] Email sent successfully, ID:', result.id)
      
      return {
        success: true,
        message_id: result.id,
        provider: 'resend'
      }
      
    } catch (error) {
      console.error('[RESEND] Send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'resend'
      }
    }
  }
  
  /**
   * Format email body (convert plain text to HTML if needed)
   */
  private formatBody(body: string): string {
    // If body already has HTML tags, return as-is
    if (/<[a-z][\s\S]*>/i.test(body)) {
      return body
    }
    
    // Convert plain text to HTML
    const lines = body.split('\n')
    const htmlLines = lines.map(line => {
      if (!line.trim()) return '<br>'
      return `<p>${this.escapeHtml(line)}</p>`
    })
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
    p { margin: 0 0 1em 0; }
  </style>
</head>
<body>
  ${htmlLines.join('\n')}
</body>
</html>
    `.trim()
  }
  
  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, char => map[char])
  }
  
  /**
   * Verify API key is valid
   */
  async verifyApiKey(): Promise<boolean> {
    if (!this.apiKey) return false
    
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      
      return response.status !== 401
    } catch {
      return false
    }
  }
  
  /**
   * Get provider status
   */
  getStatus(): {
    configured: boolean
    provider: string
    fromEmail: string
  } {
    return {
      configured: !!this.apiKey,
      provider: 'resend',
      fromEmail: this.fromEmail
    }
  }
}

// Export singleton instance
export const resendProvider = new ResendProvider()

