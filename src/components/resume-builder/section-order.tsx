'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GripVertical, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'

interface Section {
  id: string
  label: string
  icon: string
  visible: boolean
}

interface SectionOrderProps {
  sections: Section[]
  onReorder: (sections: Section[]) => void
}

export function SectionOrder({ sections: initialSections, onReorder }: SectionOrderProps) {
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections]
    const [movedSection] = newSections.splice(fromIndex, 1)
    newSections.splice(toIndex, 0, movedSection)
    setSections(newSections)
    onReorder(newSections)
  }

  const moveUp = (index: number) => {
    if (index > 0) {
      moveSection(index, index - 1)
    }
  }

  const moveDown = (index: number) => {
    if (index < sections.length - 1) {
      moveSection(index, index + 1)
    }
  }

  const toggleVisibility = (index: number) => {
    const newSections = [...sections]
    newSections[index].visible = !newSections[index].visible
    setSections(newSections)
    onReorder(newSections)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      moveSection(draggedIndex, index)
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Section Order</CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag to reorder sections or use arrows
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                draggedIndex === index
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 opacity-50'
                  : section.visible
                  ? 'border-border bg-card hover:bg-muted/50'
                  : 'border-dashed border-muted-foreground/30 bg-muted/30'
              }`}
            >
              {/* Drag Handle */}
              <div className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Section Info */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-lg">{section.icon}</span>
                <span className={`text-sm font-medium ${
                  section.visible ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {section.label}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                {/* Visibility Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleVisibility(index)}
                  className="h-8 w-8 p-0"
                >
                  {section.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>

                {/* Move Up */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>

                {/* Move Down */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveDown(index)}
                  disabled={index === sections.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>💡 Tip:</strong> Put your strongest sections first. Most recruiters spend only 6 seconds on initial resume review!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
