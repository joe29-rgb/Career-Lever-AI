/**
 * User State Store (Zustand)
 * 
 * Manages client-side user state including:
 * - User profile data
 * - Authentication status
 * - User preferences
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  image?: string
  title?: string
  location?: string
  plan?: 'free' | 'pro' | 'company'
}

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  emailNotifications?: boolean
  jobAlerts?: boolean
  autopilotEnabled?: boolean
}

interface UserState {
  // State
  user: User | null
  preferences: UserPreferences
  isLoading: boolean
  
  // Actions
  setUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => void
  setPreferences: (preferences: Partial<UserPreferences>) => void
  clearUser: () => void
  setLoading: (loading: boolean) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      preferences: {
        theme: 'system',
        emailNotifications: true,
        jobAlerts: true,
        autopilotEnabled: false,
      },
      isLoading: false,

      // Actions
      setUser: (user) => set({ user, isLoading: false }),
      
      updateUser: (updates) => 
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      
      setPreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),
      
      clearUser: () => set({ user: null, preferences: {
        theme: 'system',
        emailNotifications: true,
        jobAlerts: true,
        autopilotEnabled: false,
      }}),
      
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'user-storage', // LocalStorage key
      partialize: (state) => ({
        user: state.user,
        preferences: state.preferences,
      }),
    }
  )
)

// Selectors for optimized re-renders
export const selectUser = (state: UserState) => state.user
export const selectUserPlan = (state: UserState) => state.user?.plan
export const selectPreferences = (state: UserState) => state.preferences
export const selectIsLoading = (state: UserState) => state.isLoading

