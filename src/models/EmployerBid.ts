import mongoose, { Schema, Document } from 'mongoose'

export interface IEmployerBid extends Document {
  showcaseId: Schema.Types.ObjectId
  employerName: string
  role: string
  salary: string
  notes?: string
  contactEmail?: string
  createdAt: Date
}

const EmployerBidSchema: Schema = new Schema({
  showcaseId: { type: Schema.Types.ObjectId, ref: 'CandidateShowcase', required: true },
  employerName: { type: String, required: true },
  role: { type: String, required: true },
  salary: { type: String, required: true },
  notes: { type: String },
  contactEmail: { type: String },
}, { timestamps: true })

EmployerBidSchema.index({ showcaseId: 1, createdAt: -1 })

export default mongoose.models.EmployerBid || mongoose.model<IEmployerBid>('EmployerBid', EmployerBidSchema)


