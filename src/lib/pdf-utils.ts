/**
 * PDF Utility Functions
 * Handles PDF text extraction for resume parsing
 */

import * as pdfjsLib from 'pdfjs-dist'

// Set worker path for PDF.js
if (typeof window === 'undefined') {
  // Server-side
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

/**
 * Extract text content from a PDF file
 * @param file - PDF file to extract text from
 * @returns Extracted text content
 */
export async function extractTextFromPDF(file: File | Blob): Promise<string> {
  try {
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    let fullText = ''
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      
      fullText += pageText + '\n\n'
    }
    
    return fullText.trim()
  } catch (error) {
    console.error('[PDF_UTILS] Error extracting text:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

/**
 * Get PDF metadata
 * @param file - PDF file
 * @returns PDF metadata
 */
export async function getPDFMetadata(file: File | Blob): Promise<{
  numPages: number
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
}> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const metadata = await pdf.getMetadata()
    const info = metadata.info as any
    
    return {
      numPages: pdf.numPages,
      title: info?.Title,
      author: info?.Author,
      subject: info?.Subject,
      keywords: info?.Keywords,
      creator: info?.Creator,
      producer: info?.Producer,
      creationDate: info?.CreationDate ? new Date(info.CreationDate) : undefined,
      modificationDate: info?.ModDate ? new Date(info.ModDate) : undefined
    }
  } catch (error) {
    console.error('[PDF_UTILS] Error getting metadata:', error)
    throw new Error('Failed to get PDF metadata')
  }
}

/**
 * Validate if file is a valid PDF
 * @param file - File to validate
 * @returns True if valid PDF
 */
export async function isValidPDF(file: File | Blob): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    await loadingTask.promise
    return true
  } catch {
    return false
  }
}
