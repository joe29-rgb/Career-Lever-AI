/**
 * Template Preview Component
 * @description Displays resume template options with visual previews
 */
'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface TemplatePreviewProps {
  id: string
  name: string
  description: string
  isSelected: boolean
  onSelect: () => void
  recommended?: boolean
}

export function TemplatePreview({
  id,
  name,
  description,
  isSelected,
  onSelect,
  recommended = false
}: TemplatePreviewProps) {
  // FIX: Simple, reliable visual indicators instead of complex mini-layouts
  const getPreviewVisual = () => {
    const baseClasses = "w-full h-32 rounded-lg flex items-center justify-center text-4xl transition-all";
    
    switch (id) {
      case 'modern':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-blue-500 to-purple-600 text-white`}>
            🎨
          </div>
        );
      case 'professional':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-gray-700 to-gray-900 text-white`}>
            💼
          </div>
        );
      case 'creative':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-pink-500 to-orange-500 text-white`}>
            🎭
          </div>
        );
      case 'tech':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-green-500 to-teal-600 text-white`}>
            💻
          </div>
        );
      case 'minimal':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-gray-400 to-gray-600 text-white`}>
            📄
          </div>
        );
      case 'executive':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-indigo-600 to-purple-700 text-white`}>
            👔
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-blue-500 to-purple-600 text-white`}>
            📝
          </div>
        );
    }
  };

  return (
    <button
      onClick={onSelect}
      className={`relative group transition-all duration-200 ${
        isSelected ? 'scale-105' : 'hover:scale-102'
      }`}
    >
      <Card
        className={`overflow-hidden transition-all ${
          isSelected
            ? 'ring-2 ring-blue-500 shadow-lg'
            : 'hover:shadow-md border-2 border-border'
        }`}
      >
        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Recommended Badge */}
        {recommended && !isSelected && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
              ⭐ Recommended
            </Badge>
          </div>
        )}

        {/* Template Preview - FIXED: Simple, reliable visual */}
        <div className="relative w-full aspect-[8.5/11] bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {getPreviewVisual()}
          
          {/* Hover Overlay */}
          <div className={`absolute inset-0 bg-blue-500/10 transition-opacity ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`} />
        </div>

        {/* Template Info */}
        <div className="p-3 bg-card">
          <h4 className="font-semibold text-sm text-foreground mb-1">{name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </Card>
    </button>
  )
}
