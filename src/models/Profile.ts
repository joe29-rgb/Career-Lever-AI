import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  userId: string;
  userNo: number;
  plan: 'free' | 'pro' | 'company';
  customerRef?: string;
  title?: string;
  location?: string;
  yearsExperience?: number;
  seniority?: string;
  skills?: string[];
  targetTitles?: string[];
  industries?: string[];
  autopilotMeta?: {
    lastRunAt?: Date;
    lastFound?: number;
    nextRunAt?: Date;
  };
  preferences?: Record<string, any>;
  styleProfile?: {
    tone?: string;
    sentenceLength?: string;
    vocabulary?: string;
    examples?: string[];
  };
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
  yearsExperience: { type: Number },
  seniority: { type: String },
  skills: { type: [String], default: [] },
  targetTitles: { type: [String], default: [] },
  industries: { type: [String], default: [] },
  autopilotMeta: { type: Schema.Types.Mixed },
  preferences: { type: Schema.Types.Mixed },
  styleProfile: { type: Schema.Types.Mixed },
}, { timestamps: true })

// Add indexes for better query performance
// userId and userNo are already indexed via unique: true
ProfileSchema.index({ plan: 1 }); // Filter by subscription plan
ProfileSchema.index({ location: 1 }); // Filter by location
ProfileSchema.index({ skills: 1 }); // Filter by skills (array index)
ProfileSchema.index({ industries: 1 }); // Filter by target industries
ProfileSchema.index({ seniority: 1 }); // Filter by seniority level
ProfileSchema.index({ 'autopilotMeta.nextRunAt': 1 }); // Autopilot scheduling
ProfileSchema.index({ plan: 1, createdAt: -1 }); // Compound: plan analytics

export default mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);


