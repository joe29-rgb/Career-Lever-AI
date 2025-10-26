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
    description: { type: String, required: true, default: 'No description available' },
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

// CRITICAL FIX: Pre-save validation
SelectedJobSchema.pre('save', function(this: ISelectedJob, next) {
  // Ensure description is not empty
  if (!this.jobData.description || this.jobData.description.trim() === '') {
    this.jobData.description = 'No description available';
    console.log('[SELECTED_JOB] ⚠️ Set default description for:', this.jobData.title);
  }
  
  // Ensure company is not empty
  if (!this.jobData.company || this.jobData.company.trim() === '') {
    console.error('[SELECTED_JOB] ❌ Cannot save job with empty company:', this.jobData.title);
    return next(new Error('Company name is required'));
  }
  
  // Ensure title is not empty
  if (!this.jobData.title || this.jobData.title.trim() === '') {
    console.error('[SELECTED_JOB] ❌ Cannot save job with empty title');
    return next(new Error('Job title is required'));
  }
  
  console.log('[SELECTED_JOB] ✅ Validated job:', this.jobData.title, '@', this.jobData.company);
  next();
});

// Compound index for efficient queries
SelectedJobSchema.index({ userId: 1, selectedAt: -1 })

export const SelectedJob = mongoose.models.SelectedJob || mongoose.model<ISelectedJob>('SelectedJob', SelectedJobSchema)

