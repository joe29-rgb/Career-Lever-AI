/**
 * Text Formatting Utilities
 * Fixes ISSUE #3: ALL CAPS names in cover letters
 */

/**
 * Convert text to Title Case
 * Handles special cases: McDonald, O'Brien, McKenzie, etc.
 */
export function toTitleCase(str: string): string {
  if (!str) return ''
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Handle possessives and contractions (O'Brien, don't)
      if (word.includes("'")) {
        const parts = word.split("'")
        return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("'")
      }
      
      // Handle Mc/Mac prefixes (McDonald, McKenzie, MacArthur)
      if (word.toLowerCase().startsWith('mc') && word.length > 2) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3)
      }
      
      if (word.toLowerCase().startsWith('mac') && word.length > 3) {
        return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4)
      }
      
      // Default: capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Format resume text with proper line breaks
 * Fixes ISSUE #2: Resume with no line breaks
 */
export function formatResumeWithLineBreaks(resumeText: string): string {
  if (!resumeText) return ''
  
  // If already has line breaks, return as-is
  if (resumeText.includes('\n\n')) {
    return resumeText
  }
  
  let formatted = resumeText
  
  // Add line breaks after common section headers
  const sectionHeaders = [
    'PROFESSIONAL SUMMARY',
    'PROFESSIONAL EXPERIENCE',
    'WORK EXPERIENCE',
    'EXPERIENCE',
    'EDUCATION',
    'SKILLS',
    'TECHNICAL SKILLS',
    'CORE COMPETENCIES',
    'KEY ACHIEVEMENTS',
    'ACHIEVEMENTS',
    'CERTIFICATIONS',
    'ADDITIONAL INFORMATION'
  ]
  
  sectionHeaders.forEach(header => {
    // Add double line break before section headers
    formatted = formatted.replace(
      new RegExp(`(${header})`, 'gi'),
      '\n\n$1\n'
    )
  })
  
  // Add line break after contact info (email, phone patterns)
  formatted = formatted.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '$1\n'
  )
  
  formatted = formatted.replace(
    /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g,
    '$1\n'
  )
  
  // Add line break after LinkedIn URLs
  formatted = formatted.replace(
    /(linkedin\.com\/[^\s]+)/gi,
    '$1\n\n'
  )
  
  // Add line break after bullet points
  formatted = formatted.replace(/•\s*/g, '\n• ')
  
  // Add line break after dates (e.g., "2020 - 2023")
  formatted = formatted.replace(
    /(\d{4}\s*[-–—]\s*(?:\d{4}|Present|Current))/gi,
    '$1\n'
  )
  
  // Clean up multiple consecutive line breaks (max 2)
  formatted = formatted.replace(/\n{3,}/g, '\n\n')
  
  // Trim whitespace
  formatted = formatted.trim()
  
  return formatted
}

/**
 * Extract name from resume text and format it properly
 */
export function extractAndFormatName(resumeText: string): string {
  if (!resumeText) return ''
  
  // Try to find name in first few lines
  const lines = resumeText.split('\n').slice(0, 5)
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Skip empty lines and lines with email/phone
    if (!trimmed || trimmed.includes('@') || /\d{3}/.test(trimmed)) {
      continue
    }
    
    // Check if line looks like a name (2-4 words, mostly letters)
    const words = trimmed.split(/\s+/)
    if (words.length >= 2 && words.length <= 4) {
      const isName = words.every(w => /^[A-Za-z'-]+$/.test(w))
      if (isName) {
        return toTitleCase(trimmed)
      }
    }
  }
  
  return ''
}

/**
 * Format phone number consistently
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  
  // Format as +X (XXX) XXX-XXXX
  if (digits.length === 11) {
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  
  return phone
}
