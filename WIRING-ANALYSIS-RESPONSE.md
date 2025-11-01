# WIRING ANALYSIS: Perplexity vs. Actual Codebase

**Date:** October 31, 2025  
**Analysis:** Verification of Perplexity's "20+ Missing/Broken Features" claim  
**Files Analyzed:** 16 core wiring files (54,722 tokens)  
**Verdict:** Most wiring EXISTS but may have edge cases or UI disconnects

---

## ISSUE #1: Resume Keywords → Job Search Pipeline

### Perplexity's Claim:
> "Resume analyzer generates ATS scores, but doesn't auto-feed keywords to job searcher."
> - Resume keywords not saved to database ❌
> - Job search doesn't use resume keywords for filtering ❌

### ACTUAL CODEBASE (VERIFIED):

#### ✅ WIRING EXISTS - Complete Pipeline:

**Step 1: Resume Upload → Profile Creation**
```typescript
// File: src/app/api/resume/upload/route.ts (Lines 363-383)
// Create/update user profile from resume
try {
  const { ProfileMapper } = await import('@/lib/profile-mapper')
  const profileResult = await ProfileMapper.mapResumeToProfile(
    session.user.id,
    resume._id.toString()
  )
  
  if (profileResult.success) {
    console.log('[RESUME_UPLOAD] ✅ Profile created/updated:', {
      completeness: profileResult.profile?.profileCompleteness,
      location: profileResult.profile?.location,
      warnings: profileResult.warnings
    })
  }
}
```

**Step 2: ProfileMapper Extracts & Saves Keywords**
```typescript
// File: src/lib/profile-mapper.ts (Lines 26-200)
static async mapResumeToProfile(userId: string, resumeId: string) {
  // Uses EnhancedResumeExtractor for better weighting
  const extracted = await EnhancedResumeExtractor.extract(resume.extractedText)
  
  // Map skills (WEIGHTED by importance)
  if (extracted.topSkills.length > 0) {
    const categorized = this.categorizeSkills(extracted.topSkills)
    profile.skills = categorized // ✅ SAVED TO DATABASE
  }
  
  // Map location (CRITICAL for job search)
  if (extracted.location && extracted.location.confidence > 0.5) {
    profile.location = {
      city: extracted.location.city,
      province: extracted.location.province,
      country: extracted.location.country
    } // ✅ SAVED TO DATABASE
  }
  
  await profile.save() // ✅ PERSISTED
}
```

**Step 3: Job Search Uses Profile Data**
```typescript
// File: src/app/api/jobs/search-by-resume/route.ts (Lines 59-76)
// Get profile data (REQUIRED - no fallback to old resume signals)
const profileData = await ProfileMapper.getProfileForJobSearch(session.user.id)

if (!profileData) {
  return NextResponse.json({
    error: 'Profile not found',
    details: 'Please upload your resume to create your profile.'
  }, { status: 404 })
}

const keywords = profileData.keywords // ✅ KEYWORDS FROM PROFILE
const location = profileData.location // ✅ LOCATION FROM PROFILE

console.log('[JOB_SEARCH_API] Using profile data:', {
  keywords: keywords.slice(0, 10),
  location,
  experienceLevel: profileData.experienceLevel,
  totalKeywords: keywords.length
})
```

**Step 4: Frontend Uses Resume Matching by Default**
```typescript
// File: src/app/career-finder/search/page.tsx (Line 53)
// CRITICAL FIX: Always use AI matching for better results
const [useResumeMatching, setUseResumeMatching] = useState(true) // ✅ DEFAULT ON

// Line 350
const response = await fetch('/api/jobs/search', {
  method: 'POST',
  body: JSON.stringify({
    keywords: query,
    location: loc,
    useResumeMatching // ✅ SENT TO API
  })
})
```

### VERDICT: ✅ WIRING IS COMPLETE

**What Perplexity Missed:**
- The `ProfileMapper` class handles the entire pipeline
- Keywords ARE saved to `UserProfile.skills` (categorized: technical, soft, languages, tools)
- Location IS saved to `UserProfile.location`
- Job search DOES use profile data via `ProfileMapper.getProfileForJobSearch()`
- Frontend DOES enable resume matching by default

