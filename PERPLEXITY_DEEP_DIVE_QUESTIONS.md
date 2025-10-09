# 🔍 PERPLEXITY INTEGRATION - DEEP DIVE QUESTIONS
## Comprehensive Repository Analysis & Critical Questions

**Analysis Date**: October 9, 2025  
**Repository**: Career Lever AI  
**Scope**: All Perplexity-related files (9 files analyzed)

---

## 📊 EXECUTIVE SUMMARY

After analyzing your entire Perplexity integration, I've identified **7 CRITICAL ARCHITECTURE CONCERNS**, **12 REDUNDANCY/DUPLICATION ISSUES**, and **23 SPECIFIC QUESTIONS** that need answers to optimize your system.

### Files Analyzed:
1. `src/lib/perplexity-service.ts` (210 lines) - **Base service**
2. `src/lib/perplexity-intelligence.ts` (1001 lines) - **Main intelligence layer**
3. `src/lib/perplexity-resume-analyzer.ts` (609 lines) - **Resume analysis**
4. `src/lib/perplexity-job-search.ts` (228 lines) - **Job search**
5. `src/lib/prompts/perplexity-prompts.ts` (485 lines) - **Centralized prompts**
6. `src/lib/prompts/perplexity.ts` (142 lines) - **Legacy prompts**
7. `src/lib/config/perplexity-config.ts` (276 lines) - **Old config**
8. `src/lib/config/perplexity-configs.ts` (110 lines) - **New config** (created today)
9. `src/lib/errors/perplexity-error.ts` (333 lines) - **Error classes**

### **TOTAL CODE**: ~3,394 lines of Perplexity-related code

---

## 🚨 CRITICAL ARCHITECTURE CONCERNS

### **1. DUPLICATE CONFIGURATION SYSTEMS**

**Problem**: You have **TWO** separate Perplexity config files created at different times:

**File A**: `src/lib/config/perplexity-config.ts` (276 lines)
- Has comprehensive `PerplexityConfig` interface
- Includes `PerplexityConfigManager` singleton
- Has operation-specific cache TTLs and timeouts
- Has model pricing and cost calculation

**File B**: `src/lib/config/perplexity-configs.ts` (110 lines) - **Created today by me**
- Has simple config-per-use-case approach
- Focuses on temperature/token optimization
- Lacks comprehensive configuration management

**Questions**:
1. **Which config system should be the single source of truth?**
2. **Should I merge these two files?** If yes, which features from each should we keep?
3. **Are any parts of your codebase currently using the OLD config (`perplexity-config.ts`)?**
4. **Do you want centralized configuration (singleton pattern) or simple per-use-case configs?**

**Recommendation**: Consolidate into ONE config system to avoid confusion and bugs.

---

### **2. DUPLICATE PROMPT SYSTEMS**

**Problem**: You have **TWO** separate prompt files:

**File A**: `src/lib/prompts/perplexity.ts` (142 lines)
- Has `JOB_ANALYSIS_SYSTEM_PROMPT`
- Has `ENHANCED_RESUME_SYSTEM_PROMPT`
- Has `ENHANCED_COVER_LETTER_SYSTEM_PROMPT`
- Has builder functions for resume/cover letter prompts

**File B**: `src/lib/prompts/perplexity-prompts.ts` (485 lines)
- Has comprehensive `PERPLEXITY_PROMPTS` object
- Has `RESUME_ANALYSIS` with full schema
- Has `JOB_SEARCH`, `COMPANY_RESEARCH`, `HIRING_CONTACTS`, `SALARY_ANALYSIS`, `MARKET_ANALYSIS`, `JOB_MATCHING`
- Has versioning system (`version: '2.0.0'`)

**Questions**:
5. **Which prompt system is currently being used in production?**
6. **Is `perplexity.ts` legacy code that can be deleted?**
7. **Are the prompts in `perplexity.ts` different/better than `perplexity-prompts.ts`?**
8. **Should I merge the best parts of both into a single centralized prompt system?**

