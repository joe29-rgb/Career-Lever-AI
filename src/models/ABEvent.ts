import mongoose, { Schema, Document } from 'mongoose'

export interface IABEvent extends Document {
  userId: Schema.Types.ObjectId
  applicationId?: Schema.Types.ObjectId
  resumeId?: Schema.Types.ObjectId
  variant?: 'A' | 'B'
  action: 'view' | 'select' | 'download' | 'submit' | 'interview' | 'offer'
  meta?: Record<string, any>
  createdAt: Date
}

const ABEventSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication' },
  resumeId: { type: Schema.Types.ObjectId, ref: 'Resume' },
  variant: { type: String, enum: ['A','B'] },
  action: { type: String, enum: ['view','select','download','submit','interview','offer'], required: true },
  meta: { type: Object },
}, { timestamps: true })

ABEventSchema.index({ userId: 1, createdAt: -1 })
ABEventSchema.index({ applicationId: 1 })
ABEventSchema.index({ resumeId: 1 })

export default mongoose.models.ABEvent || mongoose.model<IABEvent>('ABEvent', ABEventSchema)


