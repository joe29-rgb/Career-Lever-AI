# Career Finder Autopilot - Cost-Efficient Implementation

## Overview

The Autopilot system minimizes Perplexity API calls by caching all AI-generated data and reusing it across the 7-step Career Finder wizard.

**Total Perplexity API calls per complete flow: 6**
- 1 call: `extractResumeSignals()` (on resume upload)
- 1 call: `comprehensiveJobResearch()` (triggered after job selection)
- 1 call: `generateResumeVariants()` (Step 5)
- 1 call: `generateCoverLetters()` (Step 6)
- 1 call: `generateEmailOutreach()` (Step 7)
- 1 call: Job listings search (Step 2)

## Architecture

### Caching Strategy

**Two-tier caching:**
1. **MongoDB (Resume model)** - Persistent server-side cache
2. **localStorage (CareerFinderStorage)** - Fast client-side cache

### Data Flow

```
Step 1: Resume Upload
  ↓
  Extract PDF → Clean text → Save to DB
  ↓
  [Optional] Trigger autopilot → Extract signals + Comprehensive research
  ↓
  Cache in Resume.resumeSignals + Resume.comprehensiveResearch

Step 2: Job Search
  ↓
  Read Resume.resumeSignals from cache
  ↓
  Search jobs (1 API call, cached)

Step 3: Job Analysis
  ↓
  Read Resume.comprehensiveResearch.jobAnalysis
  ↓
  NO API CALL (uses cached data)

Step 4: Company Insights
  ↓
  Read Resume.comprehensiveResearch (companyIntel, hiringContacts, news, reviews)
  ↓
  NO API CALL (uses cached data)

Step 5: Resume Optimizer
  ↓
  Call generateResumeVariants() ONCE
  ↓
  Cache in Resume.resumeVariants + localStorage

Step 6: Cover Letters
  ↓
  Call generateCoverLetters() ONCE
  ↓
  Cache in Resume.coverLetters + localStorage

Step 7: Email Outreach
  ↓
  Call generateEmailOutreach() ONCE
  ↓
  Cache in Resume.emailOutreach + localStorage
```

## Implementation

### 1. Resume Model (Extended)

**File:** `src/models/Resume.ts`

Added autopilot cache fields:
```typescript
{
  resumeSignals?: {
    keywords: string[]
    location?: string
    locations?: string[]
  }
  comprehensiveResearch?: any  // Full research data
  comprehensiveResearchAt?: Date
  resumeVariants?: {
    variantA: string
    variantB: string
    recommendations: string[]
    generatedAt: Date
  }
  coverLetters?: {
    variantA: string
    variantB: string
    personalization: string[]
    generatedAt: Date
  }
  emailOutreach?: {
    subjects: string[]
    templates: Array<{ type: string; body: string }>
    mailtoLink: string
    generatedAt: Date
  }
}
```

### 2. Autopilot Trigger Endpoint

**File:** `src/app/api/career-finder/autopilot/route.ts`

**Purpose:** Called after resume upload to pre-compute all AI data

**Request:**
```typescript
POST /api/career-finder/autopilot
{
  resumeId: string
  jobTitle?: string      // Optional: if job already selected
  company?: string       // Optional: if job already selected
  jobDescription?: string // Optional: if job already selected
}
```

**Response:**
```typescript
{
  success: true
  signals: {
    keywords: string[]
    location: string
  }
  comprehensiveResearch?: {
    jobAnalysis: { ... }
    companyIntel: { ... }
    hiringContacts: [ ... ]
    news: [ ... ]
    reviews: [ ... ]
  }
  message: "Autopilot data prepared and cached"
}
```

**What it does:**
1. Fetches resume from DB
2. Calls `extractResumeSignals()` → 1 API call
3. If job details provided, calls `comprehensiveJobResearch()` → 1 API call
4. Saves everything to Resume document
5. Returns cached data

### 3. Existing API Routes (Already Implemented)

**Resume Optimizer:**
- **File:** `src/app/api/resume/optimize/route.ts`
- **Calls:** `generateResumeVariants()` → 1 API call
- **Caching:** Frontend should save to localStorage after calling