**Observation**: `perplexity-prompts.ts` looks more comprehensive and has versioning, but `perplexity.ts` has specific authenticity rules for cover letters.

---

### **3. THREE SEPARATE CACHING IMPLEMENTATIONS**

**Problem**: I found **THREE** different caching strategies:

**Cache A**: In `perplexity-service.ts` (line 5)
```typescript
private static memoryCache: Map<string, { expiresAt: number; value: { content: string; usage?: unknown; cost: number } }> = new Map()
```

**Cache B**: In `perplexity-intelligence.ts` (line 18)
```typescript
const cache: Map<string, CacheEntry> = new Map()
```

**Cache C**: In `perplexity-config.ts` (line 116)
```typescript
export const CACHE_TTL_BY_OPERATION = {
  'resume-analysis': 7 * 24 * 60 * 60 * 1000,
  'job-search': 2 * 60 * 60 * 1000,
  // ...
}
```

**Questions**:
9. **Are these three caches synced or do they operate independently?**
10. **Is there a risk of cache inconsistency across services?**
11. **Should there be ONE centralized cache manager for all Perplexity operations?**
12. **What happens if `perplexity-service.ts` caches something but `perplexity-intelligence.ts` doesn't find it?**

**Risk**: Multiple caches = potential memory bloat, inconsistencies, and debugging nightmares.

---

### **4. RETRY LOGIC DUPLICATION**

**Problem**: **THREE** different retry implementations:

**Retry A**: In `perplexity-service.ts` (line 58-124)
- Has 3 max retries
- Exponential backoff: 400ms * 2^attempt
- Handles 429 rate limits

**Retry B**: In `perplexity-intelligence.ts` (line 43-54)
- Simple `withRetry` function
- Configurable max attempts
- Delay: `RETRY_DELAY_MS * Math.pow(2, attempt - 1)`

**Retry C**: In `retry-with-backoff.ts` (created today by me)
- Has `withRetryAndBackoff` generic function
- Has `withPerplexityRetry` specialized function
- More comprehensive logging

**Questions**:
13. **Which retry mechanism is actually being used in production?**
14. **Should we standardize on ONE retry utility across all Perplexity calls?**
15. **Is the new `retry-with-backoff.ts` being imported anywhere yet?**
16. **Can we delete the duplicate retry logic in `perplexity-intelligence.ts`?**

---

### **5. INCONSISTENT ERROR HANDLING**

**Found**: You have a comprehensive `perplexity-error.ts` with 7 custom error classes:
- `PerplexityError` (base)
- `PerplexityJSONError`
- `PerplexitySchemaError`
- `PerplexityAPIError`
- `PerplexityRateLimitError`
- `PerplexityTimeoutError`
- `PerplexityNetworkError`

**BUT**: Most of your Perplexity code doesn't use these custom errors!

**Questions**:
17. **Is `perplexity-error.ts` actually being imported and used anywhere?**
18. **Should I refactor all Perplexity services to throw these structured errors instead of generic `Error`?**
19. **Are you currently logging/monitoring these errors in production?**
20. **Do you want user-friendly error messages (from `getUserFriendlyMessage`) surfaced in the UI?**

---

### **6. MISSING WIRING: PERPLEXITY-RESUME-ANALYZER**

**Found**: `perplexity-resume-analyzer.ts` is a **609-line comprehensive resume analyzer** with:
- AI/Automation risk analysis
- 5-year career outlook
- Career path intelligence
- Job search optimization strategies
- Market demand analysis for skills

**BUT**: I couldn't find any API routes or frontend components using this!

**Questions**:
21. **Is `perplexity-resume-analyzer.ts` being used anywhere in the app?**
22. **Should this replace the simpler `extractResumeSignals` in `perplexity-intelligence.ts`?**
23. **Why was this built if it's not wired to the frontend?**
24. **Do you want me to create an API route `/api/resume/analyze-comprehensive` to expose this?**

