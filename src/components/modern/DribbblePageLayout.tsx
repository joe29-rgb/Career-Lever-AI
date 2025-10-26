'use client'

import React from 'react'
import { MobileNavigation } from './MobileNavigation'

interface PageLayoutProps {
  children: React.ReactNode
  showNavigation?: boolean
  fullWidth?: boolean
}

export const DribbblePageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  showNavigation = true,
  fullWidth = false
}) => {
  return (
    <div className="page-background-dribbble min-h-screen">
      <div className={`relative z-10 ${showNavigation ? 'pb-20' : 'pb-8'} ${fullWidth ? '' : 'max-w-7xl mx-auto'}`}>
        {children}
      </div>
      {showNavigation && <MobileNavigation />}
    </div>
  )
}

