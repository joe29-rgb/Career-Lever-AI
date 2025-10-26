/**
 * Resume Template System
 * Exports all 6 professional resume templates
 */

export { BaseTemplate } from './BaseTemplate'
export type { TemplateProps, TemplateConfig } from './BaseTemplate'

// Template metadata for UI
export const TEMPLATE_METADATA = {
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Two-column layout with visual timeline',
    icon: '🚀',
    bestFor: ['Tech', 'Startup', 'Marketing', 'Design'],
    features: ['Timeline', 'Skill bars', 'Color accents']
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Traditional single-column format',
    icon: '💼',
    bestFor: ['Finance', 'Legal', 'Corporate', 'Healthcare'],
    features: ['Black & white', 'Formal fonts', 'Conservative']
  },
  creative: {
    id: 'creative',
    name: 'Creative',
    description: 'Bold, unique design to showcase creativity',
    icon: '🎨',
    bestFor: ['Design', 'Marketing', 'Media', 'Arts'],
    features: ['Asymmetric layout', 'Bold colors', 'Visual elements']
  },
  tech: {
    id: 'tech',
    name: 'Tech-Focused',
    description: 'Developer-friendly with project highlights',
    icon: '💻',
    bestFor: ['Software Engineering', 'DevOps', 'Data Science'],
    features: ['GitHub integration', 'Code font', 'Project showcase']
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal/ATS',
    description: 'Plain text, maximum ATS compatibility',
    icon: '📄',
    bestFor: ['ATS Systems', 'Large Corporations', 'Government'],
    features: ['Plain text', 'No graphics', 'ATS-optimized']
  },
  executive: {
    id: 'executive',
    name: 'Executive',
    description: 'Leadership-focused with metrics emphasis',
    icon: '👔',
    bestFor: ['C-Suite', 'Director', 'VP', 'Senior Management'],
    features: ['Metrics-driven', 'Leadership focus', 'Board positions']
  }
} as const

export type TemplateId = keyof typeof TEMPLATE_METADATA
