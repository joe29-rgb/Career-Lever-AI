'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

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
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Choose Your Template</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            {/* Selected Checkmark */}
            {selectedTemplate === template.id && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Recommended Badge */}
            {template.recommended && (
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                  Recommended
                </span>
              </div>
            )}

            {/* Template Preview */}
            <div className={`w-full h-32 bg-gradient-to-br ${template.color} rounded-lg mb-4 flex items-center justify-center text-6xl`}>
              {template.preview}
            </div>

            {/* Template Info */}
            <h4 className="font-bold text-gray-900 mb-1">{template.name}</h4>
            <p className="text-sm text-gray-600">{template.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> All templates are ATS-compatible. Choose based on your industry and personal style!
        </p>
      </div>
    </div>
  )
}
