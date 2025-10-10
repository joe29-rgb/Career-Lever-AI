# 🔍 CAREER FINDER DEBUGGING GUIDE FOR PERPLEXITY

## 📋 WORKFLOW OVERVIEW
The Career Finder flow: **Resume Upload → Job Search → Job Analysis → Company Research → Resume Optimizer → Cover Letter → Outreach**

---

## 🚨 CRITICAL ISSUE: Redirect Loop on Job Analysis Page

### 1. Job Analysis Page (MOST CRITICAL)
**File:** `src/app/career-finder/job-analysis/page.tsx`

**Questions for Perplexity:**
1. **Why does this page redirect to search in an infinite loop?** The logs show `[JOB_ANALYSIS] No job found - redirecting to search` repeatedly
2. **Is `CareerFinderStorage.getJob()` working correctly?** It should read from `localStorage.getItem('cf:selectedJob')`
3. **Are there any race conditions in the `useEffect` hook?** Multiple `useEffect` calls might be causing re-renders
4. **Does the page check for the job BEFORE the search page saves it?** Timing issue?
5. **Is there a `useEffect` dependency array issue** causing infinite loops?

**Key Code Section to Analyze:**
```typescript
useEffect(() => {
  loadJobAndAnalyze()
}, []) // Check if this runs multiple times

const loadJobAndAnalyze = async () => {
  const selectedJob = CareerFinderStorage.getJob() // Does this return null even after saving?
  if (!selectedJob) {
    router.push('/career-finder/search') // INFINITE LOOP HERE
    return
  }
}
```

**What to Look For:**
- Is `useEffect` running more than once?
- Is there a missing `useRef` to prevent multiple calls?
- Does `CareerFinderStorage.getJob()` return null incorrectly?
- Is there a navigation happening before localStorage is saved?

---

## ❌ CRITICAL ISSUE: 0 Jobs Found

### 2. Job Search Page
**File:** `src/app/career-finder/search/page.tsx`

**Questions for Perplexity:**
1. **Why does Perplexity return 0 jobs even with valid keywords?** Check API call around line ~193
2. **Is the `useResumeMatching` always set to `true`?** Line 42 - should force AI matching
3. **Are the keywords being sent correctly to the API?** Check the `handleSearch` function payload
4. **Is there caching preventing fresh searches?** Lines 57-80 show cache logic
5. **Does the autopilot flow override manual searches?** Lines 111-156 show auto-search logic
6. **Is the location parameter being sent?** Empty location might cause issues
7. **Are cached empty results being served?** Check cache expiration logic

**Key API Call to Debug:**
```typescript
const response = await fetch('/api/jobs/search', {
  method: 'POST',
  body: JSON.stringify({
    keywords: searchKeywords, // Are these empty?
    location: searchLocation,
    limit: 50,
    useResumeMatching: true // Is this being sent?
  })
})
```

**Console Logs to Check:**
```
[SEARCH] Searching for "X" in "Y" (Resume: true)
[SEARCH] Found N jobs from M sources
[CACHE] Stored N jobs
```

**What to Look For:**
- Are keywords empty or malformed?
- Is location parameter causing issues?
- Is the API returning `{ jobs: [] }` or erroring?
- Is cache serving stale empty results?

---

### 3. Job Search API Endpoint
**File:** `src/app/api/jobs/search/route.ts`

**Questions for Perplexity:**
1. **Does this endpoint call Perplexity Intelligence Service correctly?**
2. **What's the exact prompt being sent to Perplexity?** Is it asking for JSON job listings?
3. **Are there rate limits or API key issues?** Check for PERPLEXITY_API_KEY
4. **Is the response being parsed correctly?** JSON extraction might be failing
5. **Does the endpoint handle empty results gracefully?**
6. **Is input validation correct?** Check for 400 Bad Request responses
7. **Are multiple job boards being searched?** Indeed, LinkedIn, Glassdoor, etc.

**Expected to find:**
- Perplexity API call with job search prompt
- JSON parsing logic using `enterprise-json-extractor.ts`
- Error handling for empty results
- Validation for keywords (minimum length?)

**What to Look For:**
```typescript
// Expected structure
export async function POST(request: NextRequest) {
  const { keywords, location, limit, useResumeMatching } = await request.json()
  
  // Validation
  if (!keywords || keywords.trim().length < 3) {
    return NextResponse.json({ error: 'Keywords required' }, { status: 400 })
  }
  
  // Call Perplexity
  const result = await PerplexityIntelligenceService.jobMarketAnalysisV2({
    keywords,
    location,
    limit
  })
  
  return NextResponse.json({ jobs: result.data || [] })
}
```

---

### 4. Perplexity Intelligence Service
**File:** `src/lib/perplexity-intelligence.ts`

