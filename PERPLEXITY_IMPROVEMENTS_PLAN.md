# 🔧 PERPLEXITY INTEGRATION IMPROVEMENTS - IMPLEMENTATION PLAN

Based on the comprehensive analysis, here's the systematic implementation plan:

## 📋 PHASE 1: CENTRALIZATION & DRY (High Priority)

### 1.1 Create Centralized Prompts
**File**: `src/lib/prompts/perplexity-prompts.ts`
- [ ] Extract all system prompts from individual files
- [ ] Create named constants for each prompt type
- [ ] Add versioning for prompt evolution tracking
- [ ] Include prompt metadata (purpose, expected output)

### 1.2 Create JSON Schemas
**Directory**: `src/lib/schemas/`
- [ ] `resume-analysis.schema.json` - EnhancedResumeAnalysis
- [ ] `job-listing.schema.json` - JobListing with AI fields
- [ ] `company-research.schema.json` - IntelligenceResponse
- [ ] `hiring-contacts.schema.json` - HiringContact
- [ ] `market-analysis.schema.json` - MarketAnalysis

### 1.3 Centralized Configuration
**File**: `src/lib/config/perplexity-config.ts`
- [ ] API base URL
- [ ] API key management
- [ ] Default temperature/maxTokens
- [ ] Retry configuration
- [ ] Cache TTL settings

---

## 📋 PHASE 2: ENHANCE PERPLEXITY SERVICE (Critical)

### 2.1 Enhanced `PerplexityService`
**File**: `src/lib/perplexity-service.ts`

**Enhancements:**
- [ ] Automatic JSON extraction with multiple fallback strategies
- [ ] Custom `PerplexityError` class with metadata
- [ ] Automatic header injection
- [ ] Request/Response logging
- [ ] Telemetry hooks (duration, success rate)
- [ ] Rate limiting awareness
- [ ] Request ID generation and tracking

**New Methods:**
```typescript
class PerplexityService {
  async makeRequest<T>(...)
  async makeRequestWithSchema<T>(schema: JSONSchema, ...)
  extractJSON(text: string): any
  handleError(error: any, context: RequestContext): never
}
```

### 2.2 Create `PerplexityError`
**File**: `src/lib/errors/perplexity-error.ts`

```typescript
class PerplexityError extends Error {
  code: string
  requestId: string
  prompts: { system: string; user: string }
  timestamp: number
  originalError?: Error
}
```

---

## 📋 PHASE 3: SCHEMA VALIDATION (High Priority)

### 3.1 Install & Configure AJV
```bash
npm install ajv ajv-formats
```

### 3.2 Create Validation Service
**File**: `src/lib/validation/schema-validator.ts`

```typescript
class SchemaValidator {
  validate<T>(data: unknown, schema: JSONSchema): T
  validateWithFallback<T>(data: unknown, schema: JSONSchema, fallback: T): T
}
```

### 3.3 Integrate Validation
- [ ] Resume analyzer response validation
- [ ] Job search response validation
- [ ] Company research response validation
- [ ] Hiring contacts response validation

---

## 📋 PHASE 4: UNIFIED JSON PARSING (Critical)

### 4.1 Create Parser Utility
**File**: `src/lib/utils/ai-response-parser.ts`

```typescript
class AIResponseParser {
  static extractJSON(text: string): any
  static parseWithSchema<T>(text: string, schema: JSONSchema): T
  static cleanMarkdown(text: string): string
  static extractCodeBlocks(text: string): string[]
}
```

**Extraction Strategies:**
1. Remove markdown code fences
2. Regex extraction for `{...}` or `[...]`
3. Line-by-line parsing for malformed JSON
4. Fallback to substring matching

---

## 📋 PHASE 5: ENHANCED FALLBACKS (Medium Priority)

### 5.1 AI-Powered Fallback
**File**: `src/lib/fallbacks/ai-fallback.ts`

Instead of pure regex, use simplified Perplexity prompts:

```typescript
async function fallbackResumeAnalysis(resumeText: string) {
  // Use minimal Perplexity call with simpler prompt
  const simplePrompt = "Extract only: location, experience level, top 5 skills"
  return await PerplexityService.makeRequest(...)
}
```

### 5.2 Standardized Fallback Responses
- [ ] Default AI risk analysis values
- [ ] Default salary ranges by location
- [ ] Default career progression paths
- [ ] Error metadata in all fallback responses

---

## 📋 PHASE 6: RESUME INSIGHTS INTEGRATION (High Priority)

### 6.1 Job Search Enhancement
**File**: `src/lib/perplexity-job-search.ts`

