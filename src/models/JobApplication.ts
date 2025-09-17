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
  coverLetterId?: mongoose.Types.ObjectId
  resumeVersionId?: mongoose.Types.ObjectId
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
  coverLetterId: {
    type: Schema.Types.ObjectId,
    ref: 'CoverLetter',
  },
  resumeVersionId: {
    type: Schema.Types.ObjectId,
  },
}, {
  timestamps: true,
})

// Indexes to support common queries
JobApplicationSchema.index({ userId: 1, createdAt: -1 })
JobApplicationSchema.index({ userId: 1, applicationStatus: 1 })
JobApplicationSchema.index({ companyName: 1 })
JobApplicationSchema.index({ jobTitle: 1 })

export default mongoose.models.JobApplication || mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema)