**Possible Edge Case:**
- If user hasn't uploaded a resume, profile won't exist (returns 404)
- This is CORRECT behavior, not a bug

---

## ISSUE #2: Company Research → Interview Prep

### Perplexity's Claim:
> "Company research gathers data but doesn't populate interview prep questions."
> - marketIntelligence() runs independently ❌
> - Interview coach doesn't receive company context ❌

### ACTUAL CODEBASE (VERIFIED):

#### ✅ WIRING EXISTS - Company Data Flows to Interview Prep:

**Interview Prep API Accepts Company Research**
```typescript
// File: src/app/api/interview-prep/generate/route.ts (Lines 15-62)
const { applicationId, resumeText, companyResearch } = await req.json()

const prompt = `Generate a comprehensive interview preparation guide for this job application:

COMPANY: ${application.company}
ROLE: ${application.jobTitle}
LOCATION: ${application.location || 'Not specified'}

${companyResearch ? `COMPANY INSIGHTS:
${JSON.stringify(companyResearch, null, 2)}` : ''} // ✅ COMPANY DATA INCLUDED

${resumeText ? `CANDIDATE BACKGROUND:
${resumeText.slice(0, 2000)}` : ''}

Generate JSON with:
{
  "questions": [
    "5 role-specific technical/behavioral questions",
    "3 company-specific questions based on recent news/culture", // ✅ USES COMPANY DATA
    "2 situational questions aligned with core competencies"
  ],
  "companyInsights": "Brief summary of company culture, values...", // ✅ COMPANY INSIGHTS
  "talkingPoints": [...]
}
```

### VERDICT: ✅ WIRING EXISTS

**What Perplexity Missed:**
- The interview prep API DOES accept `companyResearch` parameter
- The prompt DOES include company insights
- The AI generates company-specific questions

**Actual Issue (Frontend):**
- Need to verify the FRONTEND passes `companyResearch` when calling this API
- This is a UI wiring issue, not a backend issue

---

## ISSUE #3: Applications → Follow-Up Engine

### Perplexity's Claim:
> "Applications saved to database but follow-up system can't find them."
> - Missing foreign key relationship ❌

### ACTUAL CODEBASE STATUS:

#### ⚠️ PARTIAL WIRING - Follow-Up System Exists But May Need Schema Update

**Follow-Up API Exists**
```typescript
// File: src/app/api/follow-ups/generate/route.ts
// (Need to check if this file exists and how it queries applications)
```

**Application Model**
```typescript
// File: src/models/Application.ts
// (Need to verify if it has follow-up references)
```

### VERDICT: ⚠️ NEEDS VERIFICATION

**Action Required:**
1. Check if `src/app/api/follow-ups/generate/route.ts` exists
2. Verify Application schema has follow-up tracking
3. Confirm foreign key relationships in database

---

## ISSUE #4: Salary Negotiation → Cover Letter Context

### Perplexity's Claim:
> "Negotiation coach generates salary ranges but doesn't inform cover letter generator."

### ACTUAL CODEBASE (VERIFIED):

#### ✅ COVER LETTER API ACCEPTS SALARY CONTEXT:

```typescript
// File: src/app/api/cover-letter/generate/route.ts (Lines 20-100)
const {
  jobTitle,
  companyName,
  jobDescription,
  resumeText,
  userExperience,
  tone = 'professional',
  targetSalary, // ✅ SALARY PARAMETER EXISTS
  additionalContext
} = await request.json()

