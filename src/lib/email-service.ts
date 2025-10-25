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
  console.log('📧 [EMAIL] ==========================================')
  console.log('[EMAIL] Sending application email')
  console.log('[EMAIL] Recipient:', options.recipient)
  console.log('[EMAIL] Company:', options.company)
  console.log('[EMAIL] Job Title:', options.jobTitle)
  console.log('[EMAIL] Sender Name:', options.senderName)
  console.log('[EMAIL] Sender Email:', options.senderEmail)
  console.log('[EMAIL] Resume Text Length:', options.resumeText?.length || 0)
  console.log('[EMAIL] Cover Letter Length:', options.coverText?.length || 0)
  console.log('[EMAIL] ==========================================')

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
    console.log('[EMAIL] 📄 Generating PDF attachments...')
    console.log('[EMAIL] Resume text to convert:', options.resumeText.slice(0, 200) + '...')
    console.log('[EMAIL] Cover letter to convert:', options.coverText.slice(0, 200) + '...')
    
    const [resumePDF, coverLetterPDF] = await Promise.all([
      generateResumePDF(options.resumeText),
      generateCoverLetterPDF(options.coverText)
    ])
    
    console.log('[EMAIL] ✅ PDFs generated successfully')
    console.log('[EMAIL] Resume PDF size:', resumePDF?.length || 0, 'bytes')
    console.log('[EMAIL] Cover Letter PDF size:', coverLetterPDF?.length || 0, 'bytes')

    if (!resumePDF || resumePDF.length === 0) {
      throw new Error('Resume PDF generation failed - empty or null')
    }
    
    if (!coverLetterPDF || coverLetterPDF.length === 0) {
      throw new Error('Cover Letter PDF generation failed - empty or null')
    }

    // Initialize Resend
    console.log('[EMAIL] 📨 Initializing Resend...')
    const resend = new Resend(resendApiKey)

    // Send email with attachments
    console.log('[EMAIL] 🚀 Sending email with attachments...')
    console.log('[EMAIL] From:', options.senderEmail || 'noreply@careerlever.ai')
    console.log('[EMAIL] To:', options.recipient)
    console.log('[EMAIL] Subject:', subject)
    
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

    console.log('[EMAIL] ✅✅✅ Email sent successfully!')
    console.log('[EMAIL] Message ID:', result.data?.id)
    console.log('[EMAIL] Result:', result)
    
    return {
      success: true,
      messageId: result.data?.id,
      mailtoUrl
    }

  } catch (error: any) {
    console.error('❌❌❌ [EMAIL] CRITICAL ERROR ❌❌❌')
    console.error('[EMAIL] Error type:', error?.constructor?.name)
    console.error('[EMAIL] Error message:', error?.message)
    console.error('[EMAIL] Error stack:', error?.stack)
    console.error('[EMAIL] Recipient:', options.recipient)
    console.error('[EMAIL] Company:', options.company)
    
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

