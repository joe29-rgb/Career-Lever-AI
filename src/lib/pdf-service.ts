import pdfParse from 'pdf-parse-debugging-disabled'

interface PDFExtractionResult {
  text: string
  method: 'text-extraction' | 'ocr-fallback' | 'manual-input'
  confidence: number
  error?: string
}

export class PDFService {
  private static instance: PDFService

  static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService()
    }
    return PDFService.instance
  }

  async extractText(buffer: Buffer, filename: string): Promise<PDFExtractionResult> {
    try {
      // Validate PDF
      if (!this.isPDF(buffer)) {
        throw new Error('Invalid PDF file')
      }

      // Try text extraction first (using pdf-parse-debugging-disabled to avoid test file issues)
      const result = await pdfParse(buffer)
      const text = this.cleanText(result.text)

      if (text.length > 100) {
        return {
          text,
          method: 'text-extraction',
          confidence: 0.95
        }
      }

      // If text is too short, try manual parsing
      return {
        text: '',
        method: 'manual-input',
        confidence: 0,
        error: 'PDF text extraction resulted in insufficient content. Please paste your resume text instead.'
      }

    } catch (error) {
      return {
        text: '',
        method: 'manual-input',
        confidence: 0,
        error: `PDF processing failed: ${(error as Error).message}`
      }
    }
  }

  private isPDF(buffer: Buffer): boolean {
    const pdfSignature = buffer.subarray(0, 4)
    return pdfSignature.toString() === '%PDF'
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-.,;:()\[\]{}'"@#$%&*+=<>?!/\\|`~]/g, '')
      .trim()
  }
}