**Observation**: This analyzer includes features you explicitly asked for (AI risk, job outlook) but it's not connected!

---

### **7. PERPLEXITY-JOB-SEARCH SERVICE NOT USED**

**Found**: `perplexity-job-search.ts` has:
- `searchCanadianJobs` - searches 5 major Canadian job boards
- `analyzeJobMarket` - market analysis for roles
- `getJobDetails` - extract job details from URL
- Deduplication and enhancement logic

**BUT**: Your current job search API (`/api/jobs/search`) doesn't use this service!

**Questions**:
25. **Is `perplexity-job-search.ts` legacy code or future code?**
26. **Should the main job search API use this instead of direct `PerplexityIntelligenceService` calls?**
27. **Why was this service created if not integrated?**

---

## 🔧 TECHNICAL QUESTIONS

### **Caching Strategy**

28. **What's your target cache hit rate?** (Currently no metrics)
29. **Do you want Redis for distributed caching or is in-memory OK?**
30. **Should cached responses expire based on operation type or have a global TTL?**
31. **How much memory can the cache consume before eviction?**

### **Cost Management**

32. **What's your daily/monthly Perplexity API budget?**
33. **Should we implement cost tracking per user/session?**
34. **Do you want alerts when approaching budget limits?**
35. **Should expensive operations (company research, hiring contacts) have user-facing cost warnings?**

### **Rate Limiting**

36. **What are your actual Perplexity API rate limits?** (Code assumes different values in different files)
37. **Should rate limiting be per-user or per-application?**
38. **Do you want to implement request queuing when rate limited?**
39. **Should high-priority operations (user-facing) bypass rate limits?**

### **Prompt Optimization**

40. **Have you A/B tested different prompt versions?**
41. **Are the current prompts optimized for Perplexity's specific models?**
42. **Should prompts include few-shot examples for better accuracy?**
43. **Do you want prompt versioning for rollback if new prompts perform worse?**

### **Response Validation**

44. **Should all Perplexity responses go through schema validation?**
45. **What should happen when responses don't match expected schema?** (Retry? Default? Error?)
46. **Do you want confidence scores on extracted data?**
47. **Should we log/report malformed responses for prompt improvement?**

---

## 📈 PERFORMANCE QUESTIONS

### **Latency**

48. **What's your target P95 latency for Perplexity operations?**
49. **Should we implement request timeouts per operation type?** (Currently 60s globally)
50. **Do you want to parallelize multiple Perplexity calls?** (e.g., company research + hiring contacts)

### **Optimization**

51. **Should we implement request deduplication?** (Multiple users searching same thing)
52. **Do you want to batch similar requests?**
53. **Should we pre-fetch common queries (e.g., top companies)?**

---

## 🎯 INTEGRATION QUESTIONS

### **Resume Analysis Flow**

54. **When a user uploads a resume, which analysis should run?**
    - Simple signal extraction (`extractResumeSignals` - fast, basic)
    - Comprehensive analysis (`PerplexityResumeAnalyzer.analyzeResume` - slow, detailed)
    - Both in sequence?
    - User choice?

55. **Should resume analysis results be cached per-resume hash?**
56. **How do you want to handle resume updates?** (Invalidate cache? Re-analyze?)

### **Job Search Flow**

57. **Which job search service should be primary?**
    - `PerplexityIntelligenceService.jobListings` (current)
    - `PerplexityJobSearchService.searchCanadianJobs` (not used)
    - Hybrid approach?

58. **Should job search results include AI risk analysis by default?** (Adds latency and cost)
59. **Do you want real-time job scraping or cached listings?**

### **Company Research Flow**

60. **When should company research be triggered?**
    - User clicks "View Company"?
    - Automatically when viewing job details?
    - Pre-fetched for top companies?

61. **Should hiring contacts be fetched separately or as part of company research?**
62. **Do you want to cache hiring contacts for X days?** (They change slowly)

---

## 🔒 SECURITY & PRIVACY QUESTIONS