**Questions for Perplexity:**
1. **What's the exact `jobMarketAnalysisV2` prompt?** Need to see the full prompt text
2. **Is it using `sonar-pro` model?** Should be for better results
3. **Are there explicit `site:indeed.com` or `site:linkedin.com` search operators?**
4. **Is the temperature set correctly?** Should be low (0.2-0.3) for factual results
5. **Does the prompt explicitly request JSON format with specific fields?** (title, company, location, salary, url, description)
6. **Is there retry logic if Perplexity returns malformed JSON?**
7. **What's the token limit?** Should be high enough for multiple job listings (3000-4000 tokens)
8. **Is web search enabled?** Should be `true` to search the web
9. **Are citations being returned?** Useful for debugging sources
10. **Is the cache being used?** Might be serving stale empty results

**Key Method to Analyze:**
```typescript
static async jobMarketAnalysisV2(params: {
  keywords: string
  location: string
  resumeText?: string
  limit?: number
}) {
  const prompt = `...` // NEED TO SEE THIS EXACT PROMPT
  
  return client.makeRequest(
    systemPrompt,
    prompt,
    {
      model: 'sonar-pro', // Verify this
      temperature: 0.2,   // Verify this
      maxTokens: 4000,    // Verify this
      webSearch: true     // Verify this
    }
  )
}
```

**Expected Prompt Structure:**
```
Search for {limit} job listings for "{keywords}" in "{location}".

REQUIREMENTS:
1. Search these sites explicitly:
   - site:indeed.com
   - site:linkedin.com/jobs
   - site:glassdoor.com/job-listing
   - site:monster.com
   - site:ziprecruiter.com

2. Return ONLY valid JSON array with this exact structure:
[
  {
    "title": "Exact job title",
    "company": "Company name",
    "location": "City, State/Province",
    "salary": "Salary range or empty string",
    "url": "Direct application URL",
    "description": "Full job description (500+ chars)",
    "posted": "Time posted (e.g. '2 days ago')",
    "source": "indeed|linkedin|glassdoor"
  }
]

3. Include ONLY real, currently active job postings
4. Each job MUST have a valid URL
5. Descriptions should be comprehensive (500+ characters)
6. Return empty array [] if no jobs found
7. Do NOT add explanatory text outside JSON
```

---

### 5. Resume Upload Component
**File:** `src/components/resume-upload/index.tsx`

**Questions for Perplexity:**
1. **Does `triggerAutopilotFlow` interfere with manual job searches?** Lines 24-141
2. **Are keywords extracted correctly?** Check `processResumeSignals` function
3. **Is `cf:resume` saved with ALL necessary fields?** Line 321
4. **Does the autopilot background search conflict with UI searches?** Line 67-85
5. **Are there any async timing issues?** Multiple `await` calls might delay saves
6. **Is the resume being uploaded to the database?** Check API call to `/api/resume/upload`
7. **Are extraction methods working?** PDF parsing, text extraction

**Key Save Operations:**
```typescript
localStorage.setItem('cf:resume', JSON.stringify(resume)) // Line 321
localStorage.setItem('cf:keywords', signals.keywords?.slice(0, 5).join(', ') || '') // Line 348
localStorage.setItem('cf:location', signals.location || '') // Line 347
localStorage.setItem('cf:autopilotReady', '1') // Line 350
```

**What to Look For:**
- Are all saves successful (no try/catch swallowing errors)?
- Is the resume object complete (has extractedText, _id, etc.)?
- Are keywords a comma-separated string?
- Is location a valid city/province?
- Does autopilot trigger immediately or wait?

**Resume Object Structure:**
```typescript
interface Resume {
  _id: string
  userId: string
  extractedText: string
  originalFileName: string
  fileSize: number
  uploadDate: Date
  extractionMethod: string
  extractionConfidence: number
}
```

---

### 6. CareerFinderStorage Utility
**File:** `src/lib/career-finder-storage.ts`

**Questions for Perplexity:**
1. **Are ALL keys using the `cf:` prefix consistently?**
2. **Is `getJob()` method reading from the correct key?** Should be `cf:selectedJob`
3. **Are there any JSON parse errors being silently caught?**
4. **Does `setJob()` validate the job object before saving?**
5. **Is there a `clearAll()` method that might be accidentally called?**
6. **Are there getters/setters for all data types?** (resume, keywords, location, progress, etc.)
7. **Is error handling robust?** Should log errors, not swallow them

