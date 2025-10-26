'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Mail, Calendar, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface FollowUpItem {
  id: string
  company: string
  jobTitle: string
  appliedDate: string
  daysSinceApplied: number
  status: string
  priority: 'high' | 'medium' | 'low'
}

export function FollowUpReminders() {
  const [reminders, setReminders] = useState<FollowUpItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFollowUpReminders()
  }, [])

  const fetchFollowUpReminders = async () => {
    try {
      const response = await fetch('/api/applications/follow-up-reminders')
      if (response.ok) {
        const data = await response.json()
        setReminders(data)
      }
    } catch (error) {
      console.error('[FOLLOW_UP] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsFollowedUp = async (id: string) => {
    try {
      await fetch(`/api/applications/${id}/follow-up`, {
        method: 'POST'
      })
      // Remove from list
      setReminders(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('[FOLLOW_UP] Error marking as followed up:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-950'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-950'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Follow-Up Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Follow-Up Reminders
          </div>
          {reminders.length > 0 && (
            <span className="text-sm font-normal px-3 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-full">
              {reminders.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="text-sm text-muted-foreground">
              All caught up! No follow-ups needed right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 rounded-lg border-2 ${getPriorityColor(reminder.priority)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{reminder.jobTitle}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        reminder.priority === 'high' ? 'bg-red-200 dark:bg-red-800' :
                        reminder.priority === 'medium' ? 'bg-yellow-200 dark:bg-yellow-800' :
                        'bg-blue-200 dark:bg-blue-800'
                      }`}>
                        {reminder.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{reminder.company}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{reminder.daysSinceApplied} days ago</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{reminder.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsFollowedUp(reminder.id)}
                      className="whitespace-nowrap"
                    >
                      <Mail className="w-3 h-3 mr-1" />
                      Mark Done
                    </Button>
                  </div>
                </div>
                
                {/* Quick Action Suggestions */}
                <div className="mt-3 pt-3 border-t border-current/20">
                  <p className="text-xs font-medium mb-2">Suggested Action:</p>
                  <p className="text-xs opacity-80">
                    {reminder.daysSinceApplied >= 14 ? (
                      <>Send a polite follow-up email asking about your application status.</>
                    ) : reminder.daysSinceApplied >= 7 ? (
                      <>Consider reaching out to the hiring manager on LinkedIn.</>
                    ) : (
                      <>Wait a few more days before following up.</>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Link */}
        {reminders.length > 0 && (
          <div className="mt-4 text-center">
            <Link href="/applications">
              <Button variant="ghost" size="sm">
                View All Applications →
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
