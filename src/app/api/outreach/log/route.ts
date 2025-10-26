import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * OutreachLog Schema - Tracks all email outreach
 */
const OutreachLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  contact_email: { type: String, required: true },
  contact_name: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String },
  sent_at: { type: Date, required: true, index: true },
  message_id: { type: String },
  status: { 
    type: String, 
    enum: ['sent', 'failed', 'scheduled', 'delivered', 'opened', 'clicked'],
    default: 'sent',
    index: true
  },
  job_id: { type: String },
  company_name: { type: String },
  personalization_score: { type: Number },
  variant_id: { type: String }
}, {
  timestamps: true
})

// Index for efficient queries
OutreachLogSchema.index({ userId: 1, sent_at: -1 })
OutreachLogSchema.index({ userId: 1, status: 1 })

const OutreachLog = mongoose.models.OutreachLog || 
  mongoose.model('OutreachLog', OutreachLogSchema)

/**
 * POST /api/outreach/log - Log outreach activity
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
      contact_email,
      contact_name,
      subject,
      body: emailBody,
      sent_at,
      message_id,
      status = 'sent',
      job_id,
      company_name,
      personalization_score,
      variant_id
    } = body
    
    // Validation
    if (!contact_email || !contact_name || !subject) {
      return NextResponse.json(
        { error: 'contact_email, contact_name, and subject are required' },
        { status: 400 }
      )
    }
    
    // Create log entry
    const log = await OutreachLog.create({
      userId: session.user.id,
      contact_email,
      contact_name,
      subject,
      body: emailBody,
      sent_at: sent_at || new Date(),
      message_id,
      status,
      job_id,
      company_name,
      personalization_score,
      variant_id
    })
    
    console.log('[OUTREACH_LOG] Logged outreach:', log._id)
    
    return NextResponse.json({
      success: true,
      log_id: log._id.toString()
    })
    
  } catch (error) {
    console.error('[OUTREACH_LOG] Error:', error)
    return NextResponse.json(
      { error: 'Failed to log outreach' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/outreach/log - Get outreach history
 */
export async function GET(request: NextRequest) {
  try {
    await dbService.connect()
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    
    const query: any = { userId: session.user.id }
    if (status) {
      query.status = status
    }
    
    const logs = await OutreachLog.find(query)
      .sort({ sent_at: -1 })
      .limit(Math.min(limit, 100))
      .lean()
    
    // Calculate statistics
    const stats = await OutreachLog.aggregate([
      { $match: { userId: session.user.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
    
    return NextResponse.json({
      logs,
      stats: stats.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count
        return acc
      }, {}),
      total: logs.length
    })
    
  } catch (error) {
    console.error('[OUTREACH_LOG] Get error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch outreach logs' },
      { status: 500 }
    )
  }
}

