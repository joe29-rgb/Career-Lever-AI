# 🎯 ENTERPRISE CAREER LEVER AI - IMPLEMENTATION TODO

**Created:** October 26, 2025, 1:15 PM MDT  
**Status:** IN PROGRESS  
**Goal:** Fix Perplexity prompts, add validators, implement enterprise-grade system

---

## ✅ COMPLETED (4 files)

1. ✅ `src/lib/validators/email-validator.ts` - CREATED
2. ✅ `src/lib/validators/company-validator.ts` - CREATED
3. ✅ `src/lib/validators/job-validator.ts` - CREATED
4. ✅ `src/lib/validators/data-sanitizer.ts` - CREATED

---

## 🔄 IN PROGRESS

### Phase 1: Core Bug Fixes (CRITICAL)

#### 1. Fix `src/lib/agents/job-discovery-agent.ts`
**Bug:** Line 98 says "USE web_search tool to visit URLs"  
**Problem:** Perplexity doesn't have web_search tool  
**Fix:** Change to use `site:` operators  

**Current (WRONG):**
```typescript
1. **USE web_search tool** to visit these job board URLs
```

**Should be:**
```typescript
1. **USE site: operators** to search these job boards:
   site:ca.indeed.com/jobs "Software Developer" "Toronto, ON"
   site:linkedin.com/jobs "Software Developer" "Toronto, ON"
```

**Status:** ⏳ PENDING

---

#### 2. Fix `src/app/api/jobs/search/route.ts`
**Bug:** Location validation already fixed (moved before auth)  
**Additional:** Ensure no "Canada" fallback exists  

**Status:** ✅ ALREADY FIXED (from previous session)

---

#### 3. Fix `src/app/api/resume/upload/route.ts`
**Bug:** May have fallback location logic  
**Fix:** Ensure proper extraction, throw errors if no location  

**Status:** ⏳ NEEDS VERIFICATION

---

#### 4. Update `src/lib/perplexity-intelligence.ts`
**Bug:** May return fake data on errors  
**Fix:** Throw errors instead of returning fallbacks  

**Status:** ⏳ NEEDS VERIFICATION

---

### Phase 2: Constants Files (NEW)

#### 5. Create `src/lib/constants/job-boards.ts`
**Purpose:** 20+ job board configurations with site: operators  
**Status:** ⏳ PENDING

#### 6. Create `src/lib/constants/research-sources.ts`
**Purpose:** 24+ company research data sources  
**Status:** ⏳ PENDING

---

### Phase 3: Integration & Testing

#### 7. Test Build After Each Change
```bash
npm run build
```
**Status:** ⏳ PENDING

#### 8. Run Dev Server & Test
```bash
npm run dev
# Test: "Software Developer" in "Toronto, ON"
# Expected: 15-25 real jobs
```
**Status:** ⏳ PENDING

#### 9. Verify Terminal Logs
**Expected Output:**
```
[JOB_SEARCH] Jobs found: 18+
[JOB_SEARCH] Sample companies: Google, Shopify, TD Bank
```
**Status:** ⏳ PENDING

---

## 📋 DETAILED IMPLEMENTATION STEPS

### STEP 1: Fix job-discovery-agent.ts Prompt

**File:** `src/lib/agents/job-discovery-agent.ts`  
**Lines to change:** 93-150

**OLD PROMPT (Lines 98-99):**
```typescript
1. **USE web_search tool** to visit these job board URLs (search in parallel):
${searchUrls.map((s, i) => `   ${i+1}. ${s.name}: ${s.url}`).join('\n')}
```

**NEW PROMPT:**
```typescript
1. **USE site: operators** to search these job boards in parallel:

${searchUrls.map((s, i) => {
  const domain = new URL(s.url).hostname
  return `   ${i+1}. site:${domain} "${jobTitle}" "${location}"`
}).join('\n')}

SEARCH SYNTAX EXAMPLES:
- site:ca.indeed.com/jobs "Software Developer" "Toronto, ON"
- site:linkedin.com/jobs "Software Developer" "Toronto, ON"  
- site:glassdoor.ca "Software Developer" "Toronto, ON"
```

