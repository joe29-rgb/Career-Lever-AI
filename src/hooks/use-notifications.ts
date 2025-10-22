import { useState, useEffect } from 'react'

export function useNotifications() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    // Check for notifications from localStorage
    const checkNotifications = () => {
      try {
        const notifications = localStorage.getItem('notifications')
        if (notifications) {
          const parsed = JSON.parse(notifications)
          setCount(parsed.unread || 0)
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    checkNotifications()
    
    // Check every 30 seconds
    const interval = setInterval(checkNotifications, 30000)
    return () => clearInterval(interval)
  }, [])
  
  return { count }
}
