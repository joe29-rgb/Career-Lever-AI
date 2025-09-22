import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  userId: string;
  userNo: number;
  plan: 'free' | 'pro' | 'company';
  customerRef?: string;
  title?: string;
  location?: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  userNo: { type: Number, required: true, unique: true, index: true },
  plan: { type: String, enum: ['free','pro','company'], default: 'free' },
  customerRef: { type: String },
  title: { type: String },
  location: { type: String },
  preferences: { type: Schema.Types.Mixed },
}, { timestamps: true })

export default mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);