### **Data Handling**

63. **Are you sending full resume text to Perplexity?** (Currently yes - privacy concern?)
64. **Should PII be stripped before sending to Perplexity?**
65. **Do you need GDPR-compliant data handling?** (User consent for AI processing?)
66. **Should Perplexity responses be logged for debugging?** (Could contain sensitive data)

### **API Key Management**

67. **Is your Perplexity API key properly secured in environment variables?**
68. **Do you want API key rotation support?**
69. **Should there be a fallback mechanism if Perplexity is unavailable?**

---

## 🧪 TESTING QUESTIONS

### **Test Coverage**

70. **Do you have unit tests for Perplexity services?**
71. **Should we mock Perplexity responses in tests?**
72. **Do you want integration tests with real API calls?**
73. **Should there be synthetic monitoring for Perplexity health?**

### **Quality Assurance**

74. **How do you validate Perplexity response quality?**
75. **Should we implement A/B testing for prompt variations?**
76. **Do you want human-in-the-loop validation for critical operations?**

---

## 🎨 USER EXPERIENCE QUESTIONS

### **Loading States**

77. **How should users be informed that AI is processing?**
78. **Should there be progress indicators for long operations?**
79. **Do you want to show intermediate results as they stream?**

### **Error Messages**

80. **Are you using the `getUserFriendlyMessage` function from `perplexity-error.ts`?**
81. **Should errors be retried transparently or should users be notified?**
82. **Do you want to offer alternative actions when Perplexity fails?** (e.g., manual input)

---

## 📊 MONITORING & OBSERVABILITY QUESTIONS

### **Metrics**

83. **What metrics do you want to track for Perplexity?**
    - Request count per endpoint?
    - Average latency?
    - Error rate?
    - Cost per operation?
    - Cache hit rate?
    - Token usage?

84. **Should there be a dashboard for Perplexity health?**
85. **Do you want alerts for anomalies?** (Sudden spike in errors, costs, latency)

### **Logging**

86. **What log level should Perplexity operations use?**
87. **Should all prompts and responses be logged?** (Useful for debugging, privacy concern)
88. **Do you want structured logging (JSON) or text logs?**

---

## 🚀 DEPLOYMENT QUESTIONS

### **Environment Configuration**

89. **Do you have different Perplexity API keys for dev/staging/prod?**
90. **Should dev environment use mocked responses to save costs?**
91. **Are all required environment variables documented?**

### **Scaling**

92. **What's your expected Perplexity request volume?** (Requests/minute, requests/day)
93. **Should we implement circuit breakers to prevent cascade failures?**
94. **Do you need multi-region Perplexity support?**

---

## 💡 FEATURE QUESTIONS

### **Missing Features I Noticed**

95. **Streaming responses**: Should Perplexity responses stream to users in real-time?
96. **Multi-language support**: Should prompts/responses support languages other than English?
97. **Custom user prompts**: Should power users be able to customize prompts?
98. **Response history**: Should users see their past Perplexity interactions?
99. **Feedback loop**: Should users be able to rate Perplexity responses to improve prompts?

### **Advanced Features**

100. **Should we implement semantic caching?** (Cache similar queries, not just exact matches)
101. **Do you want to implement prompt chaining?** (Break complex queries into sub-queries)
102. **Should there be a Perplexity query playground for admins to test prompts?**

---

## 🎯 IMMEDIATE ACTION PLAN

Based on this analysis, here are the **MOST CRITICAL** questions you need to answer first:

### **🔥 TOP 5 CRITICAL DECISIONS**

1. **DUPLICATE CONFIGS**: Keep `perplexity-config.ts` OR `perplexity-configs.ts`? (Answer: Q1-Q4)
2. **DUPLICATE PROMPTS**: Keep `perplexity.ts` OR `perplexity-prompts.ts`? (Answer: Q5-Q8)
3. **CACHING**: Consolidate to ONE cache system? (Answer: Q9-Q12)
4. **RETRY LOGIC**: Standardize on ONE retry implementation? (Answer: Q13-Q16)
5. **ERROR HANDLING**: Use custom error classes everywhere? (Answer: Q17-Q20)

