'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eye, Download, X } from 'lucide-react'

interface ResumePreviewModalProps {
  resumeHtml: string
  resumeCss: string
  templateName: string
  onDownload?: () => void
}

export function ResumePreviewModal({ 
  resumeHtml, 
  resumeCss, 
  templateName,
  onDownload 
}: ResumePreviewModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Eye className="w-4 h-4" />
        Preview Resume
      </Button>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>Resume Preview - {templateName}</DialogTitle>
              <div className="flex items-center gap-2">
                {onDownload && (
                  <Button
                    onClick={onDownload}
                    variant="default"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                )}
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
            <div className="max-w-[8.5in] mx-auto bg-white shadow-lg">
              <style dangerouslySetInnerHTML={{ __html: resumeCss }} />
              <div dangerouslySetInnerHTML={{ __html: resumeHtml }} />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              💡 Tip: This is how your resume will look when downloaded or printed
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Compact version for mobile - opens full screen
 */
export function ResumePreviewButton({ 
  resumeHtml, 
  resumeCss, 
  templateName,
  onDownload,
  className = ''
}: ResumePreviewModalProps & { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="default"
        className={`gap-2 ${className}`}
        size="lg"
      >
        <Eye className="w-5 h-5" />
        <span className="hidden sm:inline">Preview Resume</span>
        <span className="sm:hidden">Preview</span>
      </Button>

      {/* Full-screen modal on mobile */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-screen h-screen max-w-none p-0 m-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b p-3 flex items-center justify-between">
            <h2 className="font-semibold text-sm sm:text-base truncate">
              {templateName}
            </h2>
            <div className="flex items-center gap-2">
              {onDownload && (
                <Button
                  onClick={onDownload}
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              )}
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Preview Content - Scrollable */}
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-2 sm:p-4">
            <div className="max-w-[8.5in] mx-auto bg-white shadow-lg">
              <style dangerouslySetInnerHTML={{ __html: resumeCss }} />
              <div dangerouslySetInnerHTML={{ __html: resumeHtml }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
