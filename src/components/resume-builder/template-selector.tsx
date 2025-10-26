'use client'

import { TemplatePreview } from './template-preview'

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, contemporary design with gradient header',
    preview: '🎨',
    color: 'from-blue-500 to-purple-600',
    recommended: true
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Traditional layout perfect for corporate roles',
    preview: '💼',
    color: 'from-gray-700 to-gray-900',
    recommended: false
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold, colorful design for creative industries',
    preview: '🎭',
    color: 'from-pink-500 to-orange-500',
    recommended: false
  },
  {
    id: 'tech',
    name: 'Tech-Focused',
    description: 'Code-friendly with monospace accents',
    preview: '💻',
    color: 'from-green-500 to-teal-600',
    recommended: false
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'ATS-optimized, maximum compatibility',
    preview: '📄',
    color: 'from-gray-400 to-gray-600',
    recommended: false
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Premium, leadership-focused design',
    preview: '👔',
    color: 'from-indigo-600 to-purple-700',
    recommended: false
  }
]

interface TemplateSelectorProps {
  selectedTemplate: string
  onSelectTemplate: (templateId: string) => void
}

export function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="bg-card rounded-xl border-2 border-border p-6">
      <h3 className="text-xl font-bold text-foreground mb-4">Choose Your Template</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <TemplatePreview
            key={template.id}
            id={template.id}
            name={template.name}
            description={template.description}
            isSelected={selectedTemplate === template.id}
            onSelect={() => onSelectTemplate(template.id)}
            recommended={template.recommended}
          />
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>💡 Tip:</strong> All templates are ATS-compatible. Choose based on your industry and personal style!
        </p>
      </div>
    </div>
  )
}
