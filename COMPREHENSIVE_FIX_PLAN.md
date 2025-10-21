# 🔧 Comprehensive Fix Plan - All Remaining Issues

## Analysis of Errors from Logs

### ✅ ALREADY FIXED:
1. **Email Domain Error** - Fixed with `onboarding@resend.dev`
2. **Cover Letter Hallucination** - Years calculation already implemented (line 203 in generate/route.ts)
3. **Job Cache Description Validation** - Changed to `required: false`

### 🔴 STILL BROKEN - NEED TO FIX:

---

## Issue #1: Only 7 Jobs Returned Instead of 50

**Current Behavior:**
```
[JOB_SEARCH] Standard search returned type: object, isArray: true, length: 7
[JOB_CACHE] ✅ Cached 7 jobs for future searches
```

**Root Cause:**
- Perplexity API is returning truncated JSON
- `maxTokens` calculation: `limit * 150 = 7500` tokens
- JSON gets cut off mid-response
- Only 7 complete job objects parsed

**Fix Required:**
1. Increase `maxTokens` significantly
2. Use `sonar-pro` model which supports more tokens
3. Add retry logic if JSON is truncated
4. Request jobs in batches if needed

**Files to Modify:**
- `src/lib/perplexity-intelligence.ts` (line 692)

---

## Issue #2: Generic Company Names ("Various Auto")

**Current Behavior:**
Jobs have generic/placeholder company names instead of real companies

**Root Cause:**
- Perplexity prompt doesn't emphasize EXACT company names
- No validation to reject generic names
- Filtering happens but AFTER caching

**Fix Required:**
1. Update Perplexity prompt to demand exact company names
2. Add validation BEFORE caching
3. Reject jobs with generic names: "Various", "Confidential", "Multiple"
4. Request company domain/website to verify authenticity

**Files to Modify:**
- `src/lib/perplexity-intelligence.ts` (line 632-680 - system prompt)
- `src/app/api/jobs/search/route.ts` (line 334-371 - filtering logic)

---

## Issue #3: MongoDB Validation Errors (Multiple Jobs)

**Current Behavior:**
```
'jobs.0.description': ValidatorError: Path `description` is required.
'jobs.1.description': ValidatorError: Path `description` is required.
...through jobs.6.description
```

**Root Cause:**
- Changed `required: false` but pre-save hook might not be working
- Jobs are being saved with empty descriptions BEFORE hook runs
- Need to ensure default value is applied

**Fix Required:**
1. Verify pre-save hook is actually running
2. Add explicit default in the save operation
3. Filter out jobs with empty descriptions BEFORE saving
4. Add validation in job-search-cache.service.ts

**Files to Modify:**
- `src/models/JobSearchCache.ts` (verify pre-save hook)
- `src/services/job-search-cache.service.ts` (add validation)

---

## Issue #4: Resume Optimizer Still Shows Raw HTML

**Current Behavior:**
User reports HTML code is still visible in resume preview

**Root Cause:**
- Need to verify if BaseTemplate is actually being used
- Inline styles might not be applied correctly
- HTML escaping might still be happening

**Fix Required:**
1. Check if formatResumeAsHTML is still using old method
2. Verify BaseTemplate has ALL inline styles (no Tailwind)
3. Ensure HTML is unescaped before rendering in iframe
4. Test with actual resume upload

**Files to Check:**
- `src/lib/resume-formatters.ts`
- `src/components/resume-templates/BaseTemplate.tsx`
- `src/app/career-finder/optimizer/page.tsx`

---

## Issue #5: Perplexity Token Limits

**Current Behavior:**
JSON responses are truncated, causing incomplete job lists

**Root Cause:**
- `maxTokens: Math.min(limit * 150, 8000)` is too conservative
- Sonar-pro supports up to 16,000 tokens
- Need to request more tokens for complete responses

**Fix Required:**
1. Increase maxTokens to 12,000-16,000
2. Add JSON validation and retry logic
3. Request jobs in smaller batches if needed
4. Better error handling for truncated responses

**Files to Modify:**
- `src/lib/perplexity-intelligence.ts` (line 692)

---

## 🎯 Priority Order for Fixes

### **CRITICAL (Do First):**
1. **Fix Job Count** - Increase tokens, fix truncation
2. **Fix Generic Companies** - Update prompt, add validation
3. **Fix MongoDB Errors** - Verify pre-save hook, add filtering

### **HIGH (Do Second):**
4. **Verify Resume Optimizer** - Test with real upload, check HTML rendering
5. **Test Cover Letter** - Verify years calculation is working

### **MEDIUM (Do Third):**
6. **Improve Error Handling** - Add retry logic, better logging
7. **Add Monitoring** - Track success rates, identify patterns

---

## 📝 Detailed Fix Implementation

