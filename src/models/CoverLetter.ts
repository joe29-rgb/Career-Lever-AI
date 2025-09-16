import mongoose, { Schema, Document } from 'mongoose'

export interface ICoverLetter extends Document {
  userId: mongoose.Types.ObjectId
  jobTitle: string
  companyName: string
  jobDescription?: string
  resumeSnapshot?: string
  content: string
  tone?: 'professional' | 'casual' | 'enthusiastic'
  length?: 'short' | 'medium' | 'long'
  applicationId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CoverLetterSchema = new Schema<ICoverLetter>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle: { type: String, required: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  jobDescription: { type: String },
  resumeSnapshot: { type: String },
  content: { type: String, required: true },
  tone: { type: String, enum: ['professional', 'casual', 'enthusiastic'], default: 'professional' },
  length: { type: String, enum: ['short', 'medium', 'long'], default: 'medium' },
  applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication' },
}, { timestamps: true })

CoverLetterSchema.index({ userId: 1, createdAt: -1 })
CoverLetterSchema.index({ userId: 1, companyName: 1 })

export default mongoose.models.CoverLetter || mongoose.model<ICoverLetter>('CoverLetter', CoverLetterSchema)


