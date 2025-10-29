/**
 * Job Cache Model
 * 
 * Caches job search results for 24 hours to reduce API costs
 * Stores deduplicated and ranked jobs from multiple sources
 */

import mongoose, { Schema, Document } from 'mongoose'

export interface IJobCache extends Document {
  userId: Schema.Types.ObjectId
  searchQuery: string
  location?: string
  remote?: boolean
  workType?: string[]
  
  jobs: Array<{
    id: string
    title: string
    company: string
    location?: string
    description: string
    url: string
    source: string
    postedDate?: string
    salary?: string
    remote?: boolean
    jobType?: string[]
    skills?: string[]
    matchScore?: number
    matchedSkills?: string[]
    matchPercentage?: number
  }>
  
  metadata: {
    sources: Record<string, unknown>
    totalJobs: number
    uniqueJobs: number
    duration: number
    totalCost: number
    rankedBy?: string
  }
  
  createdAt: Date
  expiresAt: Date
}

const JobSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  description: { type: String, required: true },
  url: { type: String, required: true },
  source: { type: String, required: true },
  postedDate: String,
  salary: String,
  remote: Boolean,
  jobType: [String],
  skills: [String],
  matchScore: Number,
  matchedSkills: [String],
  matchPercentage: Number
}, { _id: false })

const JobCacheSchema = new Schema<IJobCache>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  searchQuery: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: String,
    index: true
  },
  remote: Boolean,
  workType: [String],
  
  jobs: [JobSchema],
  
  metadata: {
    sources: Schema.Types.Mixed,
    totalJobs: Number,
    uniqueJobs: Number,
    duration: Number,
    totalCost: Number,
    rankedBy: String
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
})

// Compound indexes for efficient queries
JobCacheSchema.index({ userId: 1, searchQuery: 1, location: 1 })
JobCacheSchema.index({ userId: 1, createdAt: -1 })
JobCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index

// Static methods
JobCacheSchema.statics.findCached = async function(
  userId: string,
  searchQuery: string,
  location?: string
): Promise<IJobCache | null> {
  return this.findOne({
    userId,
    searchQuery: { $regex: new RegExp(searchQuery, 'i') },
    location: location ? { $regex: new RegExp(location, 'i') } : undefined,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 })
}

JobCacheSchema.statics.clearExpired = async function(): Promise<number> {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  })
  return result.deletedCount || 0
}

JobCacheSchema.statics.getUserCacheStats = async function(userId: string) {
  const caches = await this.find({ userId, expiresAt: { $gt: new Date() } })
  
  return {
    totalCaches: caches.length,
    totalJobs: caches.reduce((sum, c) => sum + (c.jobs?.length || 0), 0),
    totalCost: caches.reduce((sum, c) => sum + (c.metadata?.totalCost || 0), 0),
    oldestCache: caches.length > 0 ? Math.min(...caches.map(c => c.createdAt.getTime())) : null
  }
}

export default mongoose.models.JobCache || mongoose.model<IJobCache>('JobCache', JobCacheSchema)
