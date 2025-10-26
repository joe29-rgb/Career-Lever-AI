import { PDFService } from './pdf-service'

export class ApplicationPDFComposer {
  private pdfService = PDFService.getInstance()

  async generateResumePDF(resumeText: string): Promise<Blob> {
    const result = await this.pdfService.extractText(Buffer.from(resumeText), 'resume.txt')
    if (result.error) {
      throw new Error(result.error)
    }
    return new Blob([result.text], { type: 'application/pdf' })
  }

  async generateCoverLetterPDF(coverLetter: string): Promise<Blob> {
    const result = await this.pdfService.extractText(Buffer.from(coverLetter), 'cover-letter.txt')
    if (result.error) {
      throw new Error(result.error)
    }
    return new Blob([result.text], { type: 'application/pdf' })
  }

  async generateApplicationPackage(resumeText: string, coverLetter: string, jobData: any) {
    const resumePDF = await this.generateResumePDF(resumeText)
    const coverLetterPDF = await this.generateCoverLetterPDF(coverLetter)

    return {
      resumePDF,
      coverLetterPDF,
      emailTemplate: `Subject: Application for ${jobData.title}\n\n${coverLetter}`
    }
  }
}
