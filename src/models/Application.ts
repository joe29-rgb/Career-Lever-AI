import mongoose, { Schema, Document } from 'mongoose'

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId
  jobId?: string
  company: string
  jobTitle: string
  location?: string
  salary?: string
  recipient: string
  status: 'applied' | 'interview_scheduled' | 'interviewed' | 'offer_received' | 'accepted' | 'rejected' | 'withdrawn'
  appliedAt: Date
  interviewDate?: Date
  attachments: string[]
  
  // Follow-up Tracking
  followUpStatus: 'pending' | 'scheduled' | 'sent' | 'completed' | 'not_needed'
  followUpScheduledAt?: Date
  followUpSentAt?: Date
  followUpNotes?: string
  lastContactedAt?: Date
  
  // Interview Prep Data
  interviewPrep?: {
    questions: string[]
    companyInsights: string
    talkingPoints: string[]
    preparedAt: Date
  }
  
  // Salary Negotiation Data
  salaryData?: {
    marketMin: number
    marketMedian: number
    marketMax: number
    userTarget: number
    negotiationTips: string[]
    preparedAt: Date
  }
  
  metadata: any
}

const ApplicationSchema = new Schema<IApplication>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: String },
  company: { type: String, required: true },
  jobTitle: { type: String, required: true },
  location: { type: String },
  salary: { type: String },
  recipient: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['applied', 'interview_scheduled', 'interviewed', 'offer_received', 'accepted', 'rejected', 'withdrawn'], 
    default: 'applied' 
  },
  appliedAt: { type: Date, default: Date.now },
  interviewDate: { type: Date },
  attachments: [{ type: String }],
  
  // Follow-up Tracking
  followUpStatus: { 
    type: String, 
    enum: ['pending', 'scheduled', 'sent', 'completed', 'not_needed'], 
    default: 'pending' 
  },
  followUpScheduledAt: { type: Date },
  followUpSentAt: { type: Date },
  followUpNotes: { type: String },
  lastContactedAt: { type: Date },
  
  // Interview Prep Data
  interviewPrep: {
    questions: [{ type: String }],
    companyInsights: { type: String },
    talkingPoints: [{ type: String }],
    preparedAt: { type: Date }
  },
  
  // Salary Negotiation Data
  salaryData: {
    marketMin: { type: Number },
    marketMedian: { type: Number },
    marketMax: { type: Number },
    userTarget: { type: Number },
    negotiationTips: [{ type: String }],
    preparedAt: { type: Date }
  },
  
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
})

// Add indexes for performance
ApplicationSchema.index({ userId: 1, appliedAt: -1 })
ApplicationSchema.index({ userId: 1, status: 1 })
ApplicationSchema.index({ company: 1 })

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema)
