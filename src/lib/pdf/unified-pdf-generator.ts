/**
 * Unified PDF Generator
 * 
 * Combines pdfkit (simple, fast) and @react-pdf/renderer (styled, beautiful)
 * Automatically chooses the right tool for the job
 */

import PDFDocument from 'pdfkit'
import { getTemplateById } from '@/lib/resume-templates-v2'

export interface PDFGenerationOptions {
  title?: string
  author?: string
  subject?: string
  keywords?: string[]
  useStyledPDF?: boolean // Use react-pdf for styled output
  template?: string // Resume template ID
}

/**
 * Generate PDF from HTML content (simple, fast)
 * Uses pdfkit for basic text-based PDFs
 */
export async function generateSimplePDF(
  html: string,
  title: string = 'Document',
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Use Courier which is built-in and doesn't require external files
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: options.title || title,
          Author: options.author || 'Career Lever AI',
          Subject: options.subject || title,
          Keywords: options.keywords?.join(', ') || ''
        }
      })

      const chunks: Buffer[] = []
      
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Add title using Courier-Bold (built-in, no external files needed)
      doc.font('Courier-Bold')
         .fontSize(16)
         .text(title, { align: 'center' })
         .moveDown()

      // Strip HTML and add content using Courier (built-in)
      const text = stripHtmlTags(html)
      doc.font('Courier')
         .fontSize(10)
         .text(text, {
           align: 'left',
           lineGap: 4
         })

      doc.end()
    } catch (error) {
      console.error('[PDF] Generation error:', error)
      reject(error)
    }
  })
}

/**
 * Generate styled PDF from resume data
 * Uses template system for beautiful formatting
 */
export async function generateStyledResumePDF(
  resumeHTML: string,
  templateId: string = 'modern',
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  // For now, use simple PDF with better formatting
  // TODO: Implement react-pdf rendering in Phase 2
  const template = getTemplateById(templateId)
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        info: {
          Title: options.title || `Resume - ${template.name} Template`,
          Author: options.author || 'Career Lever AI',
          Subject: 'Professional Resume',
          Keywords: 'resume, cv, job application'
        }
      })

      const chunks: Buffer[] = []
      
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Parse HTML and render with formatting
      renderHTMLToPDF(doc, resumeHTML, template.name)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate cover letter PDF
 */
export async function generateCoverLetterPDF(
  coverLetterHTML: string,
  templateId: string = 'modern',
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
        info: {
          Title: options.title || 'Cover Letter',
          Author: options.author || 'Career Lever AI',
          Subject: `Job Application Cover Letter (${templateId} template)`,
          Keywords: 'cover letter, job application'
        }
      })

      const chunks: Buffer[] = []
      
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Render cover letter with proper formatting
      renderCoverLetterToPDF(doc, coverLetterHTML)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Helper: Strip HTML tags
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Helper: Render HTML to PDF with formatting
 */
function renderHTMLToPDF(doc: PDFKit.PDFDocument, html: string, templateName: string) {
  // Add template name as header
  doc.fontSize(10)
     .fillColor('#666')
     .text(templateName + ' Template', { align: 'right' })
     .moveDown(0.5)

  // Parse HTML sections
  const sections = parseHTMLSections(html)
  
  sections.forEach((section, index) => {
    if (index > 0) doc.moveDown(1)
    
    // Section header
    if (section.header) {
      doc.font('Courier-Bold')
         .fontSize(12)
         .fillColor('#000')
         .text(section.header.toUpperCase())
         .moveDown(0.5)
    }

    // Section content
    doc.font('Courier')
       .fontSize(9)
       .fillColor('#333')
       .text(section.content, {
         lineGap: 3
       })
  })
}

/**
 * Helper: Render cover letter to PDF
 */
function renderCoverLetterToPDF(doc: PDFKit.PDFDocument, html: string) {
  const text = stripHtmlTags(html)
  const paragraphs = text.split('\n\n').filter(p => p.trim())

  paragraphs.forEach((paragraph, index) => {
    if (index > 0) doc.moveDown(1)
    
    doc.font('Courier')
       .fontSize(10)
       .fillColor('#000')
       .text(paragraph.trim(), {
         align: 'left',
         lineGap: 4
       })
  })
}

/**
 * Helper: Parse HTML into sections
 */
function parseHTMLSections(html: string): Array<{ header?: string; content: string }> {
  const sections: Array<{ header?: string; content: string }> = []
  
  // Simple section parsing (can be enhanced)
  const headerRegex = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi
  const parts = html.split(headerRegex)
  
  for (let i = 0; i < parts.length; i += 2) {
    const header = parts[i + 1]
    const content = stripHtmlTags(parts[i + 2] || parts[i])
    
    if (content.trim()) {
      sections.push({
        header: header ? stripHtmlTags(header) : undefined,
        content: content.trim()
      })
    }
  }
  
  return sections.length > 0 ? sections : [{ content: stripHtmlTags(html) }]
}

// Export aliases for backward compatibility
export const generateResumePDF = generateSimplePDF
