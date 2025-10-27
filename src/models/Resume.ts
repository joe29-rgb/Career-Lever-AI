import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomizedResume extends Document {
  jobApplicationId: Schema.Types.ObjectId;
  customizedText: string;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  createdAt: Date;
  fileName?: string;
}

export interface IResume extends Document {
  userId: Schema.Types.ObjectId;
  originalFileName: string;
  fileUrl: string;
  extractedText: string;
  customizedVersions: ICustomizedResume[];
  userName?: string;
  contactEmail?: string;
  contactPhone?: string;
  yearsExperience?: number;
  // Autopilot cache fields
  // NOTE: resumeSignals REMOVED - now using UserProfile model for structured data
  comprehensiveResearch?: Record<string, unknown>; // Full comprehensive research data
  comprehensiveResearchAt?: Date; // When research was cached
  resumeVariants?: {
    variantA: string;
    variantB: string;
    recommendations: string[];
    generatedAt: Date;
  };
  coverLetters?: {
    variantA: string;
    variantB: string;
    personalization: string[];
    generatedAt: Date;
  };
  emailOutreach?: {
    subjects: string[];
    templates: Array<{ type: string; body: string }>;
    mailtoLink: string;
    generatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CustomizedResumeSchema: Schema = new Schema({
  jobApplicationId: {
    type: Schema.Types.ObjectId,
    ref: 'JobApplication',
    required: true,
  },
  customizedText: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  fileName: { type: String, trim: true },
}, {
  timestamps: true,
});

const ResumeSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalFileName: {
    type: String,
    required: true,
    trim: true,
  },
  fileUrl: {
    type: String,
    required: false,
    trim: true,
  },
  extractedText: {
    type: String,
    required: true,
  },
  userName: { type: String, trim: true },
  contactEmail: { type: String, trim: true },
  contactPhone: { type: String, trim: true },
  yearsExperience: { type: Number, min: 0 },
  customizedVersions: [CustomizedResumeSchema],
  // Autopilot cache fields
  // NOTE: resumeSignals REMOVED - now using UserProfile model
  comprehensiveResearch: {
    type: Schema.Types.Mixed,
    required: false
  },
  comprehensiveResearchAt: {
    type: Date,
    required: false
  },
  resumeVariants: {
    type: Schema.Types.Mixed,
    required: false
  },
  coverLetters: {
    type: Schema.Types.Mixed,
    required: false
  },
  emailOutreach: {
    type: Schema.Types.Mixed,
    required: false
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
ResumeSchema.index({ userId: 1 }); // Find by user
ResumeSchema.index({ createdAt: -1 }); // Sort by date
ResumeSchema.index({ userId: 1, createdAt: -1 }); // Compound: user's resumes sorted by date
ResumeSchema.index({ userId: 1, updatedAt: -1 }); // Compound: user's recently updated resumes
ResumeSchema.index({ 'customizedVersions.jobApplicationId': 1 }); // Find customized versions
ResumeSchema.index({ extractedText: 'text', userName: 'text', originalFileName: 'text' }); // Full-text search

// Autopilot cache indexes
ResumeSchema.index({ userId: 1, comprehensiveResearchAt: -1 }); // Find recent research
// NOTE: resumeSignals indexes REMOVED - now using UserProfile indexes

export default mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);

