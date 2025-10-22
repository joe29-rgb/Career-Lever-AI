import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EmailAutomationService } from '@/lib/email-automation'
import { resendProvider } from '@/lib/email-providers/resend-provider'
import { generateResumePDF, generateCoverLetterPDF } from '@/lib/server-pdf-generator'
import { isRateLimited } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * PHASE 3C: Automated Email Sending API
 * 
 * Sends personalized emails to hiring contacts with attachments
 * Rate limited, authenticated, tracks delivery
 * 
 * Requirements:
 * - RESEND_API_KEY must be set in environment
 * - User must be authenticated
 * - Rate limit: 5 emails per hour per user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Rate limiting - stricter for email sending
    if (await isRateLimited(session.user.id, 'outreach-send')) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Maximum 5 emails per hour.',
          retry_after: '60 minutes'
        },
        { status: 429 }
      )
    }
    
    const body = await request.json()
    const {
      contact,
      email,
      resumeHTML,
      coverLetterHTML,
      send_immediately = true,
      scheduled_time
    } = body
    
    // Validation
    if (!contact?.email) {
      return NextResponse.json(
        { error: 'Contact email is required' },
        { status: 400 }
      )
    }
    
    if (!email?.subject || !email?.body) {
      return NextResponse.json(
        { error: 'Email subject and body are required' },
        { status: 400 }
      )
    }
    
    console.log('[OUTREACH_SEND] Request from user:', session.user.id)
    console.log('[OUTREACH_SEND] Sending to:', contact.name, contact.email)
    console.log('[OUTREACH_SEND] Has resume:', !!resumeHTML, 'Has cover letter:', !!coverLetterHTML)
    
    // Send immediately or schedule
    if (send_immediately) {
      // Generate PDF attachments if HTML provided
      const attachments: Array<{
        filename: string
        content: string
        contentType: string
      }> = []
      
      if (resumeHTML) {
        try {
          const resumePDF = await generateResumePDF(resumeHTML)
          attachments.push({
            filename: 'Resume.pdf',
            content: resumePDF.toString('base64'),
            contentType: 'application/pdf'
          })
          console.log('[OUTREACH_SEND] Resume PDF generated')
        } catch (error) {
          console.error('[OUTREACH_SEND] Resume PDF generation failed:', error)
        }
      }
      
      if (coverLetterHTML) {
        try {
          const coverPDF = await generateCoverLetterPDF(coverLetterHTML)
          attachments.push({
            filename: 'Cover-Letter.pdf',
            content: coverPDF.toString('base64'),
            contentType: 'application/pdf'
          })
          console.log('[OUTREACH_SEND] Cover letter PDF generated')
        } catch (error) {
          console.error('[OUTREACH_SEND] Cover letter PDF generation failed:', error)
        }
      }
      
      // Send email with attachments
      // CRITICAL FIX: Use user's email as FROM address (falls back to default if not available)
      const userEmail = session.user.email || undefined
      const fromEmail = userEmail || process.env.EMAIL_FROM || 'onboarding@resend.dev'
      
      console.log('[OUTREACH_SEND] User email:', userEmail)
      console.log('[OUTREACH_SEND] From email:', fromEmail)
      console.log('[OUTREACH_SEND] EMAIL_FROM env:', process.env.EMAIL_FROM)
      
      const result = await resendProvider.send({
        to: contact.email,
        from: fromEmail,
        replyTo: userEmail, // User's email for replies
        subject: email.subject,
        body: email.body,
        attachments: attachments.length > 0 ? attachments : undefined
      })
      
      if (!result.success) {
        // Check if it's a configuration error
        if (result.error?.includes('API key not configured')) {
          return NextResponse.json({
            error: 'Email service not configured',
            details: 'RESEND_API_KEY environment variable is not set. Please configure email service.',
            contact_email: contact.email,
            mailto_fallback: `mailto:${contact.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
          }, { status: 503 })
        }
        
        // CRITICAL FIX: Check for domain verification error
        if (result.error?.includes('verify a domain') || result.error?.includes('testing emails')) {
          console.log('[OUTREACH_SEND] Domain not verified, providing mailto fallback')
          return NextResponse.json({
            error: 'Email service requires domain verification',
            details: result.error,
            mailto_fallback: `mailto:${contact.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`,
            fallback_instructions: 'Click the mailto link to send via your email client, or verify your domain at resend.com/domains'
          }, { status: 503 })
        }
        
        return NextResponse.json({
          error: 'Failed to send email',
          details: result.error,
          mailto_fallback: `mailto:${contact.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
        }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        message_id: result.message_id,
        attachments_sent: attachments.length,
        contact: {
          name: contact.name,
          email: contact.email
        },
        sent_at: new Date().toISOString()
      })
      
    } else {
      // Schedule for later
      const settings = EmailAutomationService.getDefaultSettings()
      const schedule = await EmailAutomationService.scheduleOptimalOutreach(
        [contact],
        [email],
        settings,
        session.user.id
      )
      
      return NextResponse.json({
        success: true,
        message: 'Email scheduled',
        scheduled_time: schedule[0]?.scheduled_time,
        schedule_id: schedule[0]?.id
      })
    }
    
  } catch (error) {
    console.error('[OUTREACH_SEND] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/outreach/send - Check email service status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { resendProvider } = await import('@/lib/email-providers/resend-provider')
    const status = resendProvider.getStatus()
    
    return NextResponse.json({
      configured: status.configured,
      provider: status.provider,
      from_email: status.fromEmail,
      ready: status.configured,
      message: status.configured 
        ? 'Email service is configured and ready' 
        : 'Email service not configured. Add RESEND_API_KEY to environment.'
    })
    
  } catch (error) {
    console.error('[OUTREACH_SEND] Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check email service status' },
      { status: 500 }
    )
  }
}