**Expected Structure:**
```typescript
class CareerFinderStorage {
  // Job Management
  static getJob() {
    try {
      const data = localStorage.getItem('cf:selectedJob')
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('[STORAGE] Failed to get job:', error)
      return null
    }
  }
  
  static setJob(job: any) {
    try {
      localStorage.setItem('cf:selectedJob', JSON.stringify(job))
      console.log('[STORAGE] Saved job:', job.title)
    } catch (error) {
      console.error('[STORAGE] Failed to save job:', error)
    }
  }
  
  // Resume Management
  static getResume() {
    try {
      const data = localStorage.getItem('cf:resume')
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('[STORAGE] Failed to get resume:', error)
      return null
    }
  }
  
  static setResume(resume: any) {
    try {
      localStorage.setItem('cf:resume', JSON.stringify(resume))
    } catch (error) {
      console.error('[STORAGE] Failed to save resume:', error)
    }
  }
  
  // Keywords & Location
  static getKeywords(): string {
    return localStorage.getItem('cf:keywords') || ''
  }
  
  static setKeywords(keywords: string) {
    localStorage.setItem('cf:keywords', keywords)
  }
  
  static getLocation(): string {
    return localStorage.getItem('cf:location') || ''
  }
  
  static setLocation(location: string) {
    localStorage.setItem('cf:location', location)
  }
  
  // Progress Tracking
  static getProgress() {
    try {
      const data = localStorage.getItem('cf:progress')
      return data ? JSON.parse(data) : { step: 1, total: 7 }
    } catch {
      return { step: 1, total: 7 }
    }
  }
  
  static setProgress(step: number, total: number = 7) {
    localStorage.setItem('cf:progress', JSON.stringify({ step, total }))
  }
  
  // Analysis Results
  static getAnalysis() {
    try {
      const data = localStorage.getItem('cf:jobAnalysis')
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }
  
  static setAnalysis(analysis: any) {
    localStorage.setItem('cf:jobAnalysis', JSON.stringify(analysis))
  }
  
  // Company Research
  static getCompanyResearch() {
    try {
      const data = localStorage.getItem('cf:companyResearch')
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }
  
  static setCompanyResearch(research: any) {
    localStorage.setItem('cf:companyResearch', JSON.stringify(research))
  }
  
  // Clear All
  static clearAll() {
    const keys = [
      'cf:selectedJob',
      'cf:resume',
      'cf:keywords',
      'cf:location',
      'cf:progress',
      'cf:jobAnalysis',
      'cf:companyResearch',
      'cf:autopilotReady',
      'cf:jobResults',
      'cf:jobResultsTime'
    ]
    
    keys.forEach(key => localStorage.removeItem(key))
    console.log('[STORAGE] Cleared all Career Finder data')
  }
}

export default CareerFinderStorage
```

---

## 🔧 SECONDARY ISSUES

### 7. Resume Optimizer Page
**File:** `src/app/career-finder/optimizer/page.tsx`

**Questions for Perplexity:**
1. **Why does AI generation timeout after 60 seconds?** Is the prompt too long?
2. **Does the optimizer load the job description correctly?** Check `CareerFinderStorage.getJob()`
3. **Are personal details (name, email, phone) being extracted?** Check `extractPersonalInfo` function
4. **Does the ATS score calculation work?** Check `calculateATSScore` function
5. **Is the API endpoint `/api/resume-builder/generate` working?**
6. **Are multiple variants being generated?** Should return 2-3 versions
7. **Is there a loading state preventing multiple calls?** Check `useRef` or state guard

**Personal Info Extraction:**
```typescript
const extractPersonalInfo = (resumeText: string) => {
  // Regex patterns for email, phone, name, location
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/
  const phoneRegex = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/
  
  // Should extract from first 500 chars
  // Return { name, email, phone, location }
}
```

**ATS Score Calculation:**
```typescript
const calculateATSScore = (resumeText: string, jobDescription: string) => {
  // Match keywords from job description
  // Check for standard sections (Experience, Education, Skills)
  // Check for proper formatting (bullet points, dates)
  // Return score 0-100
}
```

---

### 8. Company Research Page
**File:** `src/app/career-finder/company/page.tsx`

**Questions for Perplexity:**
1. **Does `CompanyResearchService.research()` call Perplexity correctly?**
2. **Are news, Glassdoor, and social media being fetched?** Check the service
3. **Is hiring contacts search working?** Should return real LinkedIn profiles
4. **Does the progress tracker update correctly?**
5. **Is the company name being passed correctly?** From `selectedJob.company`
6. **Are results being cached?** Check `cf:companyResearch`

---

### 9. Company Research Service
**File:** `src/lib/company-research-service.ts`

**Questions for Perplexity:**
1. **What's the exact Perplexity prompt for company research?**
2. **Does it request recent news (last 6 months)?**
3. **Does it search Glassdoor explicitly?** `site:glassdoor.com`
4. **Does it search LinkedIn for real hiring managers?** `site:linkedin.com`
5. **Is the response structured correctly?** Should return `CompanyResearchResult` type
6. **Are hiring contacts validated?** Should have real names and emails
7. **Is there fallback data if Perplexity fails?**

