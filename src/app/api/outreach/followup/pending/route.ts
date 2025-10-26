import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/outreach/followup/pending
 * Fetch follow-ups that are ready to be sent
 * (No auth required - called by cron job)
 */
export async function GET(request: NextRequest) {
  try {
    await dbService.connect()
    
    const FollowUpSequence = mongoose.models.FollowUpSequence
    if (!FollowUpSequence) {
      return NextResponse.json({ followups: [] })
    }
    
    const now = new Date()
    
    // Find all active sequences with scheduled steps that are due
    const sequences = await FollowUpSequence.find({
      status: 'active',
      'sequences.status': 'scheduled',
      'sequences.scheduled_time': { $lte: now }
    }).lean()
    
    // Extract individual follow-up steps that are ready
    const pendingFollowups: any[] = []
    
    for (const sequence of sequences) {
      // Type assertion for mongoose document with _id
      const sequenceId = (sequence as any)._id?.toString() || 'unknown'
      const sequenceData = sequence as any
      
      for (const step of sequenceData.sequences || []) {
        if (
          step.status === 'scheduled' &&
          step.scheduled_time &&
          new Date(step.scheduled_time) <= now
        ) {
          pendingFollowups.push({
            id: `${sequenceId}_${step.step_number}`,
            sequence_id: sequenceId,
            step_number: step.step_number,
            contact_email: sequenceData.contact_email,
            contact_name: sequenceData.contact_name,
            subject: step.subject,
            body: step.body,
            scheduled_time: step.scheduled_time,
            tone: step.tone
          })
        }
      }
    }
    
    console.log('[FOLLOWUP_PENDING] Found', pendingFollowups.length, 'pending follow-ups')
    
    return NextResponse.json({
      followups: pendingFollowups,
      count: pendingFollowups.length
    })
    
  } catch (error) {
    console.error('[FOLLOWUP_PENDING] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending follow-ups' },
      { status: 500 }
    )
  }
}

