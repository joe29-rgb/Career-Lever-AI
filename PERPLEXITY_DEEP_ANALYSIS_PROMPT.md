# 🔍 COMPREHENSIVE PERPLEXITY ANALYSIS PROMPT
## For Complete Codebase Audit & Fix Recommendations

---

## **COPY THIS ENTIRE PROMPT TO PERPLEXITY:**

---

I need a comprehensive technical audit of my Career Lever AI application repository: https://github.com/joe29-rgb/Career-Lever-AI

## **CRITICAL ISSUES TO ANALYZE:**

### **1. PERPLEXITY INTEGRATION FAILURES**
**Problem**: Perplexity AI is returning malformed JSON that crashes the app. Company insights show 0 contacts. Job search fails.

**Errors in production logs**:
```
[HIRING_CONTACTS] Error: SyntaxError: Expected ',' or '}' after property value in JSON at position 435
[PERPLEXITY] Parse error: SyntaxError: Unexpected non-whitespace character after JSON at position 11297
```

**Questions for Analysis**:
1. How should I prompt Perplexity AI to ALWAYS return valid, parseable JSON?
2. What system prompts and user prompts guarantee clean JSON responses?
3. Should I use `sonar-pro` or `sonar` model for structured data extraction?
4. What temperature and max_tokens settings ensure consistent JSON output?
5. How do I handle cases where Perplexity adds explanatory text before/after JSON?
6. What's the bulletproof JSON extraction regex for ANY Perplexity response format?

**Files to examine**:
- `src/lib/perplexity-service.ts` - Base Perplexity client
- `src/lib/perplexity-intelligence.ts` - Enhanced service with caching
- `src/lib/perplexity-resume-analyzer.ts` - Resume analysis
- `src/lib/perplexity-job-search.ts` - Job search integration
- `src/lib/utils/ai-response-parser.ts` - JSON parsing utilities

---

### **2. LOCATION EXTRACTION & JOB SEARCH FLOW**
**Problem**: Resume correctly extracts "Edmonton, AB" from PDF, but job search receives empty location string and returns Toronto/Scarborough jobs.

**Production logs**:
```
[EXTRACT_SIGNALS] Success: { keywords: 23, location: 'Edmonton, AB', locations: 1 }
[JOB_SEARCH] User ... searching: "..." in  (Resume matching: false)
                                           ^^^^ EMPTY!
```

**Questions for Analysis**:
1. Where in the data flow does the extracted location get lost?
2. Is the location stored correctly in localStorage after resume upload?
3. Does the search page read the correct localStorage keys?
4. Why does the frontend pass an empty location to the search API?
5. What's the complete data flow: Resume Upload → Extract → Store → Search Page → API?
6. Are there race conditions or async timing issues causing data loss?

**Files to examine**:
- `src/components/resume-upload/index.tsx` - Resume upload component
- `src/app/api/resume/upload/route.ts` - Upload API
- `src/app/api/resume/extract-signals/route.ts` - Signal extraction API
- `src/app/career-finder/search/page.tsx` - Search page component
- `src/app/api/jobs/search/route.ts` - Job search API
- Any localStorage operations across these files

---

### **3. UNWIRED SERVICES & FEATURES**
**Problem**: Multiple advanced services exist in the codebase but aren't connected to the frontend or used in the Career Finder flow.

**Questions for Analysis**:
1. Which services in `src/lib/` have NO corresponding API routes in `src/app/api/`?
2. Which API routes exist but are NEVER called by frontend components?
3. Which features are stubbed/mocked but not implemented?
4. What's missing to complete the Career Finder flow (Resume → Search → Analysis → Insights → Optimize → Letter → Outreach)?

**Services to check**:
- `src/lib/market-intelligence-service.ts` - Is it wired?
- `src/lib/job-outlook-analyzer.ts` - Is it used anywhere?
- `src/lib/notification-service.ts` - Does it have API routes?
- `src/lib/ai-service-enterprise.ts` - Is it integrated?
- Any service in `src/lib/` that doesn't have a corresponding API route

**API routes to verify**:
- Check if ALL routes in `src/app/api/` are actually called by components
- Identify orphaned routes that exist but aren't used
- Find missing routes for existing services

**Frontend components to audit**:
- `src/app/career-finder/` - All steps of the flow
- `src/components/` - Which components call which APIs?
- Identify UI that exists but doesn't function

---

### **4. RESUME OPTIMIZER NOT WORKING**
**Problem**: Resume optimizer returns "minimal structure" and generates nothing.

**Production logs**:
```
[RESUME_BUILDER] Text-only input received, length: 5726
[RESUME_BUILDER] No resumeData provided, returning minimal structure
```

**Questions for Analysis**:
1. Why is `resumeData` null when called from the optimizer page?
2. What's the expected flow: Optimizer page → API call → Perplexity → Response?
3. Should the optimizer work with text-only input or require structured data?
4. How should the API handle text-only vs. structured resume data?
5. What Perplexity prompt generates the best resume optimization results?

**Files to examine**:
- `src/app/career-finder/optimizer/page.tsx` - Optimizer UI
- `src/app/api/resume-builder/generate/route.ts` - Resume generation API
- Any resume builder related components

---

