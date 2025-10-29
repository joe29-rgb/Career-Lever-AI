import mongoose, { Schema, Document } from 'mongoose'

export interface IGlobalJobsCache extends Document {
  jobId: string // Unique hash for deduplication
  title: string
  company: string
  location: string
  country: string
  province?: string
  city?: string
  description: string
  salary?: string
  url: string
  source: string
  keywords: string[] // Extracted for fast searching
  postedDate?: Date
  downloadedAt: Date
  expiresAt: Date // 2 weeks from download
  lastSeenAt: Date // Track when job was last found
}

const GlobalJobsCacheSchema = new Schema<IGlobalJobsCache>({
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  company: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: String,
    required: true,
    index: true
  },
  country: {
    type: String,
    required: true,
    index: true
  },
  province: String,
  city: String,
  description: {
    type: String,
    required: true
  },
  salary: String,
  url: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    index: true
  },
  keywords: {
    type: [String],
    index: true
  },
  postedDate: Date,
  downloadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
GlobalJobsCacheSchema.index({ country: 1, city: 1 })
GlobalJobsCacheSchema.index({ keywords: 1, country: 1 })
GlobalJobsCacheSchema.index({ downloadedAt: -1 })

// TTL index to auto-delete expired jobs
GlobalJobsCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Text index for full-text search
GlobalJobsCacheSchema.index({ 
  title: 'text', 
  description: 'text', 
  company: 'text',
  keywords: 'text'
})

export default mongoose.models.GlobalJobsCache || 
  mongoose.model<IGlobalJobsCache>('GlobalJobsCache', GlobalJobsCacheSchema)
