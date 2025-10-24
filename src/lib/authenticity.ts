export type AuthenticityReport = {
  isValid: boolean
  violations: string[]
  warnings: string[]
  authenticityScore: number
}

const AI_TRIGGER_PHRASES = [
  // Generic buzzwords
  'dynamic',
  'results-driven',
  'progressive experience',
  'leveraging synergies',
  'fostering culture of excellence',
  'end-to-end solutions',
  'customer-centric approach',
  'excited to apply',
  'resonates with my values',
  
  // Common AI phrases
  'passionate about',
  'proven track record',
  'detail-oriented',
  'team player',
  'go-getter',
  'self-starter',
  'think outside the box',
  'hit the ground running',
  'wear many hats',
  'synergy',
  'paradigm shift',
  'game-changer',
  'best practices',
  'core competencies',
  'value-added',
  'strategic thinker',
  'proactive',
  'results-oriented',
  'highly motivated',
  'excellent communication skills',
  
  // Corporate jargon
  'circle back',
  'touch base',
  'low-hanging fruit',
  'move the needle',
  'deep dive',
  'drill down',
  'take it offline',
  'bandwidth',
  'actionable insights',
  'key takeaways',
  'stakeholder engagement',
  'cross-functional collaboration',
  'deliverables',
  'seamless integration',
  'scalable solutions',
  
  // Overused phrases
  'innovative solutions',
  'cutting-edge',
  'world-class',
  'industry-leading',
  'best-in-class',
  'state-of-the-art',
  'next-generation',
  'revolutionary',
  'transformative',
  'disruptive',
  'robust',
  'comprehensive',
  'holistic approach',
  'value proposition'
]

const COMMON_TOOLS = [
  'Salesforce', 'HubSpot', 'Zoho', 'Marketo', 'Pardot', 'Outreach', 'Apollo', 'JustCall',
  'Workday', 'Greenhouse', 'Lever', 'Taleo'
]

function extractNumbers(text: string): string[] {
  const nums = text.match(/\b(\$\d[\d,]*|\d+%|\d+[KMB]\+?)\b/g) || []
  return Array.from(new Set(nums))
}

function containsPhrase(text: string, phrase: string): boolean {
  return text.toLowerCase().includes(phrase.toLowerCase())
}

function extractMentionedTools(text: string): string[] {
  const found = COMMON_TOOLS.filter(t => new RegExp(`\\b${t}\\b`, 'i').test(text))
  return found
}

export function validateAuthenticityResume(original: string, generated: string): AuthenticityReport {
  const violations: string[] = []
  const warnings: string[] = []

  // Numbers must exist in original
  const genNums = extractNumbers(generated)
  const origNums = extractNumbers(original)
  for (const n of genNums) {
    if (!origNums.includes(n)) violations.push(`FABRICATED NUMBER: ${n}`)
  }

  // AI trigger phrases
  for (const p of AI_TRIGGER_PHRASES) {
    if (containsPhrase(generated, p)) violations.push(`AI TRIGGER PHRASE: ${p}`)
  }

  // Tools must exist in original
  const genTools = extractMentionedTools(generated)
  for (const tool of genTools) {
    if (!new RegExp(`\\b${tool}\\b`, 'i').test(original)) violations.push(`FABRICATED TOOL: ${tool}`)
  }

  // Score: start at 100, subtract for violations, add for human markers
  let authenticityScore = 100
  authenticityScore -= Math.min(60, violations.length * 12)

  const humanMarkers = ['i managed', 'i led', 'during my time', 'when i', 'working with', 'helped', 'built relationships', 'learned']
  for (const m of humanMarkers) {
    if (containsPhrase(generated, m)) authenticityScore += 5
  }
  authenticityScore = Math.max(0, Math.min(100, authenticityScore))

  return { isValid: violations.length === 0, violations, warnings, authenticityScore }
}

export function validateAuthenticityLetter(original: string, letter: string): AuthenticityReport {
  // Reuse the same checks for numbers/tools/phrases
  return validateAuthenticityResume(original, letter)
}

export function sanitizeCoverLetter(original: string, letter: string): string {
  let out = letter
  // Replace numbers not in original with placeholder
  const genNums = extractNumbers(letter)
  const origNums = extractNumbers(original)
  for (const n of genNums) {
    if (!origNums.includes(n)) {
      // Replace with placeholder instead of removing
      out = out.replace(new RegExp(n.replace(/([$^*+?.()|\[\]{}])/g, '\\$1'), 'g'), '[X]')
    }
  }
  // Replace AI trigger phrases with more natural alternatives
  const phraseReplacements: Record<string, string> = {
    'dynamic': 'adaptable',
    'results-driven': 'focused on outcomes',
    'leveraging synergies': 'working together',
    'passionate about': 'interested in',
    'proven track record': 'experience with',
    'detail-oriented': 'thorough',
    'team player': 'collaborative',
    'go-getter': 'motivated',
    'self-starter': 'independent'
  }
  
  for (const p of AI_TRIGGER_PHRASES) {
    const replacement = phraseReplacements[p.toLowerCase()] || ''
    const re = new RegExp(p.replace(/([$^*+?.()|\[\]{}])/g, '\\$1'), 'gi')
    out = out.replace(re, replacement)
  }
  
  // Replace fabricated tools with generic term
  const tools = extractMentionedTools(letter)
  for (const t of tools) {
    if (!new RegExp(`\\b${t}\\b`, 'i').test(original)) {
      const re = new RegExp(t.replace(/([$^*+?.()|\[\]{}])/g, '\\$1'), 'gi')
      out = out.replace(re, 'business systems')
    }
  }
  // Clean extra spaces
  out = out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  return out
}

export function basicFormatResume(original: string): string {
  let formatted = original
  // Bold common headers markers (text markers only; renderer can bold **)
  formatted = formatted.replace(/^(PROFESSIONAL SUMMARY|PROFESSIONAL EXPERIENCE|EXPERIENCE|EDUCATION|SKILLS|CORE COMPETENCIES)/gmi, '**$1**')
  // Normalize bullets
  formatted = formatted.replace(/^[\-*]\s/gm, '• ')
  return formatted.trim()
}


