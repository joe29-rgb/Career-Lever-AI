import mongoose, { Schema, Document } from 'mongoose'

export interface ICandidateShowcase extends Document {
  userId: Schema.Types.ObjectId
  headline: string
  anonymous: boolean
  skills: string[]
  desiredRoles: string[]
  location?: string
  availability?: 'immediate' | '2-weeks' | '1-month' | 'flexible'
  minSalary?: string
  summary?: string
  links?: Array<{ label: string; url: string }>
  createdAt: Date
  updatedAt: Date
}

const CandidateShowcaseSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  headline: { type: String, required: true, trim: true },
  anonymous: { type: Boolean, default: true },
  skills: { type: [String], default: [] },
  desiredRoles: { type: [String], default: [] },
  location: { type: String, trim: true },
  availability: { type: String, enum: ['immediate','2-weeks','1-month','flexible'], default: 'flexible' },
  minSalary: { type: String, trim: true },
  summary: { type: String, trim: true },
  links: { type: [{ label: String, url: String }], default: [] },
}, { timestamps: true })

CandidateShowcaseSchema.index({ createdAt: -1 })
CandidateShowcaseSchema.index({ anonymous: 1, createdAt: -1 })

export default mongoose.models.CandidateShowcase || mongoose.model<ICandidateShowcase>('CandidateShowcase', CandidateShowcaseSchema)


