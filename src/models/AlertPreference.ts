import mongoose, { Schema, Document } from 'mongoose'

export interface IAlertPreference extends Document {
  userId: mongoose.Types.ObjectId
  enabled: boolean
  channels: {
    email: boolean
    inApp: boolean
    push: boolean
  }
  alertTypes: {
    newJobMatches: boolean
    applicationUpdates: boolean
    interviewReminders: boolean
    followUpReminders: boolean
    deadlineAlerts: boolean
    responseTimeAlerts: boolean
    networkActivity: boolean
  }
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  quietHours: {
    enabled: boolean
    start: string // HH:mm format
    end: string   // HH:mm format
    timezone: string
  }
  jobMatchCriteria?: {
    jobTitles: string[]
    locations: string[]
    minSalary?: number
    workTypes: string[] // remote, hybrid, onsite
    industries: string[]
  }
}

const AlertPreferenceSchema = new Schema<IAlertPreference>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  enabled: { type: Boolean, default: true },
  channels: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    push: { type: Boolean, default: false }
  },
  alertTypes: {
    newJobMatches: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    interviewReminders: { type: Boolean, default: true },
    followUpReminders: { type: Boolean, default: true },
    deadlineAlerts: { type: Boolean, default: true },
    responseTimeAlerts: { type: Boolean, default: false },
    networkActivity: { type: Boolean, default: false }
  },
  frequency: { 
    type: String, 
    enum: ['realtime', 'hourly', 'daily', 'weekly'],
    default: 'realtime'
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '22:00' },
    end: { type: String, default: '08:00' },
    timezone: { type: String, default: 'America/Toronto' }
  },
  jobMatchCriteria: {
    jobTitles: [{ type: String }],
    locations: [{ type: String }],
    minSalary: { type: Number },
    workTypes: [{ type: String }],
    industries: [{ type: String }]
  }
}, {
  timestamps: true
})

export default mongoose.models.AlertPreference || mongoose.model<IAlertPreference>('AlertPreference', AlertPreferenceSchema)
