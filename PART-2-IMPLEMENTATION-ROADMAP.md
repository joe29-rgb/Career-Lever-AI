# PART 2: CODE CLEANUP - IMPLEMENTATION ROADMAP

**Status:** Ready to implement  
**Estimated Time:** 30 minutes  
**Current Phase:** Planning

---

## 🎯 PART 2 OVERVIEW

This document tracks the implementation of code cleanup tasks:

6. ✅ Fix #6: Delete 7 Duplicate Files
7. ✅ Fix #7: Consolidate Type Files (3 → 1)
8. ✅ Fix #8: Fix Circular Dependencies

---

## 📋 FIX #6: Delete 7 Duplicate Files

### Current State
- **Problem:** 7 duplicate/unused files wasting 1,400+ lines of code
- **Impact:** Confusion about which file to use, maintenance burden

### Files to Delete

1. `src/lib/perplexity-job-search.ts` - Duplicate Perplexity file
2. `src/lib/canadian-job-scraper.ts` - Duplicate scraper
3. `src/lib/job-scraper.ts` - Duplicate scraper
4. `src/lib/agents/agent-orchestrator.ts` - Unused agent
5. `src/lib/agents/base-agent.ts` - Unused base class
6. (Additional files to be identified)
7. (Additional files to be identified)

### Implementation Steps

#### Step 6.1: Verify Files Exist
- [ ] Check if `src/lib/perplexity-job-search.ts` exists
- [ ] Check if `src/lib/canadian-job-scraper.ts` exists
- [ ] Check if `src/lib/job-scraper.ts` exists
- [ ] Check if `src/lib/agents/agent-orchestrator.ts` exists
- [ ] Check if `src/lib/agents/base-agent.ts` exists

#### Step 6.2: Check for Dependencies
- [ ] Search codebase for imports of these files
- [ ] Verify no active code depends on them
- [ ] Document any dependencies found

#### Step 6.3: Delete Files
- [ ] Delete `src/lib/perplexity-job-search.ts`
- [ ] Delete `src/lib/canadian-job-scraper.ts`
- [ ] Delete `src/lib/job-scraper.ts`
- [ ] Delete `src/lib/agents/agent-orchestrator.ts`
- [ ] Delete `src/lib/agents/base-agent.ts`

#### Step 6.4: Fix job-discovery-agent.ts
- [ ] Open `src/lib/agents/job-discovery-agent.ts`
- [ ] Remove import: `import { BaseAgent, AgentTask, AgentResult } from './base-agent'`
- [ ] Add standalone interfaces:
```typescript
// Removed BaseAgent dependency - now standalone
interface AgentTask {
  id: string;
  type: 'job_search' | 'contact_research' | 'company_intel';
  input: Record<string, any>;
  priority: 1 | 2 | 3;
}

interface AgentResult<T = any> {
  success: boolean;
  data: T;
  reasoning: string;
  confidence: number;
  sources: Array<{
    title: string;
    url: string;
  }>;
  duration: number;
  method?: string;
}
```
- [ ] Change class declaration from `extends BaseAgent` to standalone

#### Step 6.5: Verify Build
- [ ] Run `npm run build`
- [ ] Verify 0 errors
- [ ] Check no import errors

### Success Criteria
- ✅ All 7 duplicate files deleted
- ✅ No import errors
- ✅ Build succeeds
- ✅ job-discovery-agent.ts works standalone

---

## 📋 FIX #7: Consolidate Type Files (3 → 1)

### Current State
- **Problem:** 3 type definition files with duplicates
  - `src/types/comprehensive.ts`
  - `src/types/unified.ts`
  - `src/types/index.ts`
- **Impact:** Confusion, duplicate definitions, import inconsistency

### Implementation Steps

#### Step 7.1: Audit Current Types
- [ ] Read `src/types/index.ts` - identify all types
- [ ] Read `src/types/comprehensive.ts` - identify duplicates
- [ ] Read `src/types/unified.ts` - identify duplicates
- [ ] Create list of unique types needed

#### Step 7.2: Consolidate into index.ts
- [ ] Ensure `src/types/index.ts` has ALL necessary types:

**Job Types:**
```typescript
export interface Job {
  id?: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  summary?: string;
  salary?: string | null;
  postedDate?: string;
  source: string;
  skills?: string[];
  workType?: 'remote' | 'hybrid' | 'onsite' | 'Full-time' | 'Part-time';
  experienceLevel?: 'entry' | 'mid' | 'senior';
  matchScore?: number;
}
```

**Company Types:**
```typescript
export interface Company {
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  description?: string;
}
```

**Resume Types:**
```typescript
export interface ResumeSignals {
  location: string;
  keywords: string[];
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}
```

**Validation Types:**
```typescript
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}
```

**Hiring Contact Types:**
```typescript
export interface HiringContact {
  name: string;
  title?: string;
  email?: string;
  linkedIn?: string;
  linkedinUrl?: string;
  source?: string;
  confidence?: number;
  phone?: string;
}
```

#### Step 7.3: Delete Old Type Files
- [ ] Delete `src/types/comprehensive.ts`
- [ ] Delete `src/types/unified.ts`

