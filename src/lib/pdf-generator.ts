// PDF generation functionality using jsPDF library
import { jsPDF } from 'jspdf'

export async function generateResumePDF(resumeData: { text: string; name?: string }): Promise<Blob> {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margins = { top: 20, left: 20, right: 20, bottom: 20 }
    const maxWidth = pageWidth - margins.left - margins.right
    
    // Add title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(resumeData.name || 'Resume', margins.left, margins.top)
    
    // Add content
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    
    const lines = doc.splitTextToSize(resumeData.text, maxWidth)
    let currentY = margins.top + 10
    const lineHeight = 7
    const pageHeight = doc.internal.pageSize.getHeight()
    
    lines.forEach((line: string) => {
      if (currentY + lineHeight > pageHeight - margins.bottom) {
        doc.addPage()
        currentY = margins.top
      }
      doc.text(line, margins.left, currentY)
      currentY += lineHeight
    })
    
    // Convert to Blob
    const pdfBlob = doc.output('blob')
    return pdfBlob
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF')
  }
}
