import { sendJobApplicationEmail } from './email-service'

export async function composeJobApplicationEmail(
  jobData: { title: string; company: string; hrEmail?: string },
  resumeText: string,
  coverLetterText: string,
  senderName?: string,
  senderEmail?: string
) {
  const recipient = jobData.hrEmail || 'hiring@company.com'
  
  // Use real email sending service
  const result = await sendJobApplicationEmail({
    recipient,
    subjects: [`Application for ${jobData.title} at ${jobData.company}`],
    intros: ['Dear Hiring Manager,'],
    resumeText,
    coverText: coverLetterText,
    company: jobData.company,
    jobTitle: jobData.title,
    senderName,
    senderEmail
  })

  return {
    success: result.success,
    messageId: result.messageId,
    mailtoUrl: result.mailtoUrl,
    error: result.error
  }
}