**Expected Prompt Structure:**
```
Research {companyName} for the role of {jobTitle} in {location}.

REQUIREMENTS:
1. Company Overview:
   - Description, size, revenue, industry
   - Founded year, headquarters location
   
2. Recent News (last 6 months):
   - Search: site:techcrunch.com OR site:bloomberg.com OR site:reuters.com
   - Return: [{ title, source, date, url, summary }]
   
3. Glassdoor Data:
   - Search: site:glassdoor.com "{companyName}" reviews
   - Return: { rating, reviewCount, pros, cons }
   
4. Social Media:
   - LinkedIn: linkedin.com/company/{company}
   - Twitter: twitter.com/{company}
   - GitHub: github.com/{company}
   
5. Stock Profile (if public):
   - Search: site:finance.yahoo.com OR site:nasdaq.com
   - Return: { symbol, exchange, price, marketCap }
   
6. Hiring Contacts:
   - Search: site:linkedin.com "{companyName}" "recruiter" OR "talent acquisition" OR "hiring manager" {jobTitle}
   - Return: [{ name, title, linkedinUrl, email?, source }]
   - MUST be real people, NOT generic emails
   - Include position-specific contacts (e.g., "Engineering Manager" for SWE roles)

Return JSON with ALL sections. Use "N/A" for unavailable data.
```

**Expected Response Type:**
```typescript
interface CompanyResearchResult {
  company: string
  description: string
  size: string
  revenue: string
  industry: string
  founded: string
  headquarters: string
  
  recentNews: Array<{
    title: string
    source: string
    date: string
    url: string
    summary: string
  }>
  
  glassdoorRating: {
    rating: number
    reviewCount: number
    pros: string[]
    cons: string[]
  }
  
  socialMedia: {
    linkedin?: string
    twitter?: string
    github?: string
  }
  
  stockProfile?: {
    symbol: string
    exchange: string
    price: string
    marketCap: string
  }
  
  hiringContacts: Array<{
    name: string
    title: string
    department: string
    linkedinUrl?: string
    email?: string
    emailType: 'public' | 'inferred' | 'pattern'
    source: string
    confidence: number
  }>
  
  psychology: string
  marketIntelligence: string | {
    competitivePosition: string
    industryTrends: string[]
    growthIndicators: string[]
  }
  
  culture: Array<{ point: string; source?: string }>
  salaries: Array<{ role: string; range: string; source?: string }>
  
  sources: string[]
  confidence: number
}
```

---

### 10. Job Analysis API
**File:** `src/app/api/jobs/analyze/route.ts`

**Questions for Perplexity:**
1. **Does this API validate inputs correctly?** Check for 400 responses
2. **Is the match score calculated properly?**
3. **Are skills being compared case-insensitively?**
4. **Does it handle missing job descriptions gracefully?**
5. **Is there a `TypeError` on `toLowerCase()`?** Check for non-string skills
6. **Are recommendations actionable?** Should be specific, not generic

**Expected Validation:**
```typescript
export async function POST(request: NextRequest) {
  const { jobTitle, company, jobDescription, resumeText } = await request.json()
  
  // Validation
  if (!jobTitle || jobTitle.trim().length < 3) {
    return NextResponse.json({ error: 'Job title required' }, { status: 400 })
  }
  
  if (!company || company.trim().length < 2) {
    return NextResponse.json({ error: 'Company name required' }, { status: 400 })
  }
  
  if (!resumeText || resumeText.length < 100) {
    return NextResponse.json({ error: 'Resume text required' }, { status: 400 })
  }
  
  // jobDescription is optional but recommended
}
```

**Skills Comparison (Fixed):**
```typescript
// Extract skills from job description
const jobSkills = extractSkills(jobDescription)

// Extract skills from resume
const resumeSkills = extractSkills(resumeText)

// Compare case-insensitively
const matchingSkills = jobSkills.filter(jobSkill => {
  if (typeof jobSkill !== 'string') return false // FIX: Type check
  return resumeSkills.some(resumeSkill => 
    typeof resumeSkill === 'string' && 
    resumeSkill.toLowerCase() === jobSkill.toLowerCase()
  )
})

// Calculate match score
const matchScore = Math.round((matchingSkills.length / jobSkills.length) * 100)
```

---

### 11. Resume Builder API
**File:** `src/app/api/resume-builder/generate/route.ts`

**Questions for Perplexity:**
1. **Does the prompt prevent AI from fabricating experience?** Should have strict rules
2. **Is it reformatting ONLY existing content?** No invention allowed
3. **Does it generate multiple variants?** Should return 2-3 versions
4. **Is the timeout set high enough?** Should be 60+ seconds
5. **Are ATS keywords being preserved?**
6. **Are dates and company names preserved exactly?**

