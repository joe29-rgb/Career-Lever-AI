import DOMPurify from 'isomorphic-dompurify'

export class InputValidator {
  static sanitizeText(input: string, maxLength = 10000): string {
    return DOMPurify.sanitize(input.trim().substring(0, maxLength), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    })
  }

  static sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    })
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 255
  }

  static validateURL(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return ['http:', 'https:'].includes(parsedUrl.protocol)
    } catch {
      return false
    }
  }

  static validateFileUpload(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' }
    }

    return { valid: true }
  }
}
