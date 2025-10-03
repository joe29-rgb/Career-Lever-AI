import { jsPDF } from 'jspdf'

export class ApplicationPDFComposer {
  generateResumePDF(resumeText: string): Blob {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Resume', 20, 20)
    doc.setFontSize(12)
    const splitText = doc.splitTextToSize(resumeText, 170)
    doc.text(splitText, 20, 30)
    return doc.output('blob')
  }
  
  generateCoverLetterPDF(coverLetter: string): Blob {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Cover Letter', 20, 20)
    doc.setFontSize(12)
    const splitText = doc.splitTextToSize(coverLetter, 170)
    doc.text(splitText, 20, 30)
    return doc.output('blob')
  }
  
  generateApplicationPackage(resumeText: string, coverLetter: string, jobData: any) {
    return {
      resumePDF: this.generateResumePDF(resumeText),
      coverLetterPDF: this.generateCoverLetterPDF(coverLetter),
      emailTemplate: `Subject: Application for ${jobData.title}\n\n${coverLetter}`
    }
  }
}
