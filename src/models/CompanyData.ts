import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyNews extends Document {
  title: string;
  url: string;
  publishedAt: Date;
  summary: string;
}

export interface ILinkedInPost extends Document {
  content: string;
  postedAt: Date;
  engagement: number;
}

export interface ILinkedInData extends Document {
  companyPage: string;
  employeeCount?: number;
  followers?: number;
  recentPosts?: ILinkedInPost[];
}

export interface ITweet extends Document {
  text: string;
  createdAt: Date;
  likes: number;
  retweets: number;
}

export interface ITwitterData extends Document {
  handle: string;
  followers: number;
  recentTweets: ITweet[];
}

export interface IFacebookPost extends Document {
  content: string;
  postedAt: Date;
  reactions: number;
}

export interface IFacebookData extends Document {
  pageUrl: string;
  followers: number;
  recentPosts: IFacebookPost[];
}

export interface IInstagramPost extends Document {
  caption: string;
  postedAt: Date;
  likes: number;
  comments: number;
}

export interface IInstagramData extends Document {
  handle: string;
  followers: number;
  recentPosts: IInstagramPost[];
}

export interface ISocialMediaData extends Document {
  twitter?: ITwitterData;
  facebook?: IFacebookData;
  instagram?: IInstagramData;
}

export interface ICompanyData extends Document {
  companyName: string;
  website?: string;
  industry?: string;
  size?: string;
  description?: string;
  culture?: string[];
  benefits?: string[];
  recentNews?: ICompanyNews[];
  glassdoorRating?: number;
  glassdoorReviews?: number;
  linkedinData?: ILinkedInData;
  socialMedia?: ISocialMediaData;
  cachedAt: Date;
  expiresAt: Date;
}

const CompanyNewsSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  publishedAt: {
    type: Date,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
});

const LinkedInPostSchema: Schema = new Schema({
  content: {
    type: String,
    required: true,
  },
  postedAt: {
    type: Date,
    required: true,
  },
  engagement: {
    type: Number,
    default: 0,
  },
});

const LinkedInDataSchema: Schema = new Schema({
  companyPage: {
    type: String,
    required: true,
  },
  employeeCount: Number,
  followers: Number,
  recentPosts: [LinkedInPostSchema],
});

const TweetSchema: Schema = new Schema({
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  retweets: {
    type: Number,
    default: 0,
  },
});

const TwitterDataSchema: Schema = new Schema({
  handle: {
    type: String,
    required: true,
  },
  followers: {
    type: Number,
    default: 0,
  },
  recentTweets: [TweetSchema],
});

const FacebookPostSchema: Schema = new Schema({
  content: {
    type: String,
    required: true,
  },
  postedAt: {
    type: Date,
    required: true,
  },
  reactions: {
    type: Number,
    default: 0,
  },
});

const FacebookDataSchema: Schema = new Schema({
  pageUrl: {
    type: String,
    required: true,
  },
  followers: {
    type: Number,
    default: 0,
  },
  recentPosts: [FacebookPostSchema],
});

const InstagramPostSchema: Schema = new Schema({
  caption: {
    type: String,
    required: true,
  },
  postedAt: {
    type: Date,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
});

const InstagramDataSchema: Schema = new Schema({
  handle: {
    type: String,
    required: true,
  },
  followers: {
    type: Number,
    default: 0,
  },
  recentPosts: [InstagramPostSchema],
});

const SocialMediaDataSchema: Schema = new Schema({
  twitter: TwitterDataSchema,
  facebook: FacebookDataSchema,
  instagram: InstagramDataSchema,
});

const CompanyDataSchema: Schema = new Schema({
  companyName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  industry: {
    type: String,
    trim: true,
  },
  size: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  culture: [{
    type: String,
    trim: true,
  }],
  benefits: [{
    type: String,
    trim: true,
  }],
  recentNews: [CompanyNewsSchema],
  glassdoorRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  glassdoorReviews: Number,
  linkedinData: LinkedInDataSchema,
  socialMedia: SocialMediaDataSchema,
  cachedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
}, {
  timestamps: false, // We handle caching manually
});

// Add indexes for better query performance
CompanyDataSchema.index({ companyName: 1 }, { unique: true });
CompanyDataSchema.index({ expiresAt: 1 });
CompanyDataSchema.index({ cachedAt: -1 });

export default mongoose.models.CompanyData || mongoose.model<ICompanyData>('CompanyData', CompanyDataSchema);



