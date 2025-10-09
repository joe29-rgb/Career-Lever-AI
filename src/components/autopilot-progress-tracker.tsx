"use client"

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { CheckCircle, Loader2, Clock } from 'lucide-react'

interface ProgressTask {
  id: string
  label: string
  status: 'pending' | 'loading' | 'complete'
  time: string
}

export function AutopilotProgressTracker() {
  const [tasks, setTasks] = useState<ProgressTask[]>([
    { id: 'resume', label: 'Analyzing resume', status: 'complete', time: '2s' },
    { id: 'search', label: 'Searching 25+ job boards', status: 'pending', time: '~8s' },
    { id: 'research', label: 'Researching companies', status: 'pending', time: '~10s' },
    { id: 'optimize', label: 'Pre-generating materials', status: 'pending', time: '~15s' }
  ])
  
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    // Listen for progress updates from localStorage
    const interval = setInterval(() => {
      try {
        const progress = JSON.parse(localStorage.getItem('cf:autopilotProgress') || '{}')
        
        // Check if any task is active
        const hasActiveTask = Object.values(progress).some(status => status === 'loading')
        const allComplete = Object.keys(progress).length === 4 && 
                           Object.values(progress).every(status => status === 'complete')
        
        if (allComplete) {
          // Hide after 3 seconds if all complete
          setTimeout(() => {
            setIsVisible(false)
            localStorage.removeItem('cf:autopilotProgress')
          }, 3000)
        } else if (hasActiveTask || Object.keys(progress).length > 0) {
          setIsVisible(true)
        }
        
        // Update task statuses
        setTasks(prev => prev.map(task => ({
          ...task,
          status: (progress[task.id] as 'pending' | 'loading' | 'complete') || task.status
        })))
      } catch (error) {
        console.error('[AUTOPILOT_TRACKER] Error:', error)
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [])
  
  if (!isVisible) return null
  
  const allComplete = tasks.every(task => task.status === 'complete')
  
  return (
    <Card className="fixed bottom-4 right-4 p-4 shadow-2xl z-50 w-80 bg-card border-border backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        {allComplete ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold text-foreground">✅ Autopilot Complete!</h4>
          </>
        ) : (
          <>
            <div className="relative">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            </div>
            <h4 className="font-semibold text-foreground">🤖 AI Autopilot Working...</h4>
          </>
        )}
      </div>
      
      <div className="space-y-2">
        {tasks.map(task => {
          const StatusIcon = task.status === 'complete' ? CheckCircle :
                           task.status === 'loading' ? Loader2 : Clock
          
          const iconColor = task.status === 'complete' ? 'text-green-500' :
                          task.status === 'loading' ? 'text-primary' : 'text-muted-foreground'
          
          const textColor = task.status === 'complete' ? 'text-muted-foreground' : 'text-foreground'
          
          return (
            <div key={task.id} className="flex items-center gap-2 text-sm">
              <StatusIcon className={`w-4 h-4 ${iconColor} ${task.status === 'loading' ? 'animate-spin' : ''} flex-shrink-0`} />
              <span className={textColor}>{task.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">{task.time}</span>
            </div>
          )
        })}
      </div>
      
      {allComplete && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Your personalized job matches are ready! 🎉
          </p>
        </div>
      )}
    </Card>
  )
}

