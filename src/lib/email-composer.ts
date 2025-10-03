export async function composeJobApplicationEmail(jobData, resumePDF, coverLetterPDF) {
  const subject = `Application for ${jobData.title} at ${jobData.company}`
  const body = `Dear Hiring Manager,

Please find attached my resume and cover letter for the ${jobData.title} position.

Best regards,
[Your Name]`

  return {
    subject,
    body,
    attachments: [resumePDF, coverLetterPDF],
    mailtoUrl: `mailto:${jobData.hrEmail || 'hiring@company.com'}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
}
