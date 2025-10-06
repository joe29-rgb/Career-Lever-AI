import mongoose, { Schema, Document } from 'mongoose';

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

