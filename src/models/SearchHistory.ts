/**
 * Search History Model
 * Tracks user job searches for analytics and recommendations
 */

import mongoose, { Schema, Document } from 'mongoose'

export interface ISearchHistory extends Document {
  userId: string
  keywords: string
  location: string
  resultsCount: number
  sources: string[]
  timestamp: Date
  metadata?: {
    remote?: boolean
    salaryMin?: number
    experienceLevel?: string
  }
}

const SearchHistorySchema = new Schema<ISearchHistory>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  keywords: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: String,
    required: true
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  sources: [{
    type: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
    // index removed - compound and TTL indexes below are sufficient
  },
  metadata: {
    remote: Boolean,
    salaryMin: Number,
    experienceLevel: String
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
SearchHistorySchema.index({ userId: 1, timestamp: -1 })

// Text index for search term analysis
SearchHistorySchema.index({ keywords: 'text' })

// TTL index - automatically delete searches older than 90 days
SearchHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 })

export default mongoose.models.SearchHistory || mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema)

