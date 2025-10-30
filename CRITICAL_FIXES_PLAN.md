# 🚨 CRITICAL FIXES - Production Ready Checklist

## Status: IN PROGRESS
**Date**: October 30, 2025  
**Priority**: CRITICAL - Must fix before launch

---

## 🎯 Issues to Fix

### 1. ✅ DONE: JobAggregator Integration
- [x] Replace Perplexity with JobAggregator in `/api/jobs/search`
- [x] Supabase searches first (1,249 jobs)
- [x] Fallback to scrapers if < 10 jobs
- [x] Perplexity as last resort

**Commit**: `d416955` - CRITICAL: Replace Perplexity with JobAggregator

---

### 2. ❌ TODO: Company Names Missing from Supabase Jobs

**Problem**: Jobs show generic names like "Major Canadian Bank" instead of real company names

**Root Cause**: Supabase jobs may have missing or generic company data

**Fix Required**:
1. Check Supabase data quality - verify `company` field
2. If data is bad, re-scrape with better extraction
3. Add validation to reject jobs without real company names

**Files to Check**:
- `src/lib/supabase-bulk-download.ts` - Bulk download logic
- `src/lib/supabase.ts` - Query logic
- Supabase table: `jobs.company` column

---

### 3. ❌ TODO: CSS - File Folder Card Separation

**Problem**: Gap/separation at top of colored file folder job cards

**Visual**: See screenshots - cards should be seamless folder design

**Fix Required**:
1. Find job card component
2. Fix CSS for folder-style design
3. Remove gap/border at top
4. Ensure smooth gradient/color transition

**Files to Check**:
- `src/components/career-finder/` - Job card components
- `src/app/career-finder/search/page.tsx` - Search results display
- CSS/Tailwind classes for job cards

---

### 4. ❌ TODO: Status Bar Text Overflow

**Problem**: Text in status badges doesn't fit in boxes

**Visual**: "✨ 6 New", "💾 3 Cached" text overflowing

**Fix Required**:
1. Find status bar component
2. Adjust padding/font size
3. Use `truncate` or `text-ellipsis`
4. Make responsive for mobile

**Files to Check**:
- `src/app/career-finder/search/page.tsx` - Status badges
- Status bar component (if separate)

---

### 5. ❌ TODO: Job URLs Not Searchable

**Problem**: Generic URLs like `https://ca.indeed.com/viewjob?jk=salesconsultantnpwr`

**Root Cause**: Perplexity/scrapers generating fake/generic URLs

**Fix Required**:
1. Validate job URLs before insertion
2. Reject jobs with fake/generic URLs
3. Ensure Supabase jobs have real, working URLs
4. Add URL validation in `validateJob` function

**Files to Fix**:
- `src/lib/validators/job-validator.ts` - Add URL validation
- `src/lib/supabase-bulk-download.ts` - Validate before insert

---

## 📋 Fix Order (Priority)

1. **Company Names** - Most critical, makes app unusable
2. **Job URLs** - Critical for user research
3. **CSS File Folders** - Visual polish, important for UX
4. **Status Bar Overflow** - Minor visual issue

---

## 🔍 Investigation Steps

### Step 1: Check Supabase Data Quality
```sql
-- Check company names in Supabase
SELECT company, COUNT(*) as count 
FROM jobs 
GROUP BY company 
ORDER BY count DESC 
LIMIT 20;

-- Check for generic/bad company names
SELECT * FROM jobs 
WHERE company LIKE '%Bank%' 
   OR company LIKE '%Company%'
   OR company LIKE '%Dealership%'
LIMIT 10;
```

### Step 2: Check Job URLs
```sql
-- Check URL patterns
SELECT DISTINCT source, url 
FROM jobs 
LIMIT 20;

-- Find fake URLs
SELECT * FROM jobs 
WHERE url LIKE '%viewjob?jk=%' 
   OR url LIKE '%job/%'
   OR url NOT LIKE 'https://%'
LIMIT 10;
```

---

## ✅ Success Criteria

- [ ] All jobs have real, identifiable company names
- [ ] All job URLs are valid and clickable
- [ ] Job cards display as seamless colored folders
- [ ] Status badges fit text properly on all screen sizes
- [ ] 50+ jobs returned from Supabase on search
- [ ] No Perplexity calls unless Supabase returns < 10 jobs

---

## 🚀 Next Actions

1. Investigate Supabase data quality
2. Fix company name extraction in bulk download
3. Add URL validation
4. Fix CSS for job cards
5. Fix status bar overflow
6. Test end-to-end
7. Deploy

---

**Target Completion**: Today (October 30, 2025)
**Estimated Time**: 3-4 hours
