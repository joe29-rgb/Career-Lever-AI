/**
 * RESUME MANAGER - Centralized Resume Storage
 * 
 * PROBLEM: Resume data stored in multiple localStorage keys causing data loss:
 * - 'uploadedResume' (legacy)
 * - 'cf:resume' (career finder)
 * - Database fetch (fallback)
 * 
 * SOLUTION: Single source of truth with automatic fallback chain
 * 
 * @module ResumeManager
 * @description Manages resume storage and retrieval with fallback strategies
 */

export interface StoredResume {
  _id?: string;
  userId?: string;
  originalFileName: string;
  filename: string;
  extractedText: string;
  extractionMethod?: string;
  uploadedAt?: Date | string;
}

export class ResumeManager {
  private static readonly KEYS = {
    current: 'cf:resume',                    // Primary key - Career Finder
    legacy: 'uploadedResume',                // Legacy compatibility
    selected: 'cf:selectedResumeHtml',       // Optimized HTML version
    autopilot: 'cf:autopilotReady',          // Autopilot status
    location: 'cf:location',                 // Extracted location
    keywords: 'cf:keywords'                  // Extracted keywords
  } as const;

  /**
   * Store resume in all required locations for cross-component access
   */
  static store(resumeData: StoredResume): void {
    try {
      const serialized = JSON.stringify(resumeData);
      
      // Primary storage (Career Finder standard)
      localStorage.setItem(this.KEYS.current, serialized);
      
      // Legacy compatibility (for existing components)
      localStorage.setItem(this.KEYS.legacy, serialized);
      
      // Mark autopilot as ready if resume has meaningful content
      if (resumeData.extractedText?.length > 100) {
        localStorage.setItem(this.KEYS.autopilot, '1');
      }
      
      console.log('[RESUME_MANAGER] ✅ Stored resume in all locations:', {
        filename: resumeData.originalFileName,
        textLength: resumeData.extractedText?.length,
        method: resumeData.extractionMethod
      });
    } catch (error) {
      console.error('[RESUME_MANAGER] ❌ Storage failed:', error);
      throw error;
    }
  }

  /**
   * Load resume from any available location with automatic fallback
   */
  static load(): StoredResume | null {
    try {
      // Priority 1: Primary key (cf:resume)
      let stored = localStorage.getItem(this.KEYS.current);
      if (stored) {
        console.log('[RESUME_MANAGER] Found resume in primary key (cf:resume)');
        return JSON.parse(stored);
      }
      
      // Priority 2: Legacy key (uploadedResume)
      stored = localStorage.getItem(this.KEYS.legacy);
      if (stored) {
        console.log('[RESUME_MANAGER] Found resume in legacy key (uploadedResume), upgrading...');
        const parsed = JSON.parse(stored);
        // Upgrade to new key
        this.store(parsed);
        return parsed;
      }
      
      console.warn('[RESUME_MANAGER] No resume found in localStorage');
      return null;
    } catch (error) {
      console.error('[RESUME_MANAGER] Load failed:', error);
      return null;
    }
  }

  /**
   * Get just the extracted text (most common use case)
   */
  static getText(): string {
    const resume = this.load();
    return resume?.extractedText || '';
  }

  /**
   * Check if resume is available and has meaningful content
   */
  static isAvailable(): boolean {
    return this.getText().length > 100;
  }

  /**
   * Get resume metadata without full text
   */
  static getMetadata(): Pick<StoredResume, 'originalFileName' | 'uploadedAt' | 'extractionMethod'> | null {
    const resume = this.load();
    if (!resume) return null;
    
    return {
      originalFileName: resume.originalFileName,
      uploadedAt: resume.uploadedAt,
      extractionMethod: resume.extractionMethod
    };
  }

  /**
   * Store extracted signals (location and keywords)
   */
  static storeSignals(location: string | null, keywords: string[]): void {
    try {
      if (location) {
        localStorage.setItem(this.KEYS.location, location);
      }
      if (keywords.length > 0) {
        localStorage.setItem(this.KEYS.keywords, keywords.slice(0, 5).join(', '));
      }
      console.log('[RESUME_MANAGER] Stored signals:', { location, keywordCount: keywords.length });
    } catch (error) {
      console.error('[RESUME_MANAGER] Failed to store signals:', error);
    }
  }

  /**
   * Get stored location
   */
  static getLocation(): string | null {
    try {
      return localStorage.getItem(this.KEYS.location);
    } catch {
      return null;
    }
  }

  /**
   * Get stored keywords
   */
  static getKeywords(): string {
    try {
      return localStorage.getItem(this.KEYS.keywords) || '';
    } catch {
      return '';
    }
  }

  /**
   * Clear all resume data (logout, reset, etc.)
   */
  static clear(): void {
    Object.values(this.KEYS).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`[RESUME_MANAGER] Failed to remove ${key}:`, e);
      }
    });
    console.log('[RESUME_MANAGER] Cleared all resume data');
  }

  /**
   * Get autopilot status
   */
  static isAutopilotReady(): boolean {
    try {
      return localStorage.getItem(this.KEYS.autopilot) === '1';
    } catch {
      return false;
    }
  }

  /**
   * Fetch resume from database as fallback
   */
  static async fetchFromDatabase(): Promise<StoredResume | null> {
    try {
      console.log('[RESUME_MANAGER] Fetching resume from database...');
      const response = await fetch('/api/resume/list');
      
      if (!response.ok) {
        console.warn('[RESUME_MANAGER] Database fetch failed:', response.status);
        return null;
      }
      
      const data = await response.json();
      const resume = data?.resumes?.[0];
      
      if (resume && resume.extractedText) {
        console.log('[RESUME_MANAGER] Found resume in database, caching locally');
        // Store in localStorage for future access
        this.store(resume);
        return resume;
      }
      
      console.warn('[RESUME_MANAGER] No resume found in database');
      return null;
    } catch (error) {
      console.error('[RESUME_MANAGER] Database fetch error:', error);
      return null;
    }
  }

  /**
   * Load with automatic database fallback
   */
  static async loadWithFallback(): Promise<StoredResume | null> {
    // Try localStorage first
    const localResume = this.load();
    if (localResume) return localResume;
    
    // Fallback to database
    return await this.fetchFromDatabase();
  }

  /**
   * Debug helper: Show all stored resume keys
   */
  static debug(): void {
    console.group('[RESUME_MANAGER] Debug Info');
    Object.entries(this.KEYS).forEach(([name, key]) => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const preview = value.length > 100 ? `${value.slice(0, 100)}...` : value;
          console.log(`${name} (${key}):`, preview);
        } else {
          console.log(`${name} (${key}):`, '❌ Not found');
        }
      } catch (e) {
        console.log(`${name} (${key}):`, '❌ Error:', e);
      }
    });
    console.groupEnd();
  }
}

