import mongoose from 'mongoose'

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['job_match', 'application_update', 'network_activity', 'system_alert', 'career_insight'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    jobId: String,
    applicationId: String,
    companyName: String,
    aiInsight: String
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 })

// TTL index to auto-delete old notifications after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 })

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)

