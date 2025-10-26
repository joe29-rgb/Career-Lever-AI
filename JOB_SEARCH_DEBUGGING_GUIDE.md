# 🔍 Job Search Debugging Guide

**Issue**: Job search returns 0 results  
**Date**: October 24, 2025  
**Commit**: 121

---

## 🚨 PROBLEM SUMMARY

The job search is executing but returning **0 jobs**:

```
[AUTOPILOT] Search completed: 0 jobs found
[SEARCH] Found 0 jobs from 0 sources
```

This indicates the Perplexity API is either:
1. Not finding any jobs
2. Returning malformed JSON
3. Hitting an error that's being silently caught
4. API key issue

---

## 🔧 DEBUGGING STEPS

### **Step 1: Check Server Logs**

After deploying, check the Railway logs for:

```bash
[JOB_SEARCH_V2] Perplexity response received: { contentLength: ..., preview: ... }
[JOB_SEARCH_V2] Parsing response...
[JOB_SEARCH_V2] Parsed jobs: { isArray: ..., count: ..., firstJob: ... }
```

**What to look for**:
- Is `contentLength` > 0?
- Does `preview` show JSON or error text?
- Is `isArray` true?
- Is `count` > 0?

### **Step 2: Check Perplexity API Key**

Verify the API key is set in Railway:

1. Go to Railway dashboard
2. Check environment variables
3. Verify `PERPLEXITY_API_KEY` exists and is valid

**Test the key**:
```bash
curl https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar-pro",
    "messages": [{"role": "user", "content": "test"}]
  }'
```

### **Step 3: Check Perplexity Response Format**

The code expects this JSON format:

```json
[{
  "title": "Job Title",
  "company": "Company Name",
  "location": "City, Province",
  "url": "https://...",
  "source": "indeed",
  "summary": "Job description",
  "postedDate": "2025-10-24",
  "salary": "$50,000-$70,000",
  "skillMatchPercent": 85,
  "skills": ["skill1", "skill2"],
  "workType": "remote",
  "experienceLevel": "mid"
}]
```

**Common issues**:
- Perplexity returns text instead of JSON
- JSON is wrapped in markdown code blocks
- Array is nested in an object
- Fields are named differently

### **Step 4: Enable Debug Mode**

Set environment variable:
```
PPX_DEBUG=true
```

This will log:
- Full request payload
- Response headers
- Response content
- Parsing errors

### **Step 5: Test with Simple Query**

Try a minimal search:
```typescript
const result = await PerplexityIntelligenceService.jobMarketAnalysisV2(
  'Toronto, ON',
  'Software Engineer with 5 years experience',
  {
    roleHint: 'Software Engineer',
    maxResults: 5
  }
)
```

---

## 🐛 COMMON ISSUES & FIXES

### **Issue 1: Empty Response**

**Symptom**: `contentLength: 0` or `Empty job analysis` error

**Causes**:
- API key invalid/expired
- Rate limiting
- Network timeout

**Fix**:
```typescript
// Check if API key is set
if (!process.env.PERPLEXITY_API_KEY) {
  throw new Error('PERPLEXITY_API_KEY not set')
}
```

### **Issue 2: JSON Parse Error**

**Symptom**: `Unexpected token` or `JSON.parse failed`

**Causes**:
- Response contains markdown
- Response is plain text
- Response has extra characters

**Fix**:
```typescript
// Clean response before parsing
let content = out.content.trim()
content = content.replace(/```json\s*/g, '')
content = content.replace(/```\s*/g, '')
const jsonMatch = content.match(/\[[\s\S]*\]/)
if (jsonMatch) {
  content = jsonMatch[0]
}
const parsed = JSON.parse(content)
```

### **Issue 3: Wrong Model**

**Symptom**: Response doesn't include web search results

**Causes**:
- Using `sonar` instead of `sonar-pro`
- Model doesn't have web search enabled

**Fix**:
```typescript
// Ensure using sonar-pro for web search
model: 'sonar-pro'
```

### **Issue 4: Insufficient Tokens**

**Symptom**: Response is truncated, incomplete JSON

**Causes**:
- `maxTokens` too low
- Too many jobs requested

**Fix**:
```typescript
// Increase tokens per job
maxTokens: Math.min((options.maxResults || 25) * 500, 16000)
```

### **Issue 5: No Web Search Results**

**Symptom**: Perplexity returns generic response without actual job listings

**Causes**:
- Prompt doesn't explicitly request web search
- Job boards are blocked/unavailable
- Search queries are too specific

**Fix**:
```typescript
// Add explicit web search instructions
const prompt = `CRITICAL: Use your real-time web search capability to find ACTUAL job postings.

Search these sites:
- site:indeed.ca "software engineer" "Toronto"
- site:linkedin.com/jobs "software engineer" "Toronto"

Return ONLY jobs you actually found via web search.`
```

---

## 🔬 TESTING CHECKLIST

- [ ] API key is valid and set
- [ ] Debug logging enabled
- [ ] Response content is logged
- [ ] JSON parsing works
- [ ] At least 1 job returned
- [ ] Job has all required fields
- [ ] URLs are valid
- [ ] Company names are real (not "Confidential")

---

## 📊 EXPECTED vs ACTUAL

### **Expected Flow**:
1. User searches for "sales" in "Edmonton"
2. API calls Perplexity with job board search queries
3. Perplexity searches Indeed, LinkedIn, etc.
4. Returns 10-25 real job listings
5. Jobs are parsed, enriched, and displayed

### **Actual Flow (Current)**:
1. User searches for "sales" in "Edmonton" ✅
2. API calls Perplexity ✅
3. Perplexity returns... ❓ (UNKNOWN - need logs)
4. Parsing fails or returns empty array ❌
5. 0 jobs displayed ❌

---

## 🚀 IMMEDIATE ACTIONS

1. **Deploy with debug logging** (commit 121)
2. **Check Railway logs** for Perplexity response
3. **Verify API key** is set and valid
4. **Test Perplexity API** directly with curl
5. **Check response format** matches expected JSON

---

## 💡 ALTERNATIVE SOLUTIONS

If Perplexity continues to fail:

### **Option A: Use Direct Job Board APIs**
- Indeed API
- LinkedIn Jobs API
- Adzuna API
- Reed API

### **Option B: Web Scraping**
- Use Cheerio/Puppeteer
- Scrape job boards directly
- Parse HTML for job listings

### **Option C: Hybrid Approach**
- Use Perplexity for analysis
- Use APIs for job listings
- Combine results

---

## 📝 NEXT STEPS

1. Deploy to Railway
2. Perform a job search
3. Check logs for `[JOB_SEARCH_V2]` messages
4. Share logs here for analysis
5. Implement fix based on findings

---

**Status**: 🔍 **DEBUGGING IN PROGRESS**

**Action Required**: Deploy and check logs to identify root cause