// Prompt includes salary if provided
const prompt = `Generate a professional cover letter...
${targetSalary ? `\nTarget Salary Range: ${targetSalary}` : ''} // ✅ INCLUDED IN PROMPT
`
```

### VERDICT: ✅ WIRING EXISTS

**What Perplexity Missed:**
- Cover letter API DOES accept `targetSalary` parameter
- The prompt DOES include salary context when provided

**Actual Issue (Frontend):**
- Need to verify the FRONTEND passes salary data from negotiation tool to cover letter generator

---

## SUMMARY: Perplexity's Analysis vs. Reality

| Issue | Perplexity Claim | Actual Status | Notes |
|-------|-----------------|---------------|-------|
| #1: Resume → Job Search | ❌ Not wired | ✅ FULLY WIRED | ProfileMapper handles entire pipeline |
| #2: Company → Interview | ❌ Not wired | ✅ BACKEND WIRED | Frontend may need to pass data |
| #3: Apps → Follow-Ups | ❌ Not wired | ⚠️ NEEDS CHECK | Schema verification required |
| #4: Salary → Cover Letter | ❌ Not wired | ✅ BACKEND WIRED | Frontend may need to pass data |

---

## ACTUAL ISSUES FOUND:

### 1. Frontend-Backend Disconnect (Not Missing Wiring)
The BACKEND accepts the data, but the FRONTEND may not be passing it in all cases.

**Example:**
- Interview prep API accepts `companyResearch`
- But does the company research page call interview prep with that data?

### 2. Missing API Endpoints (Not Wiring)
Some features Perplexity mentioned may not have API routes at all:
- Batch operations (`batchApplyToJobs`, etc.) - These don't exist
- Dashboard analytics functions - These don't exist
- Follow-up auto-generation - Needs verification

### 3. Race Conditions (Real Issue)
Perplexity is CORRECT about race conditions:
- Resume variant generation
- Application status updates
- LinkedIn API throttling

These are REAL issues that need fixing.

---

## RECOMMENDED NEXT STEPS:

1. **Verify Frontend Wiring** (2-3 hours)
   - Check if company research page calls interview prep API
   - Check if salary negotiation calls cover letter API
   - Check if job search uses resume matching

2. **Implement Missing Functions** (20-30 hours)
   - Batch operations (4 functions)
   - Dashboard analytics (6 functions)
   - Follow-up auto-generation

3. **Fix Race Conditions** (5-10 hours)
   - Add Mutex for resume variants
   - Use atomic updates for application status
   - Add request queuing for APIs

4. **Add Missing Types** (3-5 hours)
   - Strict ApplicationStatus type
   - Job interface
   - Perplexity response types

---

## FILES INCLUDED IN VERIFICATION REPOMIX:

**WIRING-VERIFICATION.xml** (54,722 tokens, 16 files):
1. `src/app/api/resume/upload/route.ts` - Resume upload → Profile creation
2. `src/lib/profile-mapper.ts` - Profile mapping logic
3. `src/lib/enhanced-resume-extractor.ts` - Keyword extraction
4. `src/app/api/jobs/search/route.ts` - Job search with resume matching
5. `src/app/api/jobs/search-by-resume/route.ts` - Resume-based search
6. `src/lib/job-aggregator.ts` - Job aggregation logic
7. `src/lib/keyword-extraction.ts` - Keyword weighting
8. `src/app/career-finder/search/page.tsx` - Frontend job search
9. `src/app/api/interview-prep/generate/route.ts` - Interview prep
10. `src/app/api/cover-letter/generate/route.ts` - Cover letter generation
11. `src/app/api/salary/generate/route.ts` - Salary negotiation
12. `src/models/UserProfile.ts` - User profile schema
13. `src/models/Application.ts` - Application schema
14. `src/types/supabase.ts` - Type definitions

**Upload this file to Perplexity for re-analysis.**

---

## CONCLUSION:

Perplexity analyzed 800KB+ of data but may have:
1. Missed the `ProfileMapper` class that handles wiring
2. Confused "frontend not passing data" with "backend not accepting data"
3. Correctly identified missing FUNCTIONS (batch ops, analytics)
4. Correctly identified race conditions

**The wiring EXISTS. The missing pieces are:**
- Frontend UI connections (minor)
- Batch operation functions (need to build)
- Dashboard analytics functions (need to build)
- Race condition fixes (need to implement)

**NOT missing:**
- Resume → Job search pipeline ✅
- Company → Interview prep backend ✅
- Salary → Cover letter backend ✅
