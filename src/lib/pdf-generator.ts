import jsPDF from 'jspdf'

export async function generateResumePDF(resumeData) {
  const doc = new jsPDF()
  doc.text('Resume', 10, 10)
  // Add resume content to PDF
  const blob = doc.output('blob')
  return blob
}
