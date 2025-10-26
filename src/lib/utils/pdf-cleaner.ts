/**
 * Remove PDF metadata artifacts from extracted text
 * Prevents "Producer", "Creator", "obj/endobj" from contaminating keyword extraction
 * 
 * @param text - Raw text extracted from PDF
 * @returns Cleaned text without PDF artifacts
 */
export function cleanPDFExtraction(text: string): string {
  let cleaned = text
  
  // Remove PDF metadata patterns
  const patterns = [
    /Producer\s*\([^)]+\)/gi,
    /Creator\s*\([^)]+\)/gi,
    /ModDate\s*\([^)]+\)/gi,
    /CreationDate\s*\([^)]+\)/gi,
    /\/(Type|Length|Filter|Subtype|Contents|Resources|MediaBox)/gi,
    /\d+\s+\d+\s+obj/gi,
    /endobj|xref|trailer|startxref/gi,
    /stream\s+endstream/gi
  ]
  
  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '')
  })
  
  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
  
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned
}

// Default export for convenience
export default cleanPDFExtraction
