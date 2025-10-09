import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/outreach/followup/mark-sent
 * Mark a follow-up step as sent
 */
export async function POST(request: NextRequest) {
  try {
    await dbService.connect()
    
    const body = await request.json()
    const { followup_id, message_id, sent_at } = body
    
    if (!followup_id) {
      return NextResponse.json({ error: 'followup_id required' }, { status: 400 })
    }
    
    // Parse followup_id: "sequenceId_stepNumber"
    const [sequenceId, stepNumberStr] = followup_id.split('_')
    const stepNumber = parseInt(stepNumberStr)
    
    const FollowUpSequence = mongoose.models.FollowUpSequence
    if (!FollowUpSequence) {
      return NextResponse.json({ error: 'Model not found' }, { status: 500 })
    }
    
    // Update the specific step in the sequence
    const result = await FollowUpSequence.updateOne(
      {
        _id: sequenceId,
        'sequences.step_number': stepNumber
      },
      {
        $set: {
          'sequences.$.status': 'sent',
          'sequences.$.sent_at': sent_at || new Date(),
          'sequences.$.message_id': message_id,
          last_updated: new Date()
        }
      }
    )
    
    if (result.modifiedCount > 0) {
      console.log('[FOLLOWUP_MARK_SENT] Updated:', followup_id)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 })
    }
    
  } catch (error) {
    console.error('[FOLLOWUP_MARK_SENT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to mark follow-up as sent' },
      { status: 500 }
    )
  }
}

