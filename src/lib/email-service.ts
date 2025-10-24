import { Resend } from 'resend'
import { generateResumePDF, generateCoverLetterPDF } from './server-pdf-generator'

interface EmailOptions {
  recipient: string
  subjects: string[]
  intros: string[]
  resumeText: string
  coverText: string
  company: string
  jobTitle: string
  senderEmail?: string
  senderName?: string
}

interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
  mailtoUrl: string // Fallback for environments without Resend
}

/**
 * Send email using Resend API with PDF attachments
 */
export async function sendJobApplicationEmail(options: EmailOptions): Promise<SendEmailResult> {
  console.log('[EMAIL] Sending to:', options.recipient)

  // Generate subject and body
  const subject = options.subjects[0] || `Application for ${options.jobTitle} at ${options.company}`
  const intro = options.intros[0] || `Dear Hiring Manager,`
  
  const body = `${intro}

I am excited to apply for the ${options.jobTitle} position at ${options.company}.

Please find my resume and cover letter attached.

Best regards,
${options.senderName || '[Your Name]'}`

  // Create mailto fallback URL
  const mailtoUrl = `mailto:${options.recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  // Check if Resend API key is configured
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.warn('[EMAIL] RESEND_API_KEY not configured, returning mailto fallback')
    return {
      success: false,
      error: 'Email service not configured. Use mailto link as fallback.',
      mailtoUrl
    }
  }

  try {
    // Generate PDF attachments
    const [resumePDF, coverLetterPDF] = await Promise.all([
      generateResumePDF(options.resumeText),
      generateCoverLetterPDF(options.coverText)
    ])

    // Initialize Resend
    const resend = new Resend(resendApiKey)

    // Send email with attachments
    const result = await resend.emails.send({
      from: options.senderEmail || 'noreply@careerlever.ai',
      to: options.recipient,
      subject: subject,
      text: body,
      attachments: [
        {
          filename: 'resume.pdf',
          content: resumePDF
        },
        {
          filename: 'cover-letter.pdf',
          content: coverLetterPDF
        }
      ]
    })

    console.log('[EMAIL] Sent successfully:', result.data?.id)
    return {
      success: true,
      messageId: result.data?.id,
      mailtoUrl
    }

  } catch (error) {
    console.error('[EMAIL] Failed to send:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      mailtoUrl
    }
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function composeEmail(options: EmailOptions) {
  const result = await sendJobApplicationEmail(options)
  return {
    mailtoUrl: result.mailtoUrl,
    success: result.success,
    messageId: result.messageId,
    error: result.error
  }
}

