'use client'

import React, { useState } from 'react'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface SearchHeroProps {
  onSearch?: (query: string, location: string) => void
  onFilterClick?: () => void
}

export const SearchHeroSection: React.FC<SearchHeroProps> = ({ onSearch, onFilterClick }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery, location)
  }

  return (
    <div className="relative overflow-hidden rounded-3xl mb-8 mx-4">
      {/* Animated Background */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-red-500 p-8 relative">
        {/* Floating Elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-yellow-400 bg-opacity-20 rounded-full animate-bounce blur-xl" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="absolute bottom-4 left-4 w-20 h-20 bg-card bg-opacity-10 rounded-2xl animate-bounce blur-lg" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-red-400 bg-opacity-15 rounded-full animate-bounce blur-lg" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>

        <div className="relative z-10 text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
            🚀 Find Your Dream Job
          </h1>
          <p className="text-white text-opacity-90 text-lg font-medium">
            Discover opportunities that match your skills and passion
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative z-10 max-w-4xl mx-auto">
          <div className="bg-card bg-opacity-95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Job Title Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Job title or keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-border rounded-xl text-foreground placeholder-gray-500 focus:border-blue-500 focus:ring-0 focus:outline-none transition-colors"
                />
              </div>

              {/* Location Search */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-border rounded-xl text-foreground placeholder-gray-500 focus:border-blue-500 focus:ring-0 focus:outline-none transition-colors"
                />
              </div>

              {/* Filter Button */}
              <button 
                type="button"
                onClick={onFilterClick}
                className="px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center"
              >
                <FunnelIcon className="w-5 h-5 text-gray-600" />
              </button>

              {/* Search Button */}
              <button 
                type="submit"
                className="btn-dribbble-primary px-8 py-4 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Search Jobs
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