**Critical Prompt Rules:**
```
Generate optimized resume variants based on this resume and job description.

STRICT RULES:
1. Do NOT invent, add, or fabricate ANY experience, skills, or accomplishments
2. Do NOT add skills that are not explicitly in the original resume
3. ONLY reformat, rephrase, and reorganize EXISTING content
4. Preserve ALL dates, company names, and job titles EXACTLY as written
5. Preserve ALL education details EXACTLY as written
6. Use bullet points to highlight achievements from original text
7. Quantify achievements where numbers already exist in original
8. Do NOT add metrics or numbers that don't exist in original

WHAT YOU CAN DO:
- Reorder sections for better flow
- Rephrase bullet points for clarity and impact
- Emphasize skills that match the job description
- Adjust formatting for ATS compatibility
- Use action verbs to start bullet points
- Tailor the summary/objective to the role

WHAT YOU CANNOT DO:
- Add new skills, experiences, or accomplishments
- Invent metrics or quantitative achievements
- Add technologies or tools not in original
- Create fictional projects or responsibilities
- Modify dates, company names, or titles

Generate 3 variants:
1. Conservative: Minimal changes, ATS-optimized
2. Balanced: Moderate rephrasing, keyword-focused
3. Impact: Maximum impact while staying truthful

Return JSON array of variants with this structure:
[
  {
    "name": "Conservative",
    "html": "Full HTML resume",
    "atsScore": 85,
    "keywordCount": 12,
    "readabilityScore": 90,
    "tone": "Professional",
    "changes": ["List of changes made"]
  }
]
```

---

## 📊 DATA FLOW DIAGRAM

```
1. Resume Upload
   ↓
   localStorage('cf:resume', 'cf:keywords', 'cf:location')
   ↓
2. Job Search
   - User enters keywords/location OR autopilot uses extracted data
   - API calls Perplexity with site-specific searches
   - Returns jobs from Indeed, LinkedIn, Glassdoor
   ↓
   localStorage('cf:jobResults', 'cf:jobResultsTime')
   ↓
3. Job Selection
   - User clicks job card
   - handleJobSelection() saves to localStorage
   ↓
   localStorage('cf:selectedJob') ← **CRITICAL: Must save before navigating**
   ↓
4. Job Analysis
   - Page loads, reads 'cf:selectedJob' + 'cf:resume'
   - API analyzes match score, skills, recommendations
   ↓
   localStorage('cf:jobAnalysis')
   ↓
5. Company Research
   - Reads 'cf:selectedJob'
   - Perplexity searches news, Glassdoor, LinkedIn, social media
   ↓
   localStorage('cf:companyResearch')
   ↓
6. Resume Optimizer
   - Reads 'cf:selectedJob' + 'cf:resume'
   - AI generates 3 variants (conservative, balanced, impact)
   - User selects variant
   ↓
   localStorage('cf:selectedResumeHtml', 'cf:selectedVariant')
   ↓
7. Cover Letter
   - Reads all data (job, resume, company research)
   - AI generates personalized cover letter
   ↓
   localStorage('cf:coverLetter')
   ↓
8. Outreach
   - Reads all data
   - Personalizes emails for each hiring contact
   - User sends or schedules
```

---

## 🔍 LOCALSTORAGE KEYS REFERENCE

| Key | Type | Set By | Used By | Purpose |
|-----|------|--------|---------|---------|
| `cf:resume` | Object | Resume Upload | All pages | Full resume data with extractedText |
| `cf:keywords` | String | Resume Upload | Job Search | Comma-separated skills/keywords |
| `cf:location` | String | Resume Upload | Job Search | User location (city, province) |
| `cf:autopilotReady` | String ('1') | Resume Upload | Job Search | Flag to trigger auto-search |
| `cf:jobResults` | Array | Job Search | Job Search | Cached job listings |
| `cf:jobResultsTime` | Number | Job Search | Job Search | Cache timestamp |
| `cf:selectedJob` | Object | Job Search | All downstream pages | Selected job details |
| `cf:jobAnalysis` | Object | Job Analysis | Optimizer, Cover Letter | Match analysis results |
| `cf:companyResearch` | Object | Company Research | Optimizer, Cover Letter, Outreach | Company intel |
| `cf:selectedResumeHtml` | String | Resume Optimizer | Cover Letter, Outreach | Chosen resume variant HTML |
| `cf:selectedVariant` | Object | Resume Optimizer | Cover Letter | Variant metadata |
| `cf:coverLetter` | String | Cover Letter | Outreach | Generated cover letter |
| `cf:progress` | Object | All pages | Progress Tracker | Current step (1-7) |
| `cf:profile` | Object | Resume Upload | Job Search | Smart profile (seniority, work type) |

