import mongoose, { Schema, Document } from 'mongoose'

export interface IFollowUp extends Document {
  applicationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  scheduledFor: Date
  emailTemplate?: string
  emailSubject?: string
  status: 'scheduled' | 'sent' | 'bounced' | 'opened' | 'replied' | 'cancelled'
  sentAt?: Date
  openedAt?: Date
  repliedAt?: Date
  bouncedAt?: Date
  cancelledAt?: Date
  reminderSent?: boolean
  reminderSentAt?: Date
  metadata?: {
    recipientEmail?: string
    recipientName?: string
    companyName?: string
    jobTitle?: string
    originalApplicationDate?: Date
    daysAfterApplication?: number
  }
}

const FollowUpSchema = new Schema<IFollowUp>({
  applicationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Application', 
    required: true,
    index: true
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  scheduledFor: { 
    type: Date, 
    required: true,
    index: true
  },
  emailTemplate: { type: String },
  emailSubject: { type: String },
  status: { 
    type: String, 
    enum: ['scheduled', 'sent', 'bounced', 'opened', 'replied', 'cancelled'], 
    default: 'scheduled',
    index: true
  },
  sentAt: { type: Date },
  openedAt: { type: Date },
  repliedAt: { type: Date },
  bouncedAt: { type: Date },
  cancelledAt: { type: Date },
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date },
  metadata: {
    recipientEmail: { type: String },
    recipientName: { type: String },
    companyName: { type: String },
    jobTitle: { type: String },
    originalApplicationDate: { type: Date },
    daysAfterApplication: { type: Number }
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
FollowUpSchema.index({ userId: 1, status: 1, scheduledFor: 1 })
FollowUpSchema.index({ applicationId: 1, status: 1 })
FollowUpSchema.index({ scheduledFor: 1, status: 1 }) // For cron jobs

export default mongoose.models.FollowUp || mongoose.model('FollowUp', FollowUpSchema)
