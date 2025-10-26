import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/outreach/followup/cancel
 * Cancel a follow-up sequence
 */
export async function POST(request: NextRequest) {
  try {
    await dbService.connect()
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { sequence_id, reason } = body
    
    if (!sequence_id) {
      return NextResponse.json({ error: 'sequence_id required' }, { status: 400 })
    }
    
    const FollowUpSequence = mongoose.models.FollowUpSequence
    if (!FollowUpSequence) {
      return NextResponse.json({ error: 'Model not found' }, { status: 500 })
    }
    
    // Update sequence status based on reason
    const newStatus = reason === 'replied' ? 'replied' : 'completed'
    
    const result = await FollowUpSequence.updateOne(
      {
        _id: sequence_id,
        userId: session.user.id
      },
      {
        $set: {
          status: newStatus,
          last_updated: new Date()
        }
      }
    )
    
    if (result.modifiedCount > 0) {
      console.log('[FOLLOWUP_CANCEL] Cancelled:', sequence_id, reason)
      return NextResponse.json({
        success: true,
        message: `Sequence cancelled: ${reason}`
      })
    } else {
      return NextResponse.json(
        { error: 'Sequence not found or unauthorized' },
        { status: 404 }
      )
    }
    
  } catch (error) {
    console.error('[FOLLOWUP_CANCEL] Error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel sequence' },
      { status: 500 }
    )
  }
}

