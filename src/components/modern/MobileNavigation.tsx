'use client'

import React from 'react'

export const MobileNavigation: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 md:hidden">
      <div className="flex justify-around items-center h-16 px-4">
        {/* Navigation items can be added here */}
      </div>
    </nav>
  )
}
