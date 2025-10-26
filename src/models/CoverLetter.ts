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

// Add indexes for better query performance
CoverLetterSchema.index({ userId: 1, createdAt: -1 }); // User's cover letters sorted by date
CoverLetterSchema.index({ userId: 1, companyName: 1 }); // Find by user and company
CoverLetterSchema.index({ userId: 1, jobTitle: 1 }); // Find by user and job title
CoverLetterSchema.index({ applicationId: 1 }); // Link to job application
CoverLetterSchema.index({ userId: 1, updatedAt: -1 }); // Recently updated cover letters
CoverLetterSchema.index({ companyName: 1, jobTitle: 1 }); // Find by company and role
CoverLetterSchema.index({ jobTitle: 'text', companyName: 'text', content: 'text' }); // Full-text search

export default mongoose.models.CoverLetter || mongoose.model<ICoverLetter>('CoverLetter', CoverLetterSchema)


