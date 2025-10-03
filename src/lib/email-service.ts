import puppeteer from 'puppeteer-core'

interface EmailOptions {
  recipient: string
  subjects: string[]
  intros: string[]
  resumeText: string
  coverText: string
  company: string
  jobTitle: string
}

export async function composeEmail(options: EmailOptions) {
  console.log('[EMAIL] Composing for:', options.recipient)

  // Generate subject (pick first or random)
  const subject = options.subjects[0] || `Application for ${options.jobTitle} at ${options.company}`

  // Generate intro (pick first)
  const intro = options.intros[0] || `Dear Hiring Manager,`

  // Simple body
  const body = `${intro}

I am excited to apply for the ${options.jobTitle} position at ${options.company}. [Brief intro from Perplexity]

Please find my resume and cover letter attached.

Best regards,
[Your Name]`

  // Generate PDF attachments
  const browser = await puppeteer.launch({ headless: true })
  const [resumePDF, coverPDF] = await Promise.all([
    generatePDF(options.resumeText, 'resume', browser),
    generatePDF(options.coverText, 'cover-letter', browser)
  ])
  await browser.close()

  // mailto URL (attachments via blob for client-side)
  const mailto = `mailto:${options.recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  console.log('[EMAIL] Composed mailto:', mailto)
  return {
    mailtoUrl: mailto,
    attachments: { resume: resumePDF, cover: coverPDF },
    subject,
    intro
  }
}

async function generatePDF(htmlContent: string, type: 'resume' | 'cover-letter', browser: any): Promise<Buffer> {
  const page = await browser.newPage()
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 1in; line-height: 1.4; }
          h1, h2 { color: #333; }
          .resume { max-width: 8.5in; }
          .cover { max-width: 8.5in; }
        </style>
      </head>
      <body class="${type}">
        ${htmlContent}
      </body>
    </html>
  `
  await page.setContent(html)
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  await page.close()
  return pdf
}
