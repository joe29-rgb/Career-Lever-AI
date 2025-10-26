'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Eye, Download, Mail, TrendingUp, Plus } from 'lucide-react'

interface VariantAnalytics {
  id: string
  name: string
  template: string
  isActive: boolean
  metrics: {
    views: number
    downloads: number
    responses: number
    totalInteractions: number
    responseRate: number
    downloadRate: number
  }
  createdAt: string
}

export default function ResumeABTestingPage() {
  const [variants, setVariants] = useState<VariantAnalytics[]>([])
  const [bestVariantId, setBestVariantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Get first resume ID (simplified)
      const resumeResponse = await fetch('/api/resume/list')
      if (!resumeResponse.ok) return

      const resumeData = await resumeResponse.json()
      const resumeId = resumeData.resumes?.[0]?.id

      if (!resumeId) return

      // Fetch variant analytics
      const response = await fetch(`/api/resume/variants/analytics?resumeId=${resumeId}`)
      if (response.ok) {
        const data = await response.json()
        setVariants(data.variants || [])
        setBestVariantId(data.bestVariant)
      }
    } catch (error) {
      console.error('[AB_TESTING] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Resume A/B Testing</h1>
        <p className="text-muted-foreground">
          Track which resume variants perform best and optimize your applications
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Variants</p>
                <p className="text-2xl font-bold">{variants.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">
                  {variants.reduce((sum, v) => sum + v.metrics.views, 0)}
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Downloads</p>
                <p className="text-2xl font-bold">
                  {variants.reduce((sum, v) => sum + v.metrics.downloads, 0)}
                </p>
              </div>
              <Download className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Responses</p>
                <p className="text-2xl font-bold">
                  {variants.reduce((sum, v) => sum + v.metrics.responses, 0)}
                </p>
              </div>
              <Mail className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resume Variants Performance</span>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Variant
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No variants yet. Create your first variant to start A/B testing.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Variant
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className={`p-6 rounded-lg border-2 ${
                    variant.id === bestVariantId
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{variant.name}</h3>
                        {variant.id === bestVariantId && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Best Performer
                          </span>
                        )}
                        {variant.isActive && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Template: {variant.template}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-muted-foreground">Views</span>
                      </div>
                      <div className="text-2xl font-bold">{variant.metrics.views}</div>
                    </div>

                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Download className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Downloads</span>
                      </div>
                      <div className="text-2xl font-bold">{variant.metrics.downloads}</div>
                    </div>

                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Mail className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">Responses</span>
                      </div>
                      <div className="text-2xl font-bold">{variant.metrics.responses}</div>
                    </div>

                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Response Rate</div>
                      <div className="text-2xl font-bold text-green-600">
                        {variant.metrics.responseRate}%
                      </div>
                    </div>

                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Download Rate</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {variant.metrics.downloadRate}%
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">View</Button>
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">
                      {variant.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
