/**
 * Notification Service
 * 
 * Manages user notifications for job matches, application updates,
 * and system alerts with real-time delivery
 */

export interface Notification {
  id: string
  userId: string
  type: 'job_match' | 'application_update' | 'network_activity' | 'system_alert' | 'career_insight'
  title: string
  message: string
  link?: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  metadata?: {
    jobId?: string
    applicationId?: string
    companyName?: string
    aiInsight?: string
  }
  createdAt: Date
  readAt?: Date
}

export class NotificationService {
  /**
   * Get unread notification count for user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await fetch(`/api/notifications/count?userId=${userId}`)
      const data = await response.json()
      return data.count || 0
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to get count:', error)
      return 0
    }
  }

  /**
   * Get recent notifications for user
   */
  static async getNotifications(
    userId: string,
    options: { limit?: number; unreadOnly?: boolean } = {}
  ): Promise<Notification[]> {
    try {
      const params = new URLSearchParams({
        userId,
        limit: String(options.limit || 20),
        unreadOnly: String(options.unreadOnly || false)
      })
      
      const response = await fetch(`/api/notifications?${params}`)
      const data = await response.json()
      return data.notifications || []
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to get notifications:', error)
      return []
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      return response.ok
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to mark as read:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      return response.ok
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to mark all as read:', error)
      return false
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      return response.ok
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to delete:', error)
      return false
    }
  }

  /**
   * Create notification (server-side only)
   */
  static async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'readAt'>): Promise<Notification | null> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data.notification || null
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to create:', error)
      return null
    }
  }

  /**
   * Get notification icon by type
   */
  static getIcon(type: Notification['type']): string {
    switch (type) {
      case 'job_match': return '💼'
      case 'application_update': return '📋'
      case 'network_activity': return '👥'
      case 'system_alert': return '⚠️'
      case 'career_insight': return '💡'
      default: return '🔔'
    }
  }

  /**
   * Get notification color by priority
   */
  static getColor(priority: Notification['priority']): string {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-blue-600'
      case 'low': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  /**
   * Format notification time
   */
  static formatTime(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }
}