**Cover Letter Generator:**
- **File:** `src/app/api/cover-letter/generate-v2/route.ts`
- **Calls:** `generateCoverLetters()` → 1 API call
- **Caching:** Frontend should save to localStorage after calling

**Email Outreach:**
- **File:** `src/app/api/contacts/email-outreach/route.ts`
- **Calls:** `generateEmailOutreach()` → 1 API call
- **Caching:** Frontend should save to localStorage after calling

## Frontend Integration

### Step 1: Resume Upload Page

**File:** `src/app/career-finder/resume/page.tsx`

**After successful upload:**
```typescript
// 1. Upload resume
const uploadResponse = await fetch('/api/resume/upload', {
  method: 'POST',
  body: formData
})
const { resumeId } = await uploadResponse.json()

// 2. Trigger autopilot (optional - can wait until job selected)
const autopilotResponse = await fetch('/api/career-finder/autopilot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ resumeId })
})
const { signals } = await autopilotResponse.json()

// 3. Cache signals in localStorage
CareerFinderStorage.setKeywords(signals.keywords)
CareerFinderStorage.setLocation(signals.location)
```

### Step 2: Job Search Page

**File:** `src/app/career-finder/search/page.tsx`

**Use cached signals:**
```typescript
const keywords = CareerFinderStorage.getKeywords()
const location = CareerFinderStorage.getLocation()

// Search jobs using cached data (no resume signal extraction needed)
const jobs = await searchJobs({ keywords, location })
```

### Step 3: Job Analysis Page

**File:** `src/app/career-finder/job-analysis/page.tsx`

**Load from cache:**
```typescript
// Option 1: Load from localStorage (if cached)
const cached = localStorage.getItem('comprehensiveResearch')
if (cached) {
  const research = JSON.parse(cached)
  setJobAnalysis(research.jobAnalysis)
}

// Option 2: Fetch from Resume document
const resume = await fetch('/api/resume/list').then(r => r.json())
if (resume.resumes[0].comprehensiveResearch) {
  setJobAnalysis(resume.resumes[0].comprehensiveResearch.jobAnalysis)
}
```

### Step 4: Company Insights Page

**File:** `src/app/career-finder/company/page.tsx`

**Load from cache:**
```typescript
const resume = await fetch('/api/resume/list').then(r => r.json())
const research = resume.resumes[0].comprehensiveResearch

setCompanyIntel(research.companyIntel)
setHiringContacts(research.hiringContacts)
setNews(research.news)
setReviews(research.reviews)
```

### Step 5: Resume Optimizer Page

**File:** `src/app/career-finder/optimizer/page.tsx`

**Generate once, cache forever:**
```typescript
// Check cache first
const cached = localStorage.getItem('resumeVariants')
if (cached) {
  setVariants(JSON.parse(cached))
  return
}

// Generate if not cached
const response = await fetch('/api/resume/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resumeText,
    jobTitle,
    jobRequirements,
    companyInsights
  })
})
const { data } = await response.json()

// Cache for future use
localStorage.setItem('resumeVariants', JSON.stringify(data))
setVariants(data)
```

### Step 6: Cover Letter Page

**File:** `src/app/career-finder/cover-letter/page.tsx`

**Generate once, cache forever:**
```typescript
const cached = localStorage.getItem('coverLetters')
if (cached) {
  setLetters(JSON.parse(cached))
  return
}

const response = await fetch('/api/cover-letter/generate-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobTitle,
    company,
    resumeText,
    companyInsights,
    hiringManager
  })
})
const { data } = await response.json()

localStorage.setItem('coverLetters', JSON.stringify(data))
setLetters(data)
```

### Step 7: Email Outreach Page

**File:** `src/app/career-finder/outreach/page.tsx`

**Generate once, cache forever:**
```typescript
const cached = localStorage.getItem('emailOutreach')
if (cached) {
  setEmailData(JSON.parse(cached))
  return
}

const response = await fetch('/api/contacts/email-outreach', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hiringContact,
    jobTitle,
    company,
    resumeHighlights
  })
})
const { data } = await response.json()

localStorage.setItem('emailOutreach', JSON.stringify(data))
setEmailData(data)
```

## Cost Savings Analysis

