import mongoose, { Document, Schema } from 'mongoose'

export interface IJobBoardIntegration extends Document {
  userId: mongoose.Types.ObjectId
  boardName: string // linkedin, ziprecruiter, monster, etc.
  boardDisplayName: string
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'requires_auth'
  apiKey?: string // Encrypted API key
  accessToken?: string // OAuth access token
  refreshToken?: string // OAuth refresh token
  tokenExpiresAt?: Date
  lastSyncAt?: Date
  lastSuccessfulSyncAt?: Date
  syncStatus: 'idle' | 'syncing' | 'success' | 'failed'
  errorMessage?: string
  totalApplications: number
  successfulApplications: number
  lastApplicationAt?: Date
  settings: {
    autoSync: boolean
    syncFrequency: 'manual' | 'daily' | 'weekly'
    defaultResumeId?: mongoose.Types.ObjectId
    defaultCoverLetterId?: mongoose.Types.ObjectId
    notificationPreferences: {
      applicationSubmitted: boolean
      applicationViewed: boolean
      interviewRequested: boolean
      errors: boolean
    }
  }
  metadata: {
    apiVersion?: string
    accountId?: string
    accountName?: string
    accountType?: string
    rateLimits?: {
      requestsPerHour: number
      requestsPerDay: number
      lastRequestAt?: Date
    }
  }
  createdAt: Date
  updatedAt: Date
}

const JobBoardIntegrationSchema = new Schema<IJobBoardIntegration>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  boardName: {
    type: String,
    required: true,
    enum: ['linkedin', 'ziprecruiter', 'glassdoor', 'monster', 'careerbuilder', 'simplyhired', 'indeed']
  },
  boardDisplayName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['disconnected', 'connecting', 'connected', 'error', 'requires_auth'],
    default: 'disconnected'
  },
  apiKey: {
    type: String,
    select: false // Don't include in regular queries for security
  },
  accessToken: {
    type: String,
    select: false
  },
  refreshToken: {
    type: String,
    select: false
  },
  tokenExpiresAt: {
    type: Date
  },
  lastSyncAt: {
    type: Date
  },
  lastSuccessfulSyncAt: {
    type: Date
  },
  syncStatus: {
    type: String,
    enum: ['idle', 'syncing', 'success', 'failed'],
    default: 'idle'
  },
  errorMessage: {
    type: String
  },
  totalApplications: {
    type: Number,
    default: 0
  },
  successfulApplications: {
    type: Number,
    default: 0
  },
  lastApplicationAt: {
    type: Date
  },
  settings: {
    autoSync: {
      type: Boolean,
      default: false
    },
    syncFrequency: {
      type: String,
      enum: ['manual', 'daily', 'weekly'],
      default: 'manual'
    },
    defaultResumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume'
    },
    defaultCoverLetterId: {
      type: Schema.Types.ObjectId,
      ref: 'CoverLetter'
    },
    notificationPreferences: {
      applicationSubmitted: { type: Boolean, default: true },
      applicationViewed: { type: Boolean, default: true },
      interviewRequested: { type: Boolean, default: true },
      errors: { type: Boolean, default: true }
    }
  },
  metadata: {
    apiVersion: String,
    accountId: String,
    accountName: String,
    accountType: String,
    rateLimits: {
      requestsPerHour: { type: Number, default: 100 },
      requestsPerDay: { type: Number, default: 1000 },
      lastRequestAt: Date
    }
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
JobBoardIntegrationSchema.index({ userId: 1, boardName: 1 }, { unique: true })
JobBoardIntegrationSchema.index({ status: 1 })
JobBoardIntegrationSchema.index({ syncStatus: 1 })
JobBoardIntegrationSchema.index({ 'tokenExpiresAt': 1 })

// Virtual for success rate
JobBoardIntegrationSchema.virtual('successRate').get(function() {
  if (this.totalApplications === 0) return 0
  return Math.round((this.successfulApplications / this.totalApplications) * 100)
})

// Method to check if token is expired
JobBoardIntegrationSchema.methods.isTokenExpired = function() {
  if (!this.tokenExpiresAt) return false
  return new Date() > this.tokenExpiresAt
}

// Method to update sync status
JobBoardIntegrationSchema.methods.updateSyncStatus = function(status: string, errorMessage?: string) {
  this.syncStatus = status as any
  this.lastSyncAt = new Date()

  if (status === 'success') {
    this.lastSuccessfulSyncAt = new Date()
    this.errorMessage = undefined
  } else if (status === 'failed' && errorMessage) {
    this.errorMessage = errorMessage
  }

  return this.save()
}

// Method to increment application count
JobBoardIntegrationSchema.methods.incrementApplications = function(success: boolean = true) {
  this.totalApplications += 1
  if (success) {
    this.successfulApplications += 1
  }
  this.lastApplicationAt = new Date()
  return this.save()
}

export default mongoose.models.JobBoardIntegration || mongoose.model<IJobBoardIntegration>('JobBoardIntegration', JobBoardIntegrationSchema)



