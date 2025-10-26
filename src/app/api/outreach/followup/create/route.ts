import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FollowUpAutomationService } from '@/lib/followup-automation'
import { dbService } from '@/lib/database'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * FollowUpSequence Schema
 */
const FollowUpSequenceSchema = new mongoose.Schema({
  original_email_id: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  contact_email: { type: String, required: true },
  contact_name: { type: String, required: true },
  company_name: { type: String, required: true },
  job_title: { type: String, required: true },
  
  sequences: [{
    step_number: Number,
    days_after: Number,
    subject: String,
    body: String,
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'sent', 'skipped'],
      default: 'pending'
    },
    scheduled_time: Date,
    sent_at: Date,
    message_id: String,
    tone: String
  }],
  
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'replied'],
    default: 'active',
    index: true
  },
  
  created_at: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now }
}, {
  timestamps: true
})

FollowUpSequenceSchema.index({ userId: 1, status: 1 })
FollowUpSequenceSchema.index({ 'sequences.scheduled_time': 1, 'sequences.status': 1 })

const FollowUpSequence = mongoose.models.FollowUpSequence ||
  mongoose.model('FollowUpSequence', FollowUpSequenceSchema)

/**
 * POST /api/outreach/followup/create
 * Create automated follow-up sequence
 */
export async function POST(request: NextRequest) {
  try {
    await dbService.connect()
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const {
      original_email_id,
      contact_email,
      contact_name,
      company_name,
      job_title,
      original_subject,
      original_body,
      resume_text
    } = body
    
    // Validation
    if (!contact_email || !contact_name || !company_name || !job_title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    console.log('[FOLLOWUP_CREATE] Creating sequence for:', contact_name)
    
    // Generate follow-up sequence using AI
    const sequence = await FollowUpAutomationService.createFollowUpSequence(
      {
        id: original_email_id || `email_${Date.now()}`,
        contact_email,
        contact_name,
        company_name,
        job_title,
        original_subject: original_subject || '',
        original_body: original_body || ''
      },
      session.user.id,
      resume_text
    )
    
    // Calculate scheduled times for each step
    const now = new Date()
    sequence.sequences.forEach(step => {
      const scheduledTime = new Date(now.getTime() + step.days_after * 24 * 60 * 60 * 1000)
      step.scheduled_time = scheduledTime
      step.status = 'scheduled'
    })
    
    // Save to database
    const savedSequence = await FollowUpSequence.create(sequence)
    
    console.log('[FOLLOWUP_CREATE] Sequence created:', savedSequence._id)
    console.log('[FOLLOWUP_CREATE] Steps:', sequence.sequences.map(s => `Day ${s.days_after}: ${s.tone}`))
    
    return NextResponse.json({
      success: true,
      sequence_id: savedSequence._id.toString(),
      steps: sequence.sequences.map(s => ({
        step_number: s.step_number,
        days_after: s.days_after,
        scheduled_time: s.scheduled_time,
        tone: s.tone
      })),
      message: `Created 3-step follow-up sequence (Day 3, 7, 14)`
    })
    
  } catch (error) {
    console.error('[FOLLOWUP_CREATE] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create follow-up sequence',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