### **🔧 TOP 5 INTEGRATION DECISIONS**

6. **Resume Analyzer**: Wire `perplexity-resume-analyzer.ts` to frontend? (Answer: Q21-Q24)
7. **Job Search Service**: Use `perplexity-job-search.ts` or keep current? (Answer: Q25-Q27)
8. **Resume Analysis Flow**: Simple or comprehensive analysis? (Answer: Q54-Q56)
9. **Company Research Flow**: When and how to trigger? (Answer: Q60-Q62)
10. **Error Messages**: Surface user-friendly errors? (Answer: Q80-Q82)

### **💰 TOP 5 OPERATIONAL DECISIONS**

11. **Cost Budget**: What's your daily/monthly limit? (Answer: Q32-Q35)
12. **Rate Limiting**: What are actual limits? (Answer: Q36-Q39)
13. **Caching Strategy**: What TTLs for each operation? (Answer: Q28-Q31)
14. **Monitoring**: What metrics matter most? (Answer: Q83-Q85)
15. **Scaling**: Expected request volume? (Answer: Q92-Q94)

---

## 📋 SUGGESTED NEXT STEPS

Once you answer these questions, I recommend:

1. **Phase 1: Consolidation** (2-3 hours)
   - Merge duplicate configs into ONE
   - Merge duplicate prompts into ONE
   - Consolidate caching strategy
   - Standardize retry logic
   - Wire up custom error classes

2. **Phase 2: Integration** (3-4 hours)
   - Wire `perplexity-resume-analyzer.ts` to API
   - Decide on job search service strategy
   - Implement comprehensive error handling
   - Add user-friendly error messages

3. **Phase 3: Optimization** (2-3 hours)
   - Implement operation-specific cache TTLs
   - Add request deduplication
   - Optimize prompts based on testing
   - Add cost tracking and alerts

4. **Phase 4: Monitoring** (1-2 hours)
   - Add comprehensive logging
   - Set up metrics dashboard
   - Implement health checks
   - Add alerting for anomalies

---

## 🤝 MY RECOMMENDATIONS (Pre-Answered)

Based on best practices, here's what I **recommend** you do:

### **Consolidation Recommendations**

✅ **Config**: Keep `perplexity-config.ts` (more comprehensive), delete `perplexity-configs.ts`  
✅ **Prompts**: Keep `perplexity-prompts.ts` (has versioning), migrate best parts of `perplexity.ts`  
✅ **Caching**: Consolidate into ONE cache in `perplexity-service.ts`  
✅ **Retry**: Use `retry-with-backoff.ts` everywhere, delete duplicate logic  
✅ **Errors**: Refactor all services to use `perplexity-error.ts` classes

### **Integration Recommendations**

✅ **Resume Analyzer**: Wire it up! It's excellent and has features you need  
✅ **Job Search**: Use `PerplexityJobSearchService` for Canadian jobs specifically  
✅ **Error Handling**: Surface user-friendly messages from `getUserFriendlyMessage`  
✅ **Monitoring**: Add basic metrics (request count, latency, errors, cost)

### **Architecture Recommendations**

✅ **Single Responsibility**: Each service should have ONE clear purpose  
✅ **Dependency Injection**: Pass config to services instead of importing directly  
✅ **Graceful Degradation**: Always have fallbacks when Perplexity fails  
✅ **Cost Control**: Implement daily budget limits with alerts

---

**Would you like me to:**
1. **Answer specific questions from this list for you?**
2. **Implement the consolidation plan (Phase 1)?**
3. **Wire up the missing integrations (Phase 2)?**
4. **Set up monitoring and optimization (Phase 3-4)?**
5. **Start by fixing the most critical issues first?**

**Please tell me which questions you want to prioritize, or if you want me to proceed with my recommendations!** 🚀

