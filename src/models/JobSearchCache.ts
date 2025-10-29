import mongoose, { Schema, Document } from 'mongoose';

/**
 * Job Search Cache Model
 * 
 * Stores job searches for 3 weeks to:
 * - Reduce API calls for similar searches
 * - Track which jobs users have seen
 * - Share results across users with similar keywords
 */

export interface IJobSearchCache extends Document {
  // Search parameters (used for matching)
  keywords: string[];
  normalizedKeywords: string[]; // Lowercase, sorted for matching
  location: string;
  workType?: 'remote' | 'hybrid' | 'onsite' | 'any';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  
  // Cached job results
  jobs: Array<{
    jobId: string; // Unique identifier for deduplication
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    source: string;
    salary?: string;
    postedDate?: Date;
    workType?: string;
    skillMatchScore?: number;
    
    // Tracking
    viewedBy: Schema.Types.ObjectId[]; // Users who have seen this job
    appliedBy: Schema.Types.ObjectId[]; // Users who applied
    savedBy: Schema.Types.ObjectId[]; // Users who saved/bookmarked
  }>;
  
  // Metadata
  searchCount: number; // How many times this search was performed
  lastSearched: Date;
  createdAt: Date;
  expiresAt: Date; // Auto-delete after 3 weeks
}

const JobSearchCacheSchema: Schema = new Schema({
  keywords: {
    type: [String],
    required: true,
    index: true
  },
  normalizedKeywords: {
    type: [String],
    required: true,
    index: true
  },
  location: {
    type: String,
    required: true,
    index: true
  },
  workType: {
    type: String,
    enum: ['remote', 'hybrid', 'onsite', 'any'],
    default: 'any'
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive']
  },
  jobs: [{
    jobId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false,
      default: 'No description available'
    },
    url: {
      type: String,
      required: true
    },
    source: {
      type: String,
      required: true
    },
    salary: String,
    postedDate: Date,
    workType: String,
    skillMatchScore: Number,
    
    viewedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    appliedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    savedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  searchCount: {
    type: Number,
    default: 1
  },
  lastSearched: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 3 weeks
  }
}, {
  timestamps: true
});

// Compound index for efficient search matching
JobSearchCacheSchema.index({ normalizedKeywords: 1, location: 1, workType: 1 });

// TTL index to auto-delete expired caches
JobSearchCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// CRITICAL FIX: Simpler pre-save validation - only fix descriptions
JobSearchCacheSchema.pre('save', function(this: IJobSearchCache, next) {
  // Fix empty descriptions ONLY - don't filter jobs
  this.jobs.forEach((job: any) => {
    if (!job.description || job.description.trim() === '') {
      job.description = 'No description available';
    }
  });
  
  console.log(`[CACHE] Saving ${this.jobs.length} jobs`);
  next();
});

// Helper method to check if search matches cache
JobSearchCacheSchema.methods.matchesSearch = function(
  keywords: string[],
  location: string,
  workType?: string
): boolean {
  const normalizedInput = keywords
    .map(k => k.toLowerCase().trim())
    .sort()
    .join(',');
  
  const normalizedCache = this.normalizedKeywords.join(',');
  
  const keywordsMatch = normalizedInput === normalizedCache;
  const locationMatch = this.location.toLowerCase() === location.toLowerCase();
  const workTypeMatch = !workType || this.workType === workType || this.workType === 'any';
  
  return keywordsMatch && locationMatch && workTypeMatch;
};

// Helper method to mark job as viewed by user
JobSearchCacheSchema.methods.markJobViewed = function(
  jobId: string,
  userId: Schema.Types.ObjectId
): void {
  const job = this.jobs.find((j: any) => j.jobId === jobId);
  if (job && !job.viewedBy.includes(userId)) {
    job.viewedBy.push(userId);
  }
};

// Helper method to check if user has seen job
JobSearchCacheSchema.methods.hasUserSeenJob = function(
  jobId: string,
  userId: Schema.Types.ObjectId
): boolean {
  const job = this.jobs.find((j: any) => j.jobId === jobId);
  return job ? job.viewedBy.some((id: any) => id.equals(userId)) : false;
};

export default mongoose.models.JobSearchCache || 
  mongoose.model<IJobSearchCache>('JobSearchCache', JobSearchCacheSchema);