```typescript
async function searchJobsWithResumeContext(
  keywords: string[],  // From resume analyzer
  location: string,
  skillSet: string[],
  experienceLevel: string
) {
  // Use resume data to:
  // 1. Weight job board selection
  // 2. Compute accurate skill match %
  // 3. Include AI risk analysis per job
}
```

### 6.2 Salary Intelligence
**Enhancement**: Call `salaryForRole()` within `analyzeResume()` to populate market data

---

## 📋 PHASE 7: PERFORMANCE & MONITORING (Medium Priority)

### 7.1 Enhanced Performance Monitor
**File**: `src/lib/performance-monitor.ts`

**Add Tracking:**
- [ ] Cache hit/miss ratios
- [ ] AI confidence distribution
- [ ] Request duration percentiles (p50, p95, p99)
- [ ] Error rates by error type
- [ ] Retry success rates

### 7.2 Debug Endpoints
**Files**: 
- `src/app/api/debug/performance/route.ts`
- `src/app/api/debug/cache-stats/route.ts`

**Expose:**
- Average latency per AI call type
- Cache efficiency metrics
- Error distribution
- Most/least used prompts

### 7.3 Sentry Integration
```typescript
Sentry.startSpan({ name: 'perplexity.request' }, async () => {
  // AI call
  // Automatic duration and error tracking
})
```

---

## 📋 PHASE 8: TESTING INFRASTRUCTURE (High Priority)

### 8.1 Mock Perplexity Service
**File**: `src/lib/__mocks__/perplexity-service.ts`

```typescript
class MockPerplexityService {
  mockResponses: Map<string, any>
  setMockResponse(promptKey: string, response: any)
  clearMocks()
}
```

### 8.2 Test Fixtures
**Directory**: `src/lib/__fixtures__/`
- `resume-responses.json`
- `job-search-responses.json`
- `company-research-responses.json`
- `error-scenarios.json`

### 8.3 Unit Tests
- [ ] Schema validation tests
- [ ] JSON parsing tests (malformed, wrapped, etc.)
- [ ] Fallback logic tests
- [ ] Cache behavior tests
- [ ] Retry logic tests
- [ ] Error handling tests

---

## 📋 PRIORITY IMPLEMENTATION ORDER

### 🔴 **CRITICAL (Week 1)**
1. Centralized prompts (`prompts.ts`)
2. Enhanced `PerplexityService` with JSON extraction
3. `PerplexityError` class
4. Unified JSON parser

### 🟠 **HIGH (Week 2)**
5. JSON schemas for all responses
6. Schema validation with AJV
7. Resume insights → Job search integration
8. Performance monitoring enhancements

### 🟡 **MEDIUM (Week 3)**
9. AI-powered fallbacks
10. Debug endpoints
11. Sentry integration
12. Comprehensive testing

---

## 📊 SUCCESS METRICS

**After Implementation:**
- ✅ 0 duplicate JSON extraction code
- ✅ 100% response schema validation
- ✅ < 5% AI parsing failures
- ✅ < 500ms average AI response time
- ✅ > 60% cache hit rate
- ✅ 95%+ unit test coverage on AI modules
- ✅ Structured error tracking in Sentry
- ✅ Real-time performance dashboard

---

## 🎯 ARCHITECTURAL VISION

```
User Request
    ↓
[API Route]
    ↓
[Intelligence Service] ← Uses centralized prompts
    ↓
[PerplexityService] ← Enhanced with JSON extraction
    ↓                  Automatic error handling
    ↓                  Request tracking
    ↓
[Perplexity API]
    ↓
[Response Parser] ← Multiple extraction strategies
    ↓
[Schema Validator] ← AJV validation
    ↓
[Cache Layer] ← TTL + metadata
    ↓
[Fallback Handler] ← AI-powered fallback
    ↓
[Performance Monitor] ← Metrics collection
    ↓
[Return to User]
```

---

## 📝 CURRENT STATUS

**Completed:**
- ✅ Basic Perplexity integration
- ✅ Caching with SHA-256 keys
- ✅ Retry logic with exponential backoff
- ✅ Enhanced resume analyzer with AI fields
- ✅ Job outlook analyzer
- ✅ Notification system

**To Implement:**
- ⏳ Centralized prompts
- ⏳ JSON schemas
- ⏳ Schema validation
- ⏳ Enhanced service
- ⏳ Unified parser
- ⏳ Debug endpoints
- ⏳ Comprehensive tests

---

**This plan transforms the Perplexity integration from good to bulletproof!** 🚀

