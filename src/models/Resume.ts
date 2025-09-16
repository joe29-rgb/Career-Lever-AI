import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomizedResume extends Document {
  jobApplicationId: Schema.Types.ObjectId;
  customizedText: string;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  createdAt: Date;
}

export interface IResume extends Document {
  userId: Schema.Types.ObjectId;
  originalFileName: string;
  fileUrl: string;
  extractedText: string;
  customizedVersions: ICustomizedResume[];
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
    required: true,
    trim: true,
  },
  extractedText: {
    type: String,
    required: true,
  },
  customizedVersions: [CustomizedResumeSchema],
}, {
  timestamps: true,
});

// Add indexes for better query performance
ResumeSchema.index({ userId: 1 });
ResumeSchema.index({ createdAt: -1 });
ResumeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);

