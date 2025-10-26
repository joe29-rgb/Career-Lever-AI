import mongoose, { Schema, Document } from 'mongoose'

export interface ISentEmail extends Document {
  userId: mongoose.Types.ObjectId
  contactEmail: string
  contactName: string
  subject: string
  body: string
  attachments: Array<{
    filename: string
    size: number
  }>
  sentAt: Date
  status: 'sent' | 'delivered' | 'bounced' | 'opened' | 'failed'
  messageId?: string
  jobApplicationId?: mongoose.Types.ObjectId
  openedAt?: Date
  clickedAt?: Date
  error?: string
  metadata?: Record<string, unknown>
}

const SentEmailSchema = new Schema<ISentEmail>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contactEmail: { type: String, required: true, index: true },
  contactName: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  attachments: [{
    filename: { type: String, required: true },
    size: { type: Number, required: true }
  }],
  sentAt: { type: Date, default: Date.now, index: true },
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'bounced', 'opened', 'failed'],
    default: 'sent',
    index: true
  },
  messageId: { type: String, index: true },
  jobApplicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication', index: true },
  openedAt: { type: Date },
  clickedAt: { type: Date },
  error: { type: String },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
})

// Indexes for common queries
SentEmailSchema.index({ userId: 1, sentAt: -1 })
SentEmailSchema.index({ userId: 1, status: 1 })
SentEmailSchema.index({ messageId: 1 }, { sparse: true })

export default mongoose.models.SentEmail || mongoose.model<ISentEmail>('SentEmail', SentEmailSchema)
