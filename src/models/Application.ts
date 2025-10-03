import mongoose, { Schema, Document } from 'mongoose'

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId
  jobId?: string
  company: string
  jobTitle: string
  recipient: string
  status: 'composed' | 'sent' | 'delivered' | 'opened'
  sentAt: Date
  attachments: string[]
  metadata: any
}

const ApplicationSchema = new Schema<IApplication>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: String },
  company: { type: String, required: true },
  jobTitle: { type: String, required: true },
  recipient: { type: String, required: true },
  status: { type: String, enum: ['composed', 'sent', 'delivered', 'opened'], default: 'composed' },
  sentAt: { type: Date, default: Date.now },
  attachments: [{ type: String }],
  metadata: { type: Schema.Types.Mixed }
})

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema)