---

## 🎯 DEBUGGING CHECKLIST

### For Each File, Ask Perplexity:

#### Data Flow
- [ ] Are all `localStorage` keys using `cf:` prefix?
- [ ] Is data being saved BEFORE navigation?
- [ ] Are JSON.parse() calls wrapped in try/catch?
- [ ] Are null checks done before using data?

#### React Hooks
- [ ] Are `useEffect` hooks causing infinite loops?
- [ ] Are dependency arrays correct?
- [ ] Are there missing `useRef` guards for async operations?
- [ ] Is `router.push()` called conditionally, not in render?

#### API Endpoints
- [ ] Are inputs validated (400 for bad data)?
- [ ] Are errors returned with proper status codes?
- [ ] Is JSON response structure consistent?
- [ ] Are Perplexity calls using correct model (`sonar-pro`)?

#### Perplexity Prompts
- [ ] Are prompts explicit about JSON format?
- [ ] Are site-specific searches used (`site:indeed.com`)?
- [ ] Is temperature low enough (0.2-0.3)?
- [ ] Is token limit high enough (3000-4000)?
- [ ] Are error handling and retry logic present?

#### Error Handling
- [ ] Are errors logged to console with context?
- [ ] Are user-facing errors informative?
- [ ] Is there graceful degradation?
- [ ] Are loading states shown during async operations?

#### Race Conditions
- [ ] Are multiple API calls prevented (useRef)?
- [ ] Is debouncing used for search inputs?
- [ ] Are state updates atomic?
- [ ] Is localStorage read/write atomic?

#### Caching
- [ ] Is cache helping or hurting?
- [ ] Is cache expiration correct (20 minutes)?
- [ ] Are cache keys unique?
- [ ] Is stale data handled?

#### TypeScript
- [ ] Are interfaces matching actual data?
- [ ] Are type guards used for dynamic data?
- [ ] Are `any` types avoided?
- [ ] Are optional fields marked with `?`

---

## 🚀 PRIORITY ORDER FOR FIXES

### HIGH PRIORITY (Fix First):
1. **Job Analysis redirect loop** 
   - File: `src/app/career-finder/job-analysis/page.tsx`
   - Issue: `CareerFinderStorage.getJob()` returns null
   - Impact: Blocks entire flow, infinite redirect
   - Fix: Add useRef guard, improve error logging

2. **Job Search returning 0 results**
   - File: `src/lib/perplexity-intelligence.ts` (jobMarketAnalysisV2)
   - Issue: Prompt not forcing site-specific searches
   - Impact: No jobs to analyze
   - Fix: Enhance prompt with explicit site: operators

3. **localStorage key consistency**
   - File: `src/lib/career-finder-storage.ts`
   - Issue: Some keys don't use `cf:` prefix
   - Impact: Data not persisting between pages
   - Fix: Audit all storage calls, ensure `cf:` prefix

### MEDIUM PRIORITY:
4. **Resume Optimizer timeout**
   - File: `src/app/career-finder/optimizer/page.tsx`
   - Issue: 60s timeout too short for complex resumes
   - Fix: Increase to 120s, add progress indicator

5. **Company Research missing data**
   - File: `src/lib/company-research-service.ts`
   - Issue: News, Glassdoor not being fetched
   - Fix: Enhance Perplexity prompt with specific searches

6. **Hiring contacts returning generic emails**
   - File: `src/lib/perplexity-intelligence.ts` (hiringContactsV2)
   - Issue: Pattern-based email guessing
   - Fix: Force LinkedIn/website search, reject patterns

### LOW PRIORITY:
7. **UI polish** - Already done ✅
8. **ATS scoring accuracy** - Needs algorithm refinement
9. **Cover letter tone variations** - Needs more prompt engineering

---

## 🔧 COMMON ERRORS & SOLUTIONS

### Error: "[JOB_ANALYSIS] No job found - redirecting to search"
**Root Cause:** `localStorage.getItem('cf:selectedJob')` returns null  
**Solution:** 
1. Check if search page saves job BEFORE navigating
2. Add console.log in handleJobSelection to verify save
3. Add delay before navigation (100ms)
4. Use useRef to prevent multiple redirects

### Error: "Found 0 jobs from 0 sources"
**Root Cause:** Perplexity prompt not searching job boards  
**Solution:**
1. Add explicit site: operators to prompt
2. Increase token limit to 4000
3. Use sonar-pro model
4. Add web search: true flag
5. Check PERPLEXITY_API_KEY is set

