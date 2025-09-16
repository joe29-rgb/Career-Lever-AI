// User Types
export interface User {
  _id?: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Resume Types
export interface Resume {
  _id?: string;
  userId: string;
  originalFileName: string;
  fileUrl: string;
  extractedText: string;
  customizedVersions: CustomizedResume[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomizedResume {
  _id?: string;
  jobApplicationId: string;
  customizedText: string;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  createdAt: Date;
}

// Job Application Types
export interface JobApplication {
  _id?: string;
  userId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  jobUrl?: string;
  applicationStatus: ApplicationStatus;
  appliedDate: Date;
  followUpDates: Date[];
  companyResearch: CompanyData;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

// Company Research Types
export interface CompanyData {
  _id?: string;
  companyName: string;
  website?: string;
  industry?: string;
  size?: string;
  description?: string;
  culture?: string[];
  benefits?: string[];
  recentNews?: CompanyNews[];
  glassdoorRating?: number;
  glassdoorReviews?: number;
  linkedinData?: LinkedInData;
  socialMedia?: SocialMediaData;
  cachedAt: Date;
  expiresAt: Date;
}

export interface CompanyNews {
  title: string;
  url: string;
  publishedAt: Date;
  summary: string;
}

export interface LinkedInData {
  companyPage: string;
  employeeCount?: number;
  followers?: number;
  recentPosts?: LinkedInPost[];
}

export interface LinkedInPost {
  content: string;
  postedAt: Date;
  engagement: number;
}

export interface SocialMediaData {
  twitter?: TwitterData;
  facebook?: FacebookData;
  instagram?: InstagramData;
}

export interface TwitterData {
  handle: string;
  followers: number;
  recentTweets: Tweet[];
}

export interface Tweet {
  text: string;
  createdAt: Date;
  likes: number;
  retweets: number;
}

export interface FacebookData {
  pageUrl: string;
  followers: number;
  recentPosts: FacebookPost[];
}

export interface FacebookPost {
  content: string;
  postedAt: Date;
  reactions: number;
}

export interface InstagramData {
  handle: string;
  followers: number;
  recentPosts: InstagramPost[];
}

export interface InstagramPost {
  caption: string;
  postedAt: Date;
  likes: number;
  comments: number;
}

// API Request/Response Types
export interface ResumeUploadRequest {
  file: File;
}

export interface ResumeUploadResponse {
  success: boolean;
  resume: Resume;
  message?: string;
}

export interface JobAnalysisRequest {
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
}

export interface JobAnalysisResponse {
  success: boolean;
  analysis: JobAnalysis;
  keywords: string[];
  requirements: string[];
}

export interface JobAnalysis {
  jobTitle: string;
  companyName: string;
  keyRequirements: string[];
  preferredSkills: string[];
  responsibilities: string[];
  companyCulture: string[];
  salaryRange?: string;
  experienceLevel?: string;
}

export interface ResumeCustomizationRequest {
  resumeId: string;
  jobDescription: string;
  jobTitle: string;
  companyName: string;
}

export interface ResumeCustomizationResponse {
  success: boolean;
  customizedResume: CustomizedResume;
  matchScore: number;
  improvements: string[];
}

export interface CompanyResearchRequest {
  companyName: string;
  website?: string;
}

export interface CompanyResearchResponse {
  success: boolean;
  companyData: CompanyData;
  sources: string[];
}

export interface CoverLetterGenerationRequest {
  jobApplicationId: string;
  resumeId: string;
  tone?: 'professional' | 'casual' | 'enthusiastic';
  length?: 'short' | 'medium' | 'long';
}

export interface CoverLetterGenerationResponse {
  success: boolean;
  coverLetter: string;
  keyPoints: string[];
}

export interface FollowUpEmailRequest {
  jobApplicationId: string;
  daysSinceApplication: number;
  context?: string;
}

export interface FollowUpEmailResponse {
  success: boolean;
  emailSubject: string;
  emailBody: string;
  suggestedTiming: string;
}

// UI Component Props Types
export interface ResumeUploadProps {
  onUploadSuccess: (resume: Resume) => void;
  onUploadError: (error: string) => void;
  maxFileSize?: number;
  acceptedTypes?: string[];
}

export interface JobAnalysisFormProps {
  onAnalysisComplete: (analysis: JobAnalysisResponse) => void;
  onError: (error: string) => void;
}

export interface ResumeCustomizerProps {
  resume: Resume;
  jobAnalysis: JobAnalysis;
  onCustomizationComplete: (customized: CustomizedResume) => void;
  onError: (error: string) => void;
}

export interface CompanyResearchPanelProps {
  companyName: string;
  onResearchComplete: (data: CompanyData) => void;
  onError: (error: string) => void;
}

export interface ApplicationTrackerProps {
  userId: string;
  applications: JobApplication[];
  onStatusUpdate: (applicationId: string, status: ApplicationStatus) => void;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Network Types
export interface NetworkPost {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userTitle?: string;
  type: 'job_opportunity' | 'career_advice' | 'success_story' | 'question' | 'general';
  title?: string;
  content: string;
  tags?: string[];
  attachments?: Array<{
    type: 'image' | 'document' | 'link';
    url: string;
    name: string;
  }>;
  likes: string[];
  comments: Array<{
    userId: string;
    userName: string;
    content: string;
    createdAt: Date;
  }>;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
  visibility: 'public' | 'connections' | 'private';
}

export interface NetworkUser {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  location?: string;
  skills?: string[];
  experience?: string;
  connections: number;
  mutualConnections: number;
  isOnline?: boolean;
  lastActive?: Date;
}

export interface NetworkConnection {
  _id: string;
  userId: string;
  connectedUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  initiatedBy: string;
  acceptedAt?: Date;
  message?: string;
  user?: NetworkUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'link';
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size?: number;
  }>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Job Board Integration Types
export interface JobBoardIntegration {
  _id: string;
  userId: string;
  boardName: string;
  boardDisplayName: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'requires_auth';
  lastSyncAt?: Date;
  lastSuccessfulSyncAt?: Date;
  syncStatus: 'idle' | 'syncing' | 'success' | 'failed';
  errorMessage?: string;
  totalApplications: number;
  successfulApplications: number;
  lastApplicationAt?: Date;
  settings: {
    autoSync: boolean;
    syncFrequency: 'manual' | 'daily' | 'weekly';
    defaultResumeId?: string;
    defaultCoverLetterId?: string;
    notificationPreferences: {
      applicationSubmitted: boolean;
      applicationViewed: boolean;
      interviewRequested: boolean;
      errors: boolean;
    };
  };
  metadata: {
    apiVersion?: string;
    accountId?: string;
    accountName?: string;
    accountType?: string;
    rateLimits?: {
      requestsPerHour: number;
      requestsPerDay: number;
      lastRequestAt?: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface JobBoardSubmissionRequest {
  jobApplicationId: string;
  jobBoards: string[];
  resumeId?: string;
  coverLetterId?: string;
  customizations?: Record<string, any>;
}

export interface JobBoardSubmissionResult {
  jobBoard: string;
  success: boolean;
  message: string;
  applicationUrl?: string;
  trackingId?: string;
  error?: string;
}
