/**
 * Job Application State Store (Zustand)
 * 
 * Manages job application state including:
 * - Application drafts
 * - Filters and search
 * - Selected applications
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ApplicationStatus = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn'

interface ApplicationDraft {
  jobTitle: string
  companyName: string
  jobDescription: string
  jobUrl?: string
  notes?: string
  lastModified: string
}

interface ApplicationFilters {
  status: ApplicationStatus[]
  companyName?: string
  jobTitle?: string
  dateFrom?: string
  dateTo?: string
}

interface JobApplicationState {
  // State
  drafts: Record<string, ApplicationDraft>
  selectedApplicationIds: string[]
  filters: ApplicationFilters
  searchQuery: string
  
  // Actions - Drafts
  saveDraft: (id: string, draft: ApplicationDraft) => void
  getDraft: (id: string) => ApplicationDraft | undefined
  removeDraft: (id: string) => void
  clearDrafts: () => void
  
  // Actions - Selection
  selectApplication: (id: string) => void
  deselectApplication: (id: string) => void
  toggleApplicationSelection: (id: string) => void
  selectMultipleApplications: (ids: string[]) => void
  clearSelection: () => void
  
  // Actions - Filters
  setFilters: (filters: Partial<ApplicationFilters>) => void
  resetFilters: () => void
  setSearchQuery: (query: string) => void
}

const initialFilters: ApplicationFilters = {
  status: [],
}

export const useJobApplicationStore = create<JobApplicationState>()(
  persist(
    (set, get) => ({
      // Initial state
      drafts: {},
      selectedApplicationIds: [],
      filters: initialFilters,
      searchQuery: '',

      // Draft Actions
      saveDraft: (id, draft) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [id]: { ...draft, lastModified: new Date().toISOString() },
          },
        })),
      
      getDraft: (id) => get().drafts[id],
      
      removeDraft: (id) =>
        set((state) => {
          const { [id]: removed, ...rest } = state.drafts
          return { drafts: rest }
        }),
      
      clearDrafts: () => set({ drafts: {} }),

      // Selection Actions
      selectApplication: (id) =>
        set((state) => {
          if (state.selectedApplicationIds.includes(id)) {
            return state
          }
          return {
            selectedApplicationIds: [...state.selectedApplicationIds, id],
          }
        }),
      
      deselectApplication: (id) =>
        set((state) => ({
          selectedApplicationIds: state.selectedApplicationIds.filter((appId) => appId !== id),
        })),
      
      toggleApplicationSelection: (id) =>
        set((state) => {
          const isSelected = state.selectedApplicationIds.includes(id)
          return {
            selectedApplicationIds: isSelected
              ? state.selectedApplicationIds.filter((appId) => appId !== id)
              : [...state.selectedApplicationIds, id],
          }
        }),
      
      selectMultipleApplications: (ids) =>
        set({ selectedApplicationIds: ids }),
      
      clearSelection: () => set({ selectedApplicationIds: [] }),

      // Filter Actions
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      
      resetFilters: () => set({ filters: initialFilters }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'job-application-storage',
      partialize: (state) => ({
        drafts: state.drafts,
        filters: state.filters,
      }),
    }
  )
)

// Selectors
export const selectDrafts = (state: JobApplicationState) => state.drafts
export const selectSelectedIds = (state: JobApplicationState) => state.selectedApplicationIds
export const selectFilters = (state: JobApplicationState) => state.filters
export const selectSearchQuery = (state: JobApplicationState) => state.searchQuery
export const selectHasActiveFilters = (state: JobApplicationState) =>
  state.filters.status.length > 0 ||
  !!state.filters.companyName ||
  !!state.filters.jobTitle ||
  !!state.filters.dateFrom ||
  !!state.filters.dateTo

