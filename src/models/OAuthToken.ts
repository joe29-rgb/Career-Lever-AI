import mongoose, { Schema, Document } from 'mongoose'

export interface IOAuthToken extends Document {
  userId: mongoose.Types.ObjectId
  provider: 'gmail' | 'outlook'
  accessToken: string
  refreshToken?: string
  scope?: string
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

const OAuthTokenSchema = new Schema<IOAuthToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, enum: ['gmail','outlook'], required: true, index: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  scope: { type: String },
  expiresAt: { type: Date },
}, { timestamps: true })

OAuthTokenSchema.index({ userId: 1, provider: 1 }, { unique: true })

export default mongoose.models.OAuthToken || mongoose.model<IOAuthToken>('OAuthToken', OAuthTokenSchema)


