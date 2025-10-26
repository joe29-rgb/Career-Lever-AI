'use client'

import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle: string
  progress?: number
  showProgress?: boolean
}

export const VibrantPageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  progress = 0, 
  showProgress = false 
}) => {
  return (
    <div className="relative overflow-hidden rounded-b-[40px] mb-8">
      {/* Gradient Background */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-red-500 px-6 py-12">
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-card bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-yellow-400 bg-opacity-20 rounded-2xl blur-lg"></div>
        
        {/* Content */}
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
            {title}
          </h1>
          <p className="text-white text-opacity-90 text-lg font-medium max-w-md mx-auto">
            {subtitle}
          </p>
          
          {/* Progress Bar */}
          {showProgress && (
            <div className="mt-6 max-w-xs mx-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white text-sm font-medium">Progress</span>
                <span className="text-white text-sm font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-card bg-opacity-20 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

