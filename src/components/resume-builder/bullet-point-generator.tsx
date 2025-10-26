'use client'

import { useState } from 'react'
import { Wand2, Loader2, Plus, Sparkles } from 'lucide-react'

interface BulletPointGeneratorProps {
  role?: string
  company?: string
  achievements?: string[]
  onAddBullet: (bullet: string) => void
}

export function BulletPointGenerator({ role, company, achievements, onAddBullet }: BulletPointGeneratorProps) {
  const [generatedBullets, setGeneratedBullets] = useState<string[]>([])
  const [customInput, setCustomInput] = useState('')
  const [loading, setLoading] = useState(false)

  const generateBullets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/resume/generate-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, company, achievements })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedBullets(data.bullets)
      } else {
        console.error('Failed to generate bullets')
      }
    } catch (error) {
      console.error('Error generating bullets:', error)
    } finally {
      setLoading(false)
    }
  }

  const enhanceCustomInput = async () => {
    if (!customInput.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/resume/generate-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: customInput,
          role,
          company
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedBullets(data.bullets)
        setCustomInput('')
      }
    } catch (error) {
      console.error('Error enhancing input:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h4 className="font-bold text-lg text-foreground">AI Bullet Point Generator</h4>
        </div>
        <button
          onClick={generateBullets}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              {generatedBullets.length > 0 ? 'Regenerate' : 'Generate'}
            </>
          )}
        </button>
      </div>

      {generatedBullets.length > 0 && (
        <div className="space-y-3 mb-4">
          <p className="text-sm text-gray-600">Click any bullet to add it to your resume:</p>
          {generatedBullets.map((bullet, i) => (
            <button
              key={i}
              onClick={() => onAddBullet(bullet)}
              className="w-full text-left p-4 bg-card rounded-lg border-2 border-border hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  {i + 1}
                </span>
                <span className="flex-1 text-gray-700 group-hover:text-foreground">{bullet}</span>
                <Plus className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="relative">
          <textarea
            placeholder="Or describe what you did in plain English... AI will transform it into a powerful achievement bullet!"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="w-full p-4 border-2 border-border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
            rows={3}
          />
        </div>
        <button
          onClick={enhanceCustomInput}
          disabled={loading || !customInput.trim()}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              ✨ Enhance This
            </>
          )}
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> AI works best when you provide context. Mention numbers, timeframes, or specific outcomes!
        </p>
      </div>
    </div>
  )
}