### Error: "TypeError: toLowerCase is not a function"
**Root Cause:** Skills array contains non-string values  
**Solution:**
```typescript
const matchingSkills = jobSkills.filter(skill => {
  if (typeof skill !== 'string') return false
  return resumeSkills.some(rs => 
    typeof rs === 'string' && rs.toLowerCase() === skill.toLowerCase()
  )
})
```

### Error: "Analysis failed" on job-analysis page
**Root Cause:** API expects flat fields, receiving nested objects  
**Solution:**
```typescript
// Correct format
await fetch('/api/jobs/analyze', {
  body: JSON.stringify({
    jobTitle: job.title,
    company: job.company,
    jobDescription: job.description,
    resumeText: resume.extractedText
  })
})
```

### Error: Infinite loop between search and job-analysis
**Root Cause:** useEffect runs multiple times, checking for job before it's saved  
**Solution:**
```typescript
const hasRun = useRef(false)

useEffect(() => {
  if (hasRun.current) return
  hasRun.current = true
  
  loadJobAndAnalyze()
}, [])
```

### Error: "Hiring contacts are generic emails"
**Root Cause:** Perplexity prompt allows pattern-based guessing  
**Solution:**
```
REQUIREMENTS:
1. Search LinkedIn explicitly: site:linkedin.com "CompanyName" "recruiter"
2. Search company website: site:company.com "team" OR "about" OR "contact"
3. Return ONLY verified contacts with real names
4. If email not found, leave empty (do NOT guess)
5. Mark email source: 'linkedin' | 'website' | 'verified'
6. Return empty array if no real contacts found
```

---

## 📝 TESTING CHECKLIST

### Manual Test Flow:
1. [ ] Upload resume → Check `cf:resume` in localStorage
2. [ ] Verify keywords extracted → Check `cf:keywords`
3. [ ] Search for jobs → Should return 10+ results
4. [ ] Click job card → Check `cf:selectedJob` saved
5. [ ] Navigate to job-analysis → Should NOT redirect
6. [ ] Verify analysis shows match score → Check UI renders
7. [ ] Continue to company → Should show news, Glassdoor
8. [ ] Continue to optimizer → Should generate 3 variants
9. [ ] Continue to cover letter → Should personalize
10. [ ] Continue to outreach → Should show hiring contacts

### Console Log Checks:
```
✅ [RESUME_PAGE] Found cached resume in localStorage: {id}
✅ [SEARCH] Searching for "{keywords}" in "{location}" (Resume: true)
✅ [SEARCH] Found 11 jobs from 3 sources
✅ [CACHE] Stored 11 jobs
✅ [SEARCH] 💾 Saved job to localStorage: {title} @ {company}
✅ [JOB_ANALYSIS] ✅ Loaded job: {title} @ {company}
✅ [JOB_ANALYSIS] ✅ Loaded resume with {length} chars
✅ [COMPANY] ✅ Loaded job: {title} @ {company}
✅ [OPTIMIZER] 📋 Extracted personal info: {name}
✅ [OPTIMIZER] 📊 ATS Score: {score}
```

### Error Log Checks (Should NOT see):
```
❌ [JOB_ANALYSIS] No job found - redirecting to search
❌ [SEARCH] Found 0 jobs from 0 sources
❌ TypeError: toLowerCase is not a function
❌ Analysis failed
❌ JSON parsing failed
❌ Perplexity API error
```

---

## 🎓 KEY LEARNINGS

### Why the Redirect Loop Happens:
1. Job Analysis page mounts
2. useEffect runs, calls `CareerFinderStorage.getJob()`
3. Returns null (job not saved yet or timing issue)
4. Redirects to search page
5. Search page loads, job results already cached
6. User clicks job, saves to localStorage
7. Navigates to job-analysis
8. **Problem:** Page re-mounts, useEffect runs again
9. If job is null (race condition), redirects again
10. **Loop continues indefinitely**

### Solution:
```typescript
const hasRun = useRef(false)

useEffect(() => {
  if (hasRun.current) return
  hasRun.current = true
  
  const loadJob = async () => {
    // Add small delay to ensure localStorage is saved
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const job = CareerFinderStorage.getJob()
    if (!job) {
      console.error('[JOB_ANALYSIS] ❌ No job in localStorage')
      router.push('/career-finder/search')
      return
    }
    
    console.log('[JOB_ANALYSIS] ✅ Loaded job:', job.title)
    // Proceed with analysis...
  }
  
  loadJob()
}, []) // Empty deps, runs once
```

### Why 0 Jobs Are Returned:
1. Perplexity prompt is too generic
2. No explicit job board site searches
3. Perplexity treats it as a general query, not job search
4. Returns empty result or unstructured text
5. JSON extraction fails
6. Empty array returned

### Solution:
```typescript
const prompt = `
Search job boards for "${keywords}" jobs in "${location}".

