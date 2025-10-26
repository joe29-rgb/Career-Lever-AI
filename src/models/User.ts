import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfile {
  onboardingComplete: boolean;
  currentSituation: 'actively_searching' | 'open_to_offers' | 'employed_not_looking' | 'student' | 'career_change';
  yearsOfExperience: number;
  targetRole: string;
  workPreferences: ('remote' | 'onsite' | 'hybrid')[];
  preferredLocation: string;
  timeline?: 'asap' | '1-3_months' | '3-6_months' | 'flexible';
  urgency: 'high' | 'medium' | 'low';
  completedAt: Date;
}

export interface IUser extends Document {
  email: string;
  name: string;
  image?: string;
  // Optional credentials/profile fields for demo + networking features
  passwordHash?: string;
  title?: string;
  location?: string;
  skills?: string[];
  experience?: string;
  // Onboarding quiz profile
  profile?: IUserProfile;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    trim: true,
  },
  passwordHash: {
    type: String,
    select: false,
  },
  title: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  skills: [{ type: String, trim: true }],
  experience: {
    type: String,
  },
  profile: {
    type: {
      onboardingComplete: { type: Boolean, default: false },
      currentSituation: {
        type: String,
        enum: ['actively_searching', 'open_to_offers', 'employed_not_looking', 'student', 'career_change']
      },
      yearsOfExperience: { type: Number, min: 0, max: 30 },
      targetRole: { type: String, trim: true },
      workPreferences: [{
        type: String,
        enum: ['remote', 'onsite', 'hybrid']
      }],
      preferredLocation: { type: String, trim: true },
      timeline: {
        type: String,
        enum: ['asap', '1-3_months', '3-6_months', 'flexible']
      },
      urgency: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      completedAt: { type: Date }
    },
    required: false
  }
}, {
  timestamps: true,
});

// Add indexes for better query performance
// Email is already indexed via unique: true
UserSchema.index({ createdAt: -1 }); // Sort by creation date
UserSchema.index({ location: 1 }); // Filter by location
UserSchema.index({ skills: 1 }); // Filter by skills (array index)
UserSchema.index({ name: 'text', title: 'text', skills: 'text' }); // Full-text search

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

