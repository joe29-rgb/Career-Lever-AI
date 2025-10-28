'use client'

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Two-column with sidebar and progress bars',
    preview: '🎨',
    color: 'from-blue-500 to-purple-600',
    recommended: true,
    bestFor: 'Technology, Startups, Creative'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Traditional single-column for corporate',
    preview: '💼',
    color: 'from-gray-700 to-gray-900',
    recommended: false,
    bestFor: 'Corporate, Finance, Legal'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Asymmetric with bold colors and badges',
    preview: '🎭',
    color: 'from-pink-500 to-orange-500',
    recommended: false,
    bestFor: 'Design, Marketing, Media'
  },
  {
    id: 'tech',
    name: 'Tech-Focused',
    description: 'Developer-optimized with tech stack',
    preview: '💻',
    color: 'from-green-500 to-teal-600',
    recommended: false,
    bestFor: 'Software Engineering, DevOps'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'ATS-optimized, maximum compatibility',
    preview: '📄',
    color: 'from-gray-400 to-gray-600',
    recommended: false,
    bestFor: 'All Industries, ATS Systems'
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Premium, leadership-focused design',
    preview: '👔',
    color: 'from-indigo-600 to-purple-700',
    recommended: false,
    bestFor: 'C-Suite, Director, Executive'
  },
  {
    id: 'cv',
    name: 'Curriculum Vitae',
    description: 'Academic and research-focused',
    preview: '🎓',
    color: 'from-amber-600 to-orange-700',
    recommended: false,
    bestFor: 'Academic, Research, Education'
  },
  {
    id: 'teal-horizontal',
    name: 'Teal Horizontal',
    description: 'Clean single-column with teal accents',
    preview: '🌊',
    color: 'from-teal-500 to-cyan-600',
    recommended: false,
    bestFor: 'Technology, Business, Consulting'
  },
  {
    id: 'two-column-red',
    name: 'Two-Column Red',
    description: 'Sidebar layout with red accents',
    preview: '🔴',
    color: 'from-red-500 to-rose-600',
    recommended: false,
    bestFor: 'Creative, Marketing, Design'
  }
]

interface TemplateSelectorProps {
  selectedTemplate: string
  onSelectTemplate: (templateId: string) => void
}

export function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  const selectedTemplateData = TEMPLATES.find(t => t.id === selectedTemplate)
  
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 border-b border-border">
        <h3 className="text-lg font-bold text-foreground">Choose Design</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select a template that matches your industry
        </p>
      </div>
      
      {/* Vertical scrollable template list */}
      <div className="max-h-[600px] overflow-y-auto p-4 space-y-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`
              w-full text-left p-3 rounded-lg border-2 transition-all
              ${selectedTemplate === template.id
                ? 'border-primary bg-primary/10 shadow-md'
                : 'border-border hover:border-primary/50 hover:bg-accent/5'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                bg-gradient-to-br ${template.color}
              `}>
                {template.preview}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground text-sm">
                    {template.name}
                  </h4>
                  {template.recommended && (
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {template.description}
                </p>
                <p className="text-xs text-primary/80 mt-1">
                  Best for: {template.bestFor}
                </p>
              </div>
              
              {selectedTemplate === template.id && (
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Selected template info */}
      {selectedTemplateData && (
        <div className="p-4 bg-accent/5 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-muted-foreground">
              Selected: <span className="text-foreground font-medium">{selectedTemplateData.name}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
