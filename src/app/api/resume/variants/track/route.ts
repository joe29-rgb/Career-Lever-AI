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

    const { variantId, eventType } = await request.json()

    if (!variantId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update variant metrics
    const updateData: any = {}
    
    switch (eventType) {
      case 'view':
        updateData.views = { increment: 1 }
        break
      case 'download':
        updateData.downloads = { increment: 1 }
        break
      case 'response':
        updateData.responses = { increment: 1 }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        )
    }

    const variant = await prisma.resumeVariant.update({
      where: { id: variantId },
      data: updateData
    })

    // Log the event
    await prisma.resumeVariantEvent.create({
      data: {
        variantId,
        eventType,
        userId: session.user.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      variant
    })
  } catch (error) {
    console.error('[RESUME_VARIANT] Track error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}
