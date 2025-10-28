/**
 * Server-Side PDF Generation
 * Converts HTML to PDF Buffer for email attachments
 * Uses pdfkit for real PDF generation
 */

import PDFDocument from 'pdfkit'

/**
 * Convert HTML to real PDF using pdfkit
 */
export async function htmlToSimplePDF(html: string, title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Strip HTML tags and convert to plain text
      const text = stripHtmlTags(html)
      
      // Create PDF document
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })
      
      // Collect PDF chunks
      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
      
      // Add title using Courier-Bold (built-in font, no external files needed)
      doc.fontSize(20)
         .font('Courier-Bold')
         .text(title, { align: 'center' })
         .moveDown(1.5)
      
      // Add content using Courier (built-in font, no external files needed)
      doc.fontSize(11)
         .font('Courier')
         .text(text, {
           align: 'left',
           lineGap: 2
         })
      
      // Finalize PDF
      doc.end()
      
    } catch (error) {
      console.error('[PDF-GENERATOR] Error:', error)
      reject(new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  })
}

/**
 * Strip HTML tags from text
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Convert resume HTML to PDF
 */
export async function generateResumePDF(resumeHTML: string): Promise<Buffer> {
  return htmlToSimplePDF(resumeHTML, 'Resume')
}

/**
 * Convert cover letter HTML to PDF
 */
export async function generateCoverLetterPDF(coverLetterHTML: string): Promise<Buffer> {
  return htmlToSimplePDF(coverLetterHTML, 'Cover Letter')
}