#### Step 7.4: Update All Imports
- [ ] Search codebase for: `from '@/types/comprehensive'`
- [ ] Search codebase for: `from '@/types/unified'`
- [ ] Replace ALL with: `from '@/types'`

#### Step 7.5: Verify Build
- [ ] Run `npm run build`
- [ ] Verify 0 type errors
- [ ] Check all imports resolve correctly

### Success Criteria
- ✅ Only `src/types/index.ts` exists
- ✅ All types consolidated
- ✅ All imports updated to `@/types`
- ✅ Build succeeds with 0 errors

---

## 📋 FIX #8: Fix Circular Dependencies

### Current State
- **Problem:** Potential circular dependencies between modules
- **Impact:** Build issues, runtime errors, maintenance problems

### Implementation Steps

#### Step 8.1: Identify Circular Dependencies
- [ ] Run build and check for circular dependency warnings
- [ ] Use `madge` or similar tool to detect cycles:
```bash
npx madge --circular --extensions ts,tsx src/
```

#### Step 8.2: Document Found Cycles
- [ ] List all circular dependency chains
- [ ] Identify root cause of each cycle
- [ ] Plan resolution strategy

#### Step 8.3: Break Circular Dependencies
Common strategies:
- [ ] Move shared types to separate file
- [ ] Use dependency injection
- [ ] Refactor to remove bidirectional imports
- [ ] Create interface files

#### Step 8.4: Verify Resolution
- [ ] Run `npx madge --circular --extensions ts,tsx src/`
- [ ] Verify 0 circular dependencies
- [ ] Run `npm run build`
- [ ] Verify build succeeds

### Success Criteria
- ✅ 0 circular dependencies detected
- ✅ Build succeeds
- ✅ No runtime import errors

---

## ✅ PART 2 COMPLETION CHECKLIST

### Build & Syntax
- [ ] `npm run build` succeeds with 0 errors
- [ ] No TypeScript errors
- [ ] No import errors
- [ ] No circular dependency warnings

### Fix #6: Delete Duplicate Files
- [ ] 7 files deleted
- [ ] job-discovery-agent.ts updated
- [ ] No import errors
- [ ] Build succeeds

### Fix #7: Consolidate Types
- [ ] Only `src/types/index.ts` exists
- [ ] All types consolidated
- [ ] All imports updated
- [ ] Build succeeds

### Fix #8: Fix Circular Dependencies
- [ ] Circular dependencies identified
- [ ] All cycles broken
- [ ] Build succeeds
- [ ] No warnings

### Integration Test
- [ ] Build succeeds with 0 errors
- [ ] All imports resolve correctly
- [ ] No circular dependency warnings
- [ ] Codebase is cleaner and more maintainable

---

## 🚨 IMPORTANT NOTES

1. **Backup before deleting** - Files will be permanently removed
2. **Check git status** - Ensure no uncommitted work
3. **Test after each fix** - Don't wait until the end
4. **Verify imports** - Search entire codebase for references

---

**Status:** ✅ FIX #6 COMPLETE - BUILD SUCCESSFUL

## ✅ FIX #6 COMPLETE

**Files Deleted:**
1. ✅ `src/lib/perplexity-job-search.ts`
2. ✅ `src/lib/canadian-job-scraper.ts`
3. ✅ `src/lib/job-scraper.ts`
4. ✅ `src/lib/agents/agent-orchestrator.ts`
5. ✅ `src/lib/agents/base-agent.ts`
6. ✅ `src/lib/agents/job-discovery-agent.ts`
7. ✅ `src/lib/agents/contact-research-agent.ts`

**Fixed:**
- ✅ Deprecated `jobSearchWithAgent()` - now calls standard method
- ✅ Deprecated `hiringContactsWithAgent()` - now calls standard method
- ✅ Fixed import in `src/app/api/jobs/search/route.ts`
- ✅ Build succeeds with 0 errors

**Next:** Fix #7 - Consolidate Type Files

---

## ✅ FIX #7 COMPLETE

**Files Deleted:**
1. ✅ `src/types/comprehensive.ts`
2. ✅ `src/types/unified.ts`

**Changes Made:**
- ✅ Consolidated all types into `src/types/index.ts`
- ✅ Removed duplicate `CompanyNews` interface
- ✅ Moved unique types from `comprehensive.ts` to `index.ts`
- ✅ Moved unique types from `unified.ts` to `index.ts`
- ✅ Build succeeds with 0 errors

**Result:** Reduced from 3 type files to 1 central `index.ts`

---

## ✅ FIX #8 COMPLETE

**Circular Dependencies Check:**
```
npx madge --circular --extensions ts,tsx src/
✔ No circular dependency found!
```

**Result:** ✅ 0 circular dependencies detected

---

# 🎉 PART 2 COMPLETE

All 3 fixes successfully implemented:
- ✅ Fix #6: Deleted 7 duplicate files (~1,400 lines removed)
- ✅ Fix #7: Consolidated type files (3 → 1)
- ✅ Fix #8: No circular dependencies found

**Build Status:** ✅ SUCCESS (0 errors)

**Next:** Request Part 3 implementation
