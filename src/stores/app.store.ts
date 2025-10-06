/**
 * Application State Store (Zustand)
 * 
 * Manages global application state including:
 * - UI state (modals, sidebars, loading)
 * - Temporary data (drafts, uploads)
 * - Navigation state
 */

import { create } from 'zustand'

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface AppState {
  // UI State
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  modalOpen: string | null
  
  // Upload State
  uploads: Record<string, UploadProgress>
  
  // Toast Notifications
  toasts: Toast[]
  
  // Loading States
  globalLoading: boolean
  loadingMessage: string | null
  
  // Actions - UI
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  openModal: (modalId: string) => void
  closeModal: () => void
  
  // Actions - Uploads
  setUploadProgress: (fileId: string, progress: UploadProgress) => void
  removeUpload: (fileId: string) => void
  clearUploads: () => void
  
  // Actions - Toasts
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  sidebarOpen: true,
  mobileMenuOpen: false,
  modalOpen: null,
  uploads: {},
  toasts: [],
  globalLoading: false,
  loadingMessage: null,

  // UI Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  
  openModal: (modalId) => set({ modalOpen: modalId }),
  
  closeModal: () => set({ modalOpen: null }),

  // Upload Actions
  setUploadProgress: (fileId, progress) =>
    set((state) => ({
      uploads: { ...state.uploads, [fileId]: progress },
    })),
  
  removeUpload: (fileId) =>
    set((state) => {
      const { [fileId]: removed, ...rest } = state.uploads
      return { uploads: rest }
    }),
  
  clearUploads: () => set({ uploads: {} }),

  // Toast Actions
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      ],
    })),
  
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  
  clearToasts: () => set({ toasts: [] }),

  // Loading Actions
  setGlobalLoading: (loading, message) =>
    set({ globalLoading: loading, loadingMessage: message || null }),
}))

// Selectors
export const selectSidebarOpen = (state: AppState) => state.sidebarOpen
export const selectMobileMenuOpen = (state: AppState) => state.mobileMenuOpen
export const selectModalOpen = (state: AppState) => state.modalOpen
export const selectUploads = (state: AppState) => state.uploads
export const selectToasts = (state: AppState) => state.toasts
export const selectGlobalLoading = (state: AppState) => state.globalLoading