**Additional Changes:**
- Remove "CLICK the job URL" instructions (Perplexity can't click)
- Change to "EXTRACT from search results"
- Focus on JSON-LD and structured data

---

### STEP 2: Verify resume/upload/route.ts

**Check for:**
- No hardcoded fallback locations (e.g., "Edmonton, AB")
- Throws error if extraction fails
- Uses `extractResumeSignals` properly

**If found, replace with:**
```typescript
const signals = await extractResumeSignals(resumeText)

if (!signals.location) {
  return NextResponse.json(
    { error: 'Could not extract location from resume' },
    { status: 400 }
  )
}
```

---

### STEP 3: Verify perplexity-intelligence.ts

**Check for:**
- No fallback data on errors
- Throws errors instead of returning empty/fake data

**Should have:**
```typescript
if (!signals.location) {
  throw new Error('No location found in resume')
}
```

---

### STEP 4: Create job-boards.ts

**File:** `src/lib/constants/job-boards.ts`

**Structure:**
```typescript
export const JOB_BOARDS = {
  indeed: {
    name: 'Indeed Canada',
    domain: 'ca.indeed.com',
    searchPattern: 'site:ca.indeed.com/jobs',
    tier: 1,
    priority: 1
  },
  // ... 19 more boards
}
```

---

### STEP 5: Create research-sources.ts

**File:** `src/lib/constants/research-sources.ts`

**Structure:**
```typescript
export const RESEARCH_SOURCES = {
  financial: {
    yahooFinance: { ... },
    tmxMoney: { ... }
  },
  companyInfo: { ... },
  news: { ... },
  culture: { ... }
}
```

---

## 🎯 SUCCESS CRITERIA

### Build Success
- ✅ `npm run build` completes with 0 errors
- ✅ No TypeScript errors
- ✅ All imports resolve

### Functional Success
- ✅ Job search returns 15-25 real jobs
- ✅ No "UNKNOWN" companies
- ✅ No "Confidential" employers
- ✅ Real company names (Google, Shopify, TD Bank, etc.)
- ✅ Valid URLs to individual job postings
- ✅ Location extracted from resume (no fallbacks)

### Terminal Log Success
```
[JOB_SEARCH] Jobs found: 18
[JOB_SEARCH] Method: perplexity-site-search
[JOB_SEARCH] Sample companies: Google, Shopify, TD Bank, RBC
[PDF UPLOAD] Location: Toronto, ON
[PDF UPLOAD] Keywords: 50 extracted
```

---

## ⚠️ CRITICAL RULES

1. **Test build after EACH file change**
2. **Do NOT modify working files unnecessarily**
3. **Copy code EXACTLY as provided**
4. **Verify each fix before moving to next**
5. **Document any deviations**

---

## 📊 PROGRESS TRACKER

| Task | Status | Time | Notes |
|------|--------|------|-------|
| Validators created | ✅ DONE | 5 min | 4 files created |
| Fix job-discovery-agent | ⏳ PENDING | - | Prompt needs site: operators |
| Verify upload route | ⏳ PENDING | - | Check for fallbacks |
| Verify perplexity-intelligence | ⏳ PENDING | - | Check error handling |
| Create job-boards.ts | ⏳ PENDING | - | 20+ boards |
| Create research-sources.ts | ⏳ PENDING | - | 24+ sources |
| Test build | ⏳ PENDING | - | After each change |
| Integration test | ⏳ PENDING | - | Real job search |
| Verify logs | ⏳ PENDING | - | Terminal output |

---

## 🚀 NEXT IMMEDIATE ACTION

**NOW:** Fix `src/lib/agents/job-discovery-agent.ts` prompt (Lines 93-150)

**Change:** "USE web_search tool" → "USE site: operators"

**Then:** Test build → Verify → Move to next file

---

**Last Updated:** October 26, 2025, 1:15 PM MDT  
**Status:** 4/9 tasks complete (44%)