### Fix #1: Increase Job Count to 50

**File:** `src/lib/perplexity-intelligence.ts`

**Current Code (line 692):**
```typescript
maxTokens: Math.min(limit * 150, 8000)
```

**Fixed Code:**
```typescript
maxTokens: Math.min(limit * 200, 16000) // Increased for sonar-pro
```

**Also Update (line 693):**
```typescript
model: 'sonar-pro' // Already correct
```

**Add Retry Logic:**
```typescript
// After line 732, add:
if (arr.length < limit * 0.5) {
  console.warn(`[PERPLEXITY] Only got ${arr.length} jobs, expected ${limit}. Retrying...`)
  // Retry with higher token limit
}
```

---

### Fix #2: Reject Generic Company Names

**File:** `src/lib/perplexity-intelligence.ts`

**Update System Prompt (line 632-680):**
```typescript
const SYSTEM_JOBS = `You are an advanced Job Listings Aggregator with real-time web access across 25+ Canadian and global job boards.

CRITICAL REQUIREMENTS:
1. **EXACT COMPANY NAMES ONLY** - Do NOT use generic names like:
   - "Various Employers"
   - "Confidential Company"
   - "Multiple Companies"
   - "Various Auto"
   - "Various [Industry]"
   - "Undisclosed"
   - "Private"
   
2. **VERIFY COMPANY EXISTS** - Include company website/domain when available

3. **REJECT INVALID LISTINGS** - Skip jobs that don't have:
   - Real, specific company name
   - Actual job title (not "Various Positions")
   - Valid location (not "Various Locations")

... rest of prompt
```

---

### Fix #3: MongoDB Validation - Ensure Pre-Save Hook Works

**File:** `src/services/job-search-cache.service.ts`

**Add Validation Before Saving:**
```typescript
async cacheSearchResults(searchParams, jobs) {
  // CRITICAL: Filter and validate jobs BEFORE saving
  const validJobs = jobs.filter(job => {
    // Ensure description exists
    if (!job.description || job.description.trim() === '') {
      job.description = 'No description available'
    }
    
    // Ensure all required fields exist
    return job.jobId && job.title && job.company && job.location && job.url && job.source
  })
  
  console.log(`[JOB_CACHE] Filtered ${jobs.length - validJobs.length} invalid jobs`)
  
  // Save with validated jobs
  await JobSearchCache.create({
    ...searchParams,
    jobs: validJobs
  })
}
```

---

### Fix #4: Resume Optimizer HTML Display

**Need to Test:**
1. Upload a resume
2. Check if HTML tags are visible
3. Verify inline styles are applied
4. Check PDF generation

**If Still Broken, Update:**

**File:** `src/app/career-finder/optimizer/page.tsx`

**Ensure HTML is properly unescaped:**
```typescript
const formatResumeWithTemplate = (text: string, personalInfo, templateId) => {
  // ... existing code ...
  
  // CRITICAL: Unescape HTML entities
  html = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
  
  // CRITICAL: Ensure proper DOCTYPE
  if (!html.includes('<!DOCTYPE html>')) {
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
</head>
<body>
${html}
</body>
</html>`
  }
  
  return html
}
```

---

## 🧪 Testing Checklist

After implementing fixes:

- [ ] Job search returns 40-50 jobs (not 7)
- [ ] All company names are real/specific (no "Various")
- [ ] No MongoDB validation errors in logs
- [ ] Resume displays cleanly (no HTML code visible)
- [ ] Cover letter has correct years (not "38 years")
- [ ] Email sends successfully
- [ ] No console errors during full user flow

---

## 📊 Success Metrics

**Job Search:**
- ✅ Returns 40-50 jobs per search
- ✅ All jobs have real company names
- ✅ All jobs have descriptions
- ✅ No validation errors

**Resume Optimizer:**
- ✅ No HTML code visible
- ✅ Clean, professional formatting
- ✅ Inline styles applied correctly
- ✅ PDF generation works

**Cover Letter:**
- ✅ Correct years of experience
- ✅ Professional tone
- ✅ No hallucinations

**Email:**
- ✅ Sends successfully
- ✅ Attachments included
- ✅ No domain errors

---

## 🚀 Implementation Order

1. **Fix Perplexity Token Limits** (15 min)
2. **Update Company Name Validation** (20 min)
3. **Fix MongoDB Pre-Save Hook** (15 min)
4. **Test Resume Optimizer** (10 min)
5. **End-to-End Testing** (30 min)
6. **Commit and Deploy** (10 min)

**Total Time: ~2 hours**

---

## ⚠️ Critical Notes

- The cover letter years calculation is ALREADY implemented (line 203)
- The email domain fix is ALREADY applied
- The main issues are: job count, generic names, and validation errors
- Need to TEST each fix before moving to next one
- Don't skip the testing phase!
