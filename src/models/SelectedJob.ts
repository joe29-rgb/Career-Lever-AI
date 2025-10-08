/**
 * Selected Job Model
 * Stores jobs selected by users for analysis in Career Finder
 */

import mongoose, { Schema, Document } from 'mongoose'

export interface ISelectedJob extends Document {
  userId: string
  jobData: {
    id: string
    title: string
    company: string
    location: string
    salary?: string
    description: string
    url: string
    source: string
    postedDate?: string
    skills?: string[]
    requirements?: string[]
  }
  selectedAt: Date
  status: 'pending_analysis' | 'analyzed' | 'applied'
  analysisResults?: any
}

const SelectedJobSchema = new Schema<ISelectedJob>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  jobData: {
    id: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    salary: String,
    description: { type: String, required: true },
    url: { type: String, required: true },
    source: { type: String, default: 'search' },
    postedDate: String,
    skills: [String],
    requirements: [String]
  },
  selectedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['pending_analysis', 'analyzed', 'applied'],
    default: 'pending_analysis'
  },
  analysisResults: Schema.Types.Mixed
}, {
  timestamps: true
})

// Compound index for efficient queries
SelectedJobSchema.index({ userId: 1, selectedAt: -1 })

export const SelectedJob = mongoose.models.SelectedJob || mongoose.model<ISelectedJob>('SelectedJob', SelectedJobSchema)