### **5. COMPANY INSIGHTS ALWAYS EMPTY**
**Problem**: Company research returns 0 contacts, no culture info, no market intelligence.

**Questions for Analysis**:
1. Is the company research API being called correctly with the right parameters?
2. What Perplexity prompts would return comprehensive company data?
3. How should I structure the request to get hiring contacts with emails?
4. What's the best approach for LinkedIn contact discovery via Perplexity?
5. How do I validate the API response before sending to frontend?

**Files to examine**:
- `src/app/api/v2/company/deep-research/route.ts` - Company research API
- `src/components/company-research/index.tsx` - Company research UI
- `src/app/career-finder/company/page.tsx` - Company insights page

---

### **6. COMPLETE CAREER FINDER FLOW ANALYSIS**

**Analyze the ENTIRE flow and identify ALL breaking points**:

1. **Resume Upload** (`/career-finder/resume`)
   - Does it extract text correctly?
   - Does it call the right API endpoint?
   - Does it store data in the correct format?
   - Does it set the right localStorage keys?

2. **Job Search** (`/career-finder/search`)
   - Does it read resume data correctly?
   - Does it extract keywords and location?
   - Does it pass correct parameters to search API?
   - Does it display results properly?

3. **Job Analysis** (`/career-finder/job-analysis`)
   - Does it receive the selected job correctly?
   - Does it analyze match score properly?
   - Does it fetch company research?

4. **Company Insights** (`/career-finder/company`)
   - Does it receive company name correctly?
   - Does it call the research API?
   - Does it display all returned data?

5. **Resume Optimizer** (`/career-finder/optimizer`)
   - Does it have access to resume data?
   - Does it send correct API request?
   - Does it display generated results?

6. **Cover Letter** (`/career-finder/cover-letter`)
   - Does it have job and resume data?
   - Does it generate properly?

7. **Outreach** (`/career-finder/outreach`)
   - Does it have all necessary data?
   - Does it compose emails correctly?

---

### **7. PERPLEXITY BEST PRACTICES**

**Provide specific guidance on**:

1. **Prompt Engineering for JSON**:
   - What's the optimal system prompt for JSON-only responses?
   - Should I use "Return ONLY JSON" or more specific instructions?
   - How do I prevent explanatory text before/after JSON?
   - Should I provide example JSON structure in every prompt?

2. **Model Selection**:
   - `sonar-pro` vs `sonar` vs `sonar-small` - which for what use case?
   - Temperature settings for structured data extraction?
   - Max tokens for different operations?

3. **Error Handling**:
   - How to detect when Perplexity returns malformed JSON?
   - Best retry strategies?
   - Fallback mechanisms?

4. **Rate Limiting**:
   - What rate limits exist for Perplexity API?
   - How should I implement backoff?
   - Should I queue requests?

---

## **DELIVERABLES NEEDED FROM PERPLEXITY:**

1. **Comprehensive Data Flow Diagram**
   - Show EXACT path data takes from resume upload to job search
   - Identify where data is lost or corrupted

2. **Complete Wiring Checklist**
   - List ALL unwired services
   - List ALL missing API routes
   - List ALL broken component-to-API connections

3. **Perplexity Integration Guide**
   - Exact prompts for each use case (resume analysis, company research, job search, hiring contacts)
   - Recommended model and parameters for each
   - Bulletproof JSON extraction code

4. **Critical Fixes Priority List**
   - Order by impact (highest priority first)
   - Include specific file names and line numbers
   - Provide exact code changes needed

5. **localStorage Strategy**
   - Document ALL localStorage keys currently in use
   - Identify conflicts or duplicates
   - Recommend standardized key naming

---

## **ANALYSIS APPROACH:**

1. **Clone and examine the actual repository code** at https://github.com/joe29-rgb/Career-Lever-AI
2. **Trace the complete execution path** for each user flow
3. **Identify missing connections** between services and APIs
4. **Verify all Perplexity integration points** for correctness
5. **Check consistency** of data structures across files
6. **Validate error handling** at every integration point

---

## **OUTPUT FORMAT:**

Please provide:

### **SECTION 1: ROOT CAUSE ANALYSIS**
- What are the top 5 actual root causes of failures?
- NOT symptoms - actual architectural or integration problems

### **SECTION 2: DATA FLOW ISSUES**
- Complete trace of location data from resume to search API
- Show exactly where it gets lost or corrupted

### **SECTION 3: PERPLEXITY FIXES**
- Exact prompts and code for each Perplexity integration
- Model selection and parameters
- JSON parsing that handles ANY response format

### **SECTION 4: WIRING CHECKLIST**
- Services that need API routes
- APIs that need frontend calls
- Components that need service integration

### **SECTION 5: IMPLEMENTATION PLAN**
- Priority-ordered list of fixes
- Specific file names and line numbers
- Code snippets for each fix

---

## **CRITICAL CONTEXT:**

- This is a production SaaS application deployed on Railway
- Users across North America need location-based job search to work
- Perplexity AI is the core intelligence engine - it MUST work reliably
- The app worked better a few hours ago before attempted fixes
- Every "fix" today has made things worse, not better
- Need systematic, root-cause analysis, not quick patches

---

**Please analyze the ENTIRE repository and provide comprehensive, production-ready solutions.**

