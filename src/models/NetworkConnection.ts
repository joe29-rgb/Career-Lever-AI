import mongoose, { Document, Schema } from 'mongoose'

export interface INetworkConnection extends Document {
  userId: mongoose.Types.ObjectId // The user who initiated or received the connection
  connectedUserId: mongoose.Types.ObjectId // The other user in the connection
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  initiatedBy: mongoose.Types.ObjectId // Who sent the connection request
  acceptedAt?: Date
  message?: string // Optional message with connection request
  createdAt: Date
  updatedAt: Date
}

const NetworkConnectionSchema = new Schema<INetworkConnection>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  connectedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  },
  initiatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  acceptedAt: {
    type: Date
  },
  message: {
    type: String
  }
}, {
  timestamps: true
})

// Ensure unique connection pairs (prevent duplicate connections)
NetworkConnectionSchema.index(
  { userId: 1, connectedUserId: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'declined' } } }
)

// Compound indexes for efficient queries
NetworkConnectionSchema.index({ userId: 1, status: 1 })
NetworkConnectionSchema.index({ connectedUserId: 1, status: 1 })
NetworkConnectionSchema.index({ status: 1, createdAt: -1 })

// Pre-save middleware to ensure consistent ordering (smaller ID first)
NetworkConnectionSchema.pre('save', function(next) {
  if (this.userId > this.connectedUserId) {
    const temp = this.userId
    this.userId = this.connectedUserId
    this.connectedUserId = temp
  }
  next()
})

export default mongoose.models.NetworkConnection || mongoose.model<INetworkConnection>('NetworkConnection', NetworkConnectionSchema)



