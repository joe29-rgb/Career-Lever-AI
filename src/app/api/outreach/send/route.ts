import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EmailAutomationService } from '@/lib/email-automation'
import { resendProvider } from '@/lib/email-providers/resend-provider'
import { generateSimplePDF, generateCoverLetterPDF } from '@/lib/pdf/unified-pdf-generator'
import { isRateLimited } from '@/lib/rate-limit'
import SentEmail from '@/models/SentEmail'
import connectToDatabase from '@/lib/mongodb'

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
    
    // Validation - email format and domain
    if (!contact?.email) {
      return NextResponse.json(
        { error: 'Contact email is required' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contact.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Check for disposable/invalid domains
    const invalidDomains = ['test.com', 'example.com', 'localhost', 'mailinator.com']
    const domain = contact.email.split('@')[1]?.toLowerCase()
    if (invalidDomains.includes(domain)) {
      return NextResponse.json(
        { error: 'Invalid email domain' },
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
          const resumePDF = await generateSimplePDF(resumeHTML, 'Resume')
          attachments.push({
            filename: 'Resume.pdf',
            content: resumePDF.toString('base64'),
            contentType: 'application/pdf'
          })
          console.log('[OUTREACH_SEND] Resume PDF generated:', resumePDF.length, 'bytes')
        } catch (error) {
          console.error('[OUTREACH_SEND] Resume PDF generation failed:', error)
          // Don't fail the entire request, just skip the attachment
        }
      }
      
      if (coverLetterHTML) {
        try {
          const coverPDF = await generateCoverLetterPDF(coverLetterHTML, 'modern')
          attachments.push({
            filename: 'Cover-Letter.pdf',
            content: coverPDF.toString('base64'),
            contentType: 'application/pdf'
          })
          console.log('[OUTREACH_SEND] Cover letter PDF generated:', coverPDF.length, 'bytes')
        } catch (error) {
          console.error('[OUTREACH_SEND] Cover letter PDF generation failed:', error)
          // Don't fail the entire request, just skip the attachment
        }
      }
      
      // PRIMARY METHOD: User sends from their own email (Gmail/Outlook)
      // BACKUP METHOD: Resend (only if domain is verified)
      const userEmail = session.user.email || undefined
      const useResend = process.env.RESEND_DOMAIN_VERIFIED === 'true'
      
      console.log('[OUTREACH_SEND] User email:', userEmail)
      console.log('[OUTREACH_SEND] Use Resend:', useResend)
      
      // If Resend is not configured or domain not verified, provide mailto fallback
      if (!useResend) {
        console.log('[OUTREACH_SEND] Resend not configured, using mailto fallback')
        
        // Generate mailto link with attachments note
        const attachmentNote = attachments.length > 0 
          ? `\n\n[Please attach: ${attachments.map(a => a.filename).join(', ')}]`
          : ''
        
        const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body + attachmentNote)}`
        
        // Save to database as "pending" - user will send manually
        try {
          await connectToDatabase()
          await SentEmail.create({
            userId: session.user.id,
            contactEmail: contact.email,
            contactName: contact.name || 'Unknown',
            subject: email.subject,
            body: email.body,
            attachments: attachments.map(a => ({ 
              filename: a.filename, 
              size: Buffer.from(a.content, 'base64').length,
              content: a.content // Store base64 for download
            })),
            status: 'pending_manual',
            metadata: { 
              method: 'mailto',
              mailto_link: mailtoLink
            }
          })
        } catch (dbError) {
          console.error('[OUTREACH_SEND] Failed to save to DB:', dbError)
        }
        
        return NextResponse.json({
          success: true,
          method: 'mailto',
          mailto_link: mailtoLink,
          attachments: attachments.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType
          })),
          message: 'Email prepared. Click the link to send from your email client.',
          instructions: 'Your default email client will open with the message pre-filled. Attach the provided PDFs before sending.'
        })
      }
      
      // BACKUP: Try Resend if domain is verified
      const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'
      console.log('[OUTREACH_SEND] From email:', fromEmail)
      console.log('[OUTREACH_SEND] Reply-To:', userEmail)
      
      const result = await resendProvider.send({
        to: contact.email,
        from: fromEmail,
        replyTo: userEmail,
        subject: email.subject,
        body: email.body,
        attachments: attachments.length > 0 ? attachments : undefined
      })
      
      if (!result.success) {
        // Log failed email to database
        try {
          await connectToDatabase()
          await SentEmail.create({
            userId: session.user.id,
            contactEmail: contact.email,
            contactName: contact.name || 'Unknown',
            subject: email.subject,
            body: email.body,
            attachments: attachments.map(a => ({ filename: a.filename, size: Buffer.from(a.content, 'base64').length })),
            status: 'failed',
            error: result.error,
            metadata: { provider: 'resend' }
          })
        } catch (dbError) {
          console.error('[OUTREACH_SEND] Failed to log error to DB:', dbError)
        }
        
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
      
      // Log successful email to database
      try {
        await connectToDatabase()
        await SentEmail.create({
          userId: session.user.id,
          contactEmail: contact.email,
          contactName: contact.name || 'Unknown',
          subject: email.subject,
          body: email.body,
          attachments: attachments.map(a => ({ filename: a.filename, size: Buffer.from(a.content, 'base64').length })),
          status: 'sent',
          messageId: result.message_id,
          metadata: { provider: 'resend' }
        })
      } catch (dbError) {
        console.error('[OUTREACH_SEND] Failed to log success to DB:', dbError)
        // Don't fail the request if DB logging fails
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

