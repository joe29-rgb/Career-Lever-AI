/**
 * RESUME LIVE PREVIEW
 * Side-by-side resume editor with live preview
 */

'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface ResumeLivePreviewProps {
  initialData?: any
  onSave?: (data: any) => void
}

export function ResumeLivePreview({ initialData, onSave }: ResumeLivePreviewProps) {
  const [formData, setFormData] = useState(initialData || {})
  const [showPreview, setShowPreview] = useState(true)

  return (
    <div className="resume-editor-container">
      {/* Editor Side */}
      <div className="editor space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Edit Resume</h2>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show Preview
              </>
            )}
          </button>
        </div>

        <form className="space-y-6">
          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Professional Summary</h3>
            <textarea
              value={formData.summary || ''}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background resize-none"
              placeholder="Write a brief professional summary..."
            />
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={() => onSave?.(formData)}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Save Resume
          </button>
        </form>
      </div>

      {/* Preview Side */}
      <div className={`preview ${showPreview ? 'block' : 'hidden lg:block'}`}>
        <div className="sticky top-4">
          <h2 className="text-2xl font-bold mb-4">Preview</h2>
          <div className="preview-container bg-white text-black p-8 rounded-lg shadow-lg min-h-[600px]">
            {/* Resume Preview */}
            <div className="space-y-6">
              {formData.name && (
                <div className="text-center border-b border-gray-300 pb-4">
                  <h1 className="text-3xl font-bold text-black">{formData.name}</h1>
                  {formData.email && (
                    <p className="text-gray-600 mt-2">{formData.email}</p>
                  )}
                </div>
              )}

              {formData.summary && (
                <div>
                  <h2 className="text-xl font-semibold text-black mb-2">Professional Summary</h2>
                  <p className="text-gray-700 leading-relaxed">{formData.summary}</p>
                </div>
              )}

              {!formData.name && !formData.summary && (
                <div className="preview-empty">
                  <div className="preview-empty__icon">📄</div>
                  <p>Start editing to see your resume preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
