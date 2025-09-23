import mongoose, { Schema, Document } from 'mongoose'

export interface ITeam extends Document {
  name: string
  ownerId: mongoose.Types.ObjectId
  members: Array<{ userId: mongoose.Types.ObjectId; role: 'owner'|'admin'|'member' }>
  billing?: { customerId?: string; plan: 'team'|'enterprise'; seats: number }
  createdAt: Date
  updatedAt: Date
}

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true, trim: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' }, role: { type: String, enum: ['owner','admin','member'], default: 'member' } }],
  billing: { type: Schema.Types.Mixed }
}, { timestamps: true })

TeamSchema.index({ ownerId: 1 })

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema)


