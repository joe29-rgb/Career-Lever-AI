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
  // Generate mini preview based on template type
  const getPreviewContent = () => {
    switch (id) {
      case 'modern':
        return (
          <div className="w-full h-full bg-white p-2 text-[4px] leading-tight">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-t mb-1"></div>
            <div className="space-y-0.5">
              <div className="h-1 bg-gray-800 w-3/4 rounded"></div>
              <div className="h-0.5 bg-gray-400 w-1/2 rounded"></div>
              <div className="h-0.5 bg-gray-400 w-2/3 rounded mt-1"></div>
              <div className="grid grid-cols-3 gap-0.5 mt-1">
                <div className="h-3 bg-gray-100 rounded"></div>
                <div className="h-3 bg-gray-100 rounded"></div>
                <div className="h-3 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        )
      case 'professional':
        return (
          <div className="w-full h-full bg-white p-2 text-[4px] leading-tight">
            <div className="text-center mb-1">
              <div className="h-1 bg-gray-900 w-2/3 mx-auto rounded mb-0.5"></div>
              <div className="h-0.5 bg-gray-600 w-1/2 mx-auto rounded"></div>
            </div>
            <div className="space-y-0.5">
              <div className="h-0.5 bg-gray-800 w-1/3 rounded"></div>
              <div className="h-2 bg-gray-100 rounded"></div>
              <div className="h-0.5 bg-gray-800 w-1/3 rounded mt-1"></div>
              <div className="h-2 bg-gray-100 rounded"></div>
            </div>
          </div>
        )
      case 'creative':
        return (
          <div className="w-full h-full bg-gradient-to-br from-pink-50 to-orange-50 p-2 text-[4px] leading-tight">
            <div className="bg-gradient-to-r from-pink-500 to-orange-500 h-3 rounded-lg mb-1"></div>
            <div className="grid grid-cols-3 gap-0.5">
              <div className="col-span-2 space-y-0.5">
                <div className="h-1 bg-gray-800 w-full rounded"></div>
                <div className="h-2 bg-white rounded"></div>
                <div className="h-2 bg-white rounded"></div>
              </div>
              <div className="space-y-0.5">
                <div className="h-4 bg-white rounded"></div>
              </div>
            </div>
          </div>
        )
      case 'tech':
        return (
          <div className="w-full h-full bg-gray-900 p-2 text-[4px] leading-tight">
            <div className="border-l-2 border-green-500 pl-1 mb-1">
              <div className="h-1 bg-green-400 w-2/3 rounded mb-0.5"></div>
              <div className="h-0.5 bg-gray-400 w-1/2 rounded"></div>
            </div>
            <div className="space-y-0.5">
              <div className="h-0.5 bg-green-500 w-1/4 rounded"></div>
              <div className="h-2 bg-gray-800 rounded border border-green-900"></div>
              <div className="flex gap-0.5">
                <div className="h-1 bg-green-900 rounded flex-1"></div>
                <div className="h-1 bg-green-900 rounded flex-1"></div>
                <div className="h-1 bg-green-900 rounded flex-1"></div>
              </div>
            </div>
          </div>
        )
      case 'minimal':
        return (
          <div className="w-full h-full bg-white p-2 text-[4px] leading-tight">
            <div className="space-y-1">
              <div className="h-1 bg-gray-900 w-1/2 rounded"></div>
              <div className="h-0.5 bg-gray-500 w-1/3 rounded"></div>
              <div className="border-t border-gray-300 my-0.5"></div>
              <div className="space-y-0.5">
                <div className="h-0.5 bg-gray-700 w-1/4 rounded"></div>
                <div className="h-1.5 bg-gray-50 rounded"></div>
                <div className="h-0.5 bg-gray-700 w-1/4 rounded"></div>
                <div className="h-1.5 bg-gray-50 rounded"></div>
              </div>
            </div>
          </div>
        )
      case 'executive':
        return (
          <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 p-2 text-[4px] leading-tight">
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 h-5 rounded-t mb-1 flex items-end p-1">
              <div className="h-1 bg-white w-2/3 rounded"></div>
            </div>
            <div className="grid grid-cols-4 gap-0.5">
              <div className="col-span-3 space-y-0.5">
                <div className="h-2 bg-white rounded shadow-sm"></div>
                <div className="h-2 bg-white rounded shadow-sm"></div>
              </div>
              <div className="space-y-0.5">
                <div className="h-3 bg-indigo-100 rounded"></div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

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

        {/* Template Preview */}
        <div className="relative w-full aspect-[8.5/11] bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {getPreviewContent()}
          
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
