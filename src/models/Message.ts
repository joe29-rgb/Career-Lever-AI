import mongoose, { Document, Schema } from 'mongoose'

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId
  receiverId: mongoose.Types.ObjectId
  conversationId: string // Unique identifier for the conversation between two users
  content: string
  messageType: 'text' | 'image' | 'file' | 'link'
  attachments?: Array<{
    type: string
    url: string
    name: string
    size?: number
  }>
  isRead: boolean
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'link'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Generate conversation ID from user IDs (consistent ordering)
MessageSchema.pre('save', function(next) {
  const userIds = [this.senderId.toString(), this.receiverId.toString()].sort()
  this.conversationId = userIds.join('_')
  next()
})

// Indexes for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: -1 })
MessageSchema.index({ senderId: 1, createdAt: -1 })
MessageSchema.index({ receiverId: 1, createdAt: -1 })
MessageSchema.index({ isRead: 1 })

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)