### Before Autopilot (Inefficient)
- Resume upload: 1 call (extractResumeSignals)
- Job search: 1 call (search)
- Job analysis: 1 call (analyze job)
- Company insights: 3 calls (company research, news, reviews)
- Resume optimizer: 1 call per variant (2 calls)
- Cover letter: 1 call per variant (2 calls)
- Email outreach: 1 call
- **Total: 12+ calls per flow**
- **Refreshing pages: Additional calls each time**

### After Autopilot (Efficient)
- Resume upload + autopilot: 2 calls (signals + comprehensive research)
- Job search: 1 call (cached)
- Job analysis: 0 calls (uses cached comprehensive research)
- Company insights: 0 calls (uses cached comprehensive research)
- Resume optimizer: 1 call (cached after first generation)
- Cover letter: 1 call (cached after first generation)
- Email outreach: 1 call (cached after first generation)
- **Total: 6 calls per flow**
- **Refreshing pages: 0 additional calls (all cached)**

**Savings: 50% reduction in API calls + zero redundant calls on refresh**

## Cache Invalidation

### When to Clear Cache

**Resume changes:**
```typescript
// Clear all cached data when user uploads new resume
CareerFinderStorage.clearAll()
await Resume.updateOne(
  { _id: resumeId },
  { 
    $unset: { 
      resumeSignals: 1,
      comprehensiveResearch: 1,
      resumeVariants: 1,
      coverLetters: 1,
      emailOutreach: 1
    }
  }
)
```

**Job changes:**
```typescript
// Clear job-specific cache when user selects different job
localStorage.removeItem('comprehensiveResearch')
localStorage.removeItem('resumeVariants')
localStorage.removeItem('coverLetters')
localStorage.removeItem('emailOutreach')
```

**TTL (Time To Live):**
- Resume signals: 30 days (rarely changes)
- Comprehensive research: 7 days (company data can change)
- Resume variants: 7 days (tied to specific job)
- Cover letters: 7 days (tied to specific job)
- Email outreach: 7 days (tied to specific job)

## Testing

### Test Autopilot Flow

1. **Upload resume:**
   ```bash
   POST /api/resume/upload
   # Returns: { resumeId: "..." }
   ```

2. **Trigger autopilot:**
   ```bash
   POST /api/career-finder/autopilot
   {
     "resumeId": "...",
     "jobTitle": "Software Engineer",
     "company": "Google",
     "jobDescription": "..."
   }
   # Returns: { signals: {...}, comprehensiveResearch: {...} }
   ```

3. **Verify cache:**
   ```bash
   GET /api/resume/list
   # Check: resume.resumeSignals exists
   # Check: resume.comprehensiveResearch exists
   ```

4. **Navigate through steps:**
   - Step 2: Should use cached signals
   - Step 3: Should use cached jobAnalysis
   - Step 4: Should use cached companyIntel
   - Step 5: Generate variants (1 call), then cache
   - Step 6: Generate letters (1 call), then cache
   - Step 7: Generate outreach (1 call), then cache

5. **Refresh pages:**
   - All data should load from cache
   - Zero additional API calls

## Monitoring

### Log API Calls

Add logging to track Perplexity usage:

```typescript
// In perplexity-service.ts
console.log('[PERPLEXITY] API Call:', {
  method: 'extractResumeSignals',
  userId,
  timestamp: new Date(),
  cached: false
})
```

### Track Cache Hits

```typescript
console.log('[CACHE] Hit:', {
  key: 'resumeSignals',
  userId,
  age: Date.now() - cachedAt
})
```

## Next Steps

1. ✅ Autopilot endpoint created
2. ✅ Resume model extended with cache fields
3. ⏳ Update frontend pages to use cache-first approach
4. ⏳ Add cache invalidation logic
5. ⏳ Add TTL checks
6. ⏳ Add monitoring/logging
7. ⏳ Test end-to-end flow
8. ⏳ Deploy to production

## Summary

The Autopilot system reduces Perplexity API costs by **50%** and eliminates redundant calls on page refreshes. By caching all AI-generated data in MongoDB and localStorage, users get instant responses while minimizing API usage.

**Key Benefits:**
- 6 API calls per complete flow (down from 12+)
- Zero redundant calls on refresh
- Instant page loads (cache-first)
- Persistent data across sessions
- Cost-efficient at scale
