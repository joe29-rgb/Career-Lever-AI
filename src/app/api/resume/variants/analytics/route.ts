import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const resumeId = searchParams.get('resumeId')

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Missing resumeId' },
        { status: 400 }
      )
    }

    // Get all variants for this resume
    const variants = await prisma.resumeVariant.findMany({
      where: { resumeId },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate performance metrics
    const analytics = variants.map(variant => {
      const totalInteractions = variant.views + variant.downloads + variant.responses
      const responseRate = variant.views > 0 ? (variant.responses / variant.views) * 100 : 0
      const downloadRate = variant.views > 0 ? (variant.downloads / variant.views) * 100 : 0

      return {
        id: variant.id,
        name: variant.name,
        template: variant.template,
        isActive: variant.isActive,
        metrics: {
          views: variant.views,
          downloads: variant.downloads,
          responses: variant.responses,
          totalInteractions,
          responseRate: Math.round(responseRate * 10) / 10,
          downloadRate: Math.round(downloadRate * 10) / 10
        },
        createdAt: variant.createdAt
      }
    })

    // Find best performing variant
    const bestVariant = analytics.reduce((best, current) => {
      return current.metrics.responseRate > best.metrics.responseRate ? current : best
    }, analytics[0])

    return NextResponse.json({
      success: true,
      variants: analytics,
      bestVariant: bestVariant?.id,
      summary: {
        totalVariants: variants.length,
        activeVariants: variants.filter(v => v.isActive).length,
        totalViews: variants.reduce((sum, v) => sum + v.views, 0),
        totalDownloads: variants.reduce((sum, v) => sum + v.downloads, 0),
        totalResponses: variants.reduce((sum, v) => sum + v.responses, 0)
      }
    })
  } catch (error) {
    console.error('[RESUME_VARIANT] Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
