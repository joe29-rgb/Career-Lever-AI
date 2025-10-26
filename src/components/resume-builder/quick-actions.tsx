'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Download,
  Eye,
  Copy,
  Sparkles,
  FileText,
  Mail,
  Linkedin,
  Share2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface QuickActionsProps {
  onGenerateResume: () => void
  onDownloadPDF: () => void
  onDownloadHTML: () => void
  onPreview: () => void
  onCopyText: () => void
  isGenerating: boolean
  hasGenerated: boolean
}

export function QuickActions({
  onGenerateResume,
  onDownloadPDF,
  onDownloadHTML,
  onPreview,
  onCopyText,
  isGenerating,
  hasGenerated
}: QuickActionsProps) {
  const handleShare = () => {
    toast.success('Share feature coming soon!')
  }

  const handleLinkedInExport = () => {
    toast.success('LinkedIn export coming soon!')
  }

  const handleEmailResume = () => {
    toast.success('Email feature coming soon!')
  }

  return (
    <Card className="sticky top-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Primary Action */}
          <Button
            onClick={onGenerateResume}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Resume
              </>
            )}
          </Button>

          {/* Secondary Actions */}
          {hasGenerated && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={onDownloadPDF}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
                <Button
                  onClick={onDownloadHTML}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  HTML
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={onPreview}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  onClick={onCopyText}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-2"></div>

              {/* Share Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Share & Export</p>
                <Button
                  onClick={handleLinkedInExport}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Linkedin className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm">Export to LinkedIn</span>
                </Button>
                <Button
                  onClick={handleEmailResume}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Mail className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm">Email Resume</span>
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Share2 className="w-4 h-4 mr-2 text-purple-600" />
                  <span className="text-sm">Share Link</span>
                </Button>
              </div>
            </>
          )}

          {/* Help Text */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              {!hasGenerated ? (
                <>
                  <strong>💡 Tip:</strong> Fill in your information, then click Generate to create your professional resume.
                </>
              ) : (
                <>
                  <strong>✅ Ready!</strong> Your resume is generated. Download or share it now.
                </>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
