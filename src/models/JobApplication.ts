import mongoose, { Document, Schema } from 'mongoose'

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn'

export interface IJobApplication extends Document {
  userId: mongoose.Types.ObjectId
  jobTitle: string
  companyName: string
  jobDescription: string
  jobUrl?: string
  applicationStatus: ApplicationStatus
  appliedDate?: Date | null
  followUpDates: Date[]
  notes?: string
  companyResearch?: mongoose.Types.ObjectId
  analysis?: any
  context?: any
  coverLetterId?: mongoose.Types.ObjectId
  resumeVersionId?: mongoose.Types.ObjectId
  // Outcomes & tracking
  applicationSource?: string
  variantUsed?: 'A' | 'B' | 'C'
  views?: number
  interviews?: number
  offers?: number
  createdAt: Date
  updatedAt: Date
}

const JobApplicationSchema = new Schema<IJobApplication>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  jobDescription: {
    type: String,
    required: true,
  },
  jobUrl: {
    type: String,
    trim: true,
  },
  applicationStatus: {
    type: String,
    enum: ['saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'],
    default: 'saved',
  },
  appliedDate: {
    type: Date,
    default: null,
  },
  followUpDates: [
    {
      type: Date,
    }
  ],
  notes: {
    type: String,
  },
  companyResearch: {
    type: Schema.Types.ObjectId,
    ref: 'CompanyData',
  },
  analysis: {
    type: Schema.Types.Mixed,
    default: null,
  },
  context: {
    type: Schema.Types.Mixed,
    default: null,
  },
  coverLetterId: {
    type: Schema.Types.ObjectId,
    ref: 'CoverLetter',
  },
  resumeVersionId: {
    type: Schema.Types.ObjectId,
  },
  applicationSource: { type: String, trim: true },
  variantUsed: { type: String, enum: ['A','B','C'], default: undefined },
  views: { type: Number, default: 0 },
  interviews: { type: Number, default: 0 },
  offers: { type: Number, default: 0 },
}, {
  timestamps: true,
})

// Indexes to support common queries
JobApplicationSchema.index({ userId: 1, createdAt: -1 }); // User's applications sorted by date
JobApplicationSchema.index({ userId: 1, applicationStatus: 1 }); // Filter by user and status
JobApplicationSchema.index({ userId: 1, updatedAt: -1 }); // Recently updated applications
JobApplicationSchema.index({ companyName: 1 }); // Find by company
JobApplicationSchema.index({ jobTitle: 1 }); // Find by job title
JobApplicationSchema.index({ applicationStatus: 1, appliedDate: -1 }); // Status timeline queries
JobApplicationSchema.index({ appliedDate: 1 }); // Sort by application date
JobApplicationSchema.index({ userId: 1, applicationStatus: 1, createdAt: -1 }); // Compound: user's apps by status and date
JobApplicationSchema.index({ jobTitle: 'text', companyName: 'text', jobDescription: 'text', notes: 'text' }); // Full-text search

export default mongoose.models.JobApplication || mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema)


