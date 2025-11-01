/**
 * APPLICATION STATUS SERVICE
 * 
 * Handles application status updates with atomic operations and race condition protection
 */

import { getMutex } from '../utils/mutex-lock'
import Application from '@/models/Application'
import { dbService } from '../database'
import type { ApplicationStatus, UpdateApplicationInput } from '@/types/application'

export class ApplicationStatusService {
  private static instance: ApplicationStatusService
  private mutex = getMutex()

  static getInstance(): ApplicationStatusService {
    if (!ApplicationStatusService.instance) {
      ApplicationStatusService.instance = new ApplicationStatusService()
    }
    return ApplicationStatusService.instance
  }

  /**
   * Update application status with atomic operation
   */
  async updateStatus(
    userId: string,
    applicationId: string,
    updates: UpdateApplicationInput
  ): Promise<void> {
    const lockKey = `application_status:${userId}:${applicationId}`

    await this.mutex.withLock(lockKey, async () => {
      console.log('[APP_STATUS] Updating with lock:', lockKey)

      await dbService.connect()

      // Atomic update with optimistic locking
      const result = await Application.findOneAndUpdate(
        {
          _id: applicationId,
          userId
        },
        {
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        },
        {
          new: true,
          runValidators: true
        }
      )

      if (!result) {
        throw new Error('Application not found or update failed')
      }

      console.log('[APP_STATUS] ✅ Status updated:', {
        applicationId,
        status: updates.status
      })
    })
  }

  /**
   * Batch update multiple applications atomically
   */
  async batchUpdateStatus(
    userId: string,
    updates: Array<{
      applicationId: string
      status: ApplicationStatus
    }>
  ): Promise<{ success: number; failed: number }> {
    const lockKey = `application_batch:${userId}`

    return this.mutex.withLock(lockKey, async () => {
      console.log('[APP_STATUS] Batch updating:', updates.length, 'applications')

      await dbService.connect()

      let success = 0
      let failed = 0

      for (const update of updates) {
        try {
          await Application.findOneAndUpdate(
            {
              _id: update.applicationId,
              userId
            },
            {
              $set: {
                status: update.status,
                updatedAt: new Date()
              }
            }
          )
          success++
        } catch (error) {
          console.error('[APP_STATUS] Failed to update:', update.applicationId, error)
          failed++
        }
      }

      console.log('[APP_STATUS] ✅ Batch complete:', { success, failed })

      return { success, failed }
    })
  }

  /**
   * Schedule follow-up with conflict prevention
   */
  async scheduleFollowUp(
    userId: string,
    applicationId: string,
    scheduledAt: Date,
    notes?: string
  ): Promise<void> {
    const lockKey = `followup:${userId}:${applicationId}`

    await this.mutex.withLock(lockKey, async () => {
      await dbService.connect()

      await Application.findOneAndUpdate(
        {
          _id: applicationId,
          userId
        },
        {
          $set: {
            followUpStatus: 'scheduled',
            followUpScheduledAt: scheduledAt,
            followUpNotes: notes,
            updatedAt: new Date()
          }
        }
      )

      console.log('[APP_STATUS] ✅ Follow-up scheduled:', applicationId)
    })
  }

  /**
   * Mark follow-up as sent
   */
  async markFollowUpSent(
    userId: string,
    applicationId: string
  ): Promise<void> {
    const lockKey = `followup:${userId}:${applicationId}`

    await this.mutex.withLock(lockKey, async () => {
      await dbService.connect()

      await Application.findOneAndUpdate(
        {
          _id: applicationId,
          userId
        },
        {
          $set: {
            followUpStatus: 'sent',
            followUpSentAt: new Date(),
            lastContactedAt: new Date(),
            updatedAt: new Date()
          }
        }
      )

      console.log('[APP_STATUS] ✅ Follow-up marked sent:', applicationId)
    })
  }
}

export default ApplicationStatusService
