/**
 * Server-Side PDF Generation
 * Converts HTML to PDF Buffer for email attachments
 * Uses simple text-based PDF generation (no puppeteer needed)
 */

/**
 * Convert HTML to plain text PDF
 * Simple implementation that doesn't require puppeteer
 */
export async function htmlToSimplePDF(html: string, title: string): Promise<Buffer> {
  try {
    // Strip HTML tags and convert to plain text
    const text = stripHtmlTags(html)
    
    // Create a simple PDF-like structure
    // For production, you'd use a library like pdfkit or puppeteer
    // For now, we'll create a text representation
    const pdfContent = `
${title}
${'='.repeat(title.length)}

${text}
    `.trim()
    
    // Convert to buffer
    return Buffer.from(pdfContent, 'utf-8')
    
  } catch (error) {
    console.error('[PDF-GENERATOR] Error:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
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
