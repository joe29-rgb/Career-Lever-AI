import mongoose, { Document, Schema } from 'mongoose'

export interface INetworkPost extends Document {
  userId: mongoose.Types.ObjectId
  userName: string
  userAvatar?: string
  userTitle?: string
  type: 'job_opportunity' | 'career_advice' | 'success_story' | 'question' | 'general'
  title?: string
  content: string
  tags?: string[]
  attachments?: Array<{
    type: 'image' | 'document' | 'link'
    url: string
    name: string
  }>
  likes: mongoose.Types.ObjectId[]
  comments: Array<{
    userId: mongoose.Types.ObjectId
    userName: string
    content: string
    createdAt: Date
  }>
  shares: number
  createdAt: Date
  updatedAt: Date
  visibility: 'public' | 'connections' | 'private'
}

const NetworkPostSchema = new Schema<INetworkPost>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String
  },
  userTitle: {
    type: String
  },
  type: {
    type: String,
    enum: ['job_opportunity', 'career_advice', 'success_story', 'question', 'general'],
    default: 'general'
  },
  title: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link']
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Indexes for better performance
NetworkPostSchema.index({ userId: 1, createdAt: -1 })
NetworkPostSchema.index({ type: 1, createdAt: -1 })
NetworkPostSchema.index({ tags: 1 })
NetworkPostSchema.index({ visibility: 1 })
NetworkPostSchema.index({ createdAt: -1 })

export default mongoose.models.NetworkPost || mongoose.model<INetworkPost>('NetworkPost', NetworkPostSchema)



