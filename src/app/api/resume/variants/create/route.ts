import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resumeId, name, content, template } = await request.json()

    if (!resumeId || !name || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create resume variant
    const variant = await prisma.resumeVariant.create({
      data: {
        resumeId,
        name,
        content,
        template: template || 'modern',
        isActive: true,
        views: 0,
        downloads: 0,
        responses: 0
      }
    })

    return NextResponse.json({
      success: true,
      variant
    })
  } catch (error) {
    console.error('[RESUME_VARIANT] Create error:', error)
    return NextResponse.json(
      { error: 'Failed to create variant' },
      { status: 500 }
    )
  }
}
