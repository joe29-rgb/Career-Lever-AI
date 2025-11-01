/**
 * TYPE DEFINITIONS FOR APPLICATIONS
 * 
 * Properly typed application status and interfaces
 */

export type ApplicationStatus = 
  | 'applied'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offer_received'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export type FollowUpStatus =
  | 'pending'
  | 'scheduled'
  | 'sent'
  | 'completed'
  | 'not_needed'

export interface InterviewPrep {
  questions: string[]
  companyInsights: string
  talkingPoints: string[]
  preparedAt: Date
}

export interface SalaryData {
  marketMin: number
  marketMedian: number
  marketMax: number
  userTarget: number
  negotiationTips: string[]
  preparedAt: Date
}

export interface ApplicationMetadata {
  url?: string
  description?: string
  batchApplied?: boolean
  appliedVia?: string
  coverLetter?: string
  coverLetterGeneratedAt?: Date
  [key: string]: any
}

export interface ApplicationDocument {
  _id: string
  userId: string
  jobId?: string
  company: string
  jobTitle: string
  location?: string
  salary?: string
  recipient: string
  status: ApplicationStatus
  appliedAt: Date
  interviewDate?: Date
  attachments: string[]
  followUpStatus: FollowUpStatus
  followUpScheduledAt?: Date
  followUpSentAt?: Date
  followUpNotes?: string
  lastContactedAt?: Date
  interviewPrep?: InterviewPrep
  salaryData?: SalaryData
  metadata: ApplicationMetadata
  createdAt: Date
  updatedAt: Date
}

export interface CreateApplicationInput {
  jobId?: string
  company: string
  jobTitle: string
  location?: string
  salary?: string
  recipient?: string
  metadata?: ApplicationMetadata
}

export interface UpdateApplicationInput {
  status?: ApplicationStatus
  interviewDate?: Date
  followUpStatus?: FollowUpStatus
  followUpScheduledAt?: Date
  followUpSentAt?: Date
  followUpNotes?: string
  lastContactedAt?: Date
  interviewPrep?: InterviewPrep
  salaryData?: SalaryData
  metadata?: Partial<ApplicationMetadata>
}