EXPLICIT SOURCES (search these sites):
- site:indeed.com/jobs "${keywords}" "${location}"
- site:linkedin.com/jobs "${keywords}" "${location}"  
- site:glassdoor.com/Job "${keywords}" "${location}"
- site:ziprecruiter.com/jobs "${keywords}" "${location}"

RETURN FORMAT: Valid JSON array only, no other text
[
  {
    "title": "Exact job title from posting",
    "company": "Company name",
    "location": "City, State/Province",
    "salary": "Salary if listed, empty string otherwise",
    "url": "Direct job posting URL",
    "description": "Full job description, min 500 chars",
    "posted": "Time posted (e.g. '2 days ago')",
    "source": "indeed|linkedin|glassdoor|ziprecruiter"
  }
]

REQUIREMENTS:
- Minimum ${limit || 10} jobs
- Each must have valid URL
- Full descriptions (500+ characters)
- Only currently active postings
- Return [] if no jobs found
`
```

---

## 💡 TIPS FOR PERPLEXITY ANALYSIS

### When Pasting Code:
1. **Include file path and line numbers** for context
2. **Highlight the problematic section** with comments
3. **Provide before/after** if suggesting changes
4. **Include relevant types/interfaces** from other files
5. **Show console logs** that demonstrate the issue

### Questions to Always Ask:
1. "Is this code causing race conditions?"
2. "Are there any infinite loop possibilities?"
3. "Is error handling comprehensive?"
4. "Are types correct and consistent?"
5. "Is this following React best practices?"
6. "Are there any performance issues?"
7. "Is this code DRY (Don't Repeat Yourself)?"

### Red Flags to Look For:
- 🚩 `useEffect` with no dependency array
- 🚩 `router.push()` inside render or useEffect without guards
- 🚩 `JSON.parse()` without try/catch
- 🚩 `toLowerCase()` without type check
- 🚩 Multiple API calls without debouncing
- 🚩 `any` types in TypeScript
- 🚩 Silent error swallowing (empty catch blocks)
- 🚩 Stale closures in useEffect
- 🚩 Direct localStorage access without utility wrapper
- 🚩 Missing null/undefined checks

---

## 📚 ADDITIONAL FILES TO ANALYZE

### If Issues Persist:

**12. Enterprise JSON Extractor**
- File: `src/lib/utils/enterprise-json-extractor.ts`
- Question: Is JSON extraction robust enough for Perplexity responses?

**13. Perplexity Logger**
- File: `src/lib/utils/perplexity-logger.ts`
- Question: Are all Perplexity calls being logged?

**14. Salary Normalizer**
- File: `src/lib/utils/salary-normalizer.ts`
- Question: Is salary parsing handling all formats?

**15. Resume Upload API**
- File: `src/app/api/resume/upload/route.ts`
- Question: Is PDF/DOCX extraction working correctly?

**16. Resume Extract Signals API**
- File: `src/app/api/resume/extract-signals/route.ts`
- Question: Are keywords and location being extracted accurately?

**17. Layout & Providers**
- File: `src/components/providers.tsx`
- Question: Are there any provider issues causing re-renders?

**18. Career Finder Layout**
- File: `src/app/career-finder/layout.tsx`
- Question: Is the layout causing navigation issues?

---

## 🎯 SUCCESS CRITERIA

The Career Finder flow is FIXED when:

1. ✅ Resume uploads successfully and extracts keywords/location
2. ✅ Job search returns 10+ real job listings from job boards
3. ✅ Clicking a job saves to `cf:selectedJob` correctly
4. ✅ Job Analysis page loads without redirect loop
5. ✅ Match score and skills display correctly
6. ✅ Company Research returns news, Glassdoor, contacts
7. ✅ Resume Optimizer generates 3 variants in <60s
8. ✅ Personal info displays (name, email, phone)
9. ✅ ATS score shows realistic percentage
10. ✅ Cover Letter personalizes to company and role
11. ✅ Hiring contacts have real names (not generic emails)
12. ✅ Complete flow works end-to-end without errors

---

## 📞 NEED MORE HELP?

If Perplexity identifies issues it can't explain:

1. **Share the full error stack trace** from browser console
2. **Provide localStorage snapshot** (all `cf:` keys)
3. **Show network tab** for failed API calls
4. **Include before/after code** for changes
5. **Test with minimal data** (simple resume, one keyword)

**Remember:** The most common issues are:
- Race conditions (useEffect running multiple times)
- Timing issues (localStorage not saved before navigation)
- JSON parsing failures (Perplexity returning text, not JSON)
- Type errors (non-string in array, null not handled)
- Cache issues (stale data being served)

---

**END OF DEBUGGING GUIDE**

*Last Updated: [Date]*  
*Version: 1.0*  
*Status: For Perplexity Analysis Only - DELETE AFTER USE*

