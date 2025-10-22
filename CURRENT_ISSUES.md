# Current Issues - Oct 21, 2025

## 🔴 **Critical Issues**

### 1. **Resume Optimizer - 404 Error**
**Status:** Page exists but not accessible  
**Location:** `/career-finder/optimizer`  
**Likely Cause:** Routing issue or build problem  

**Fix Needed:**
- Check if page is being built correctly
- Verify Next.js routing
- Check for TypeScript errors preventing build

---

### 2. **Jobs Showing as "Confidential"**
**Status:** Jobs marked as confidential even after fix  
**Log:** `[JOB_SEARCH] Processed 10 jobs, 6 marked as confidential, 10 total kept`

**Root Cause:** The fix we made to `src/app/api/jobs/search/route.ts` is working (jobs are kept), but the frontend is still showing them as "confidential" in the UI.

**Fix Needed:**
- Update frontend to handle `isConfidential` flag
- Show company name even if marked confidential
- Add note: "Company name not disclosed in posting"

---

### 3. **Company Research API - 400 Error**
**Status:** `/api/v2/company/deep-research` returning 400  
**Error:** `POST https://job-craft-ai-jobcraftai.up.railway.app/api/v2/company/deep-research 400 (Bad Request)`

**Root Cause:** Request body missing `companyName` or sending invalid data

**Fix Needed:**
- Check what the frontend is sending
- Add better error logging to show what's missing
- Validate request body structure

---

### 4. **Jobs Still Being Pulled from Cache**
**Status:** Cache is working but not being cleared when needed  
**Log:** `[JOB_CACHE] ✅ Found cached search with 6 jobs`

**Issue:** User wants fresh jobs but cache is returning old results

**Fix Needed:**
- Add "Clear Cache" button in UI
- Reduce cache TTL (currently too long)
- Add cache expiration indicator

---

## 📊 **What's Working**

✅ Job search is finding jobs (10 jobs found)  
✅ Comprehensive research is working (matchScore: 85)  
✅ Resume parsing and keyword extraction working  
✅ Autopilot flow is functional  
✅ Job analysis and company research caching working  

---

## 🔧 **Priority Fixes**

### **Priority 1: Company Research 400 Error**
This is blocking users from seeing company details.

**Action:**
1. Add logging to see what request body is being sent
2. Check if `companyName` is undefined or empty
3. Add validation and better error messages

### **Priority 2: Resume Optimizer 404**
Users can't access this page.

**Action:**
1. Check if page.tsx exists and is valid
2. Verify no TypeScript errors
3. Test routing locally

### **Priority 3: Confidential Jobs Display**
Jobs are being kept but UI shows them as confidential.

**Action:**
1. Update job card component to show company name
2. Add visual indicator for confidential jobs
3. Show note about undisclosed company

### **Priority 4: Cache Management**
Give users control over cache.

**Action:**
1. Add "Refresh Jobs" button
2. Show cache age in UI
3. Reduce default TTL from current value

---

## 🐛 **How to Debug**

### **For Company Research 400:**
```typescript
// Add to deep-research/route.ts line 19
console.log('[DEEP_RESEARCH] Request body:', JSON.stringify(body, null, 2))
console.log('[DEEP_RESEARCH] companyName:', companyName)
console.log('[DEEP_RESEARCH] Missing fields:', {
  hasCompanyName: !!companyName,
  hasWebsite: !!companyWebsite,
  hasRole: !!targetRole,
  hasLocation: !!location
})
```

### **For Resume Optimizer 404:**
```bash
# Check if page exists
ls src/app/career-finder/optimizer/

# Check for TypeScript errors
npm run build

# Test locally
npm run dev
# Navigate to /career-finder/optimizer
```

### **For Confidential Jobs:**
```typescript
// Check job card component
// Find where isConfidential is being used
// Update to show company name regardless
```

---

## 📝 **Next Steps**

1. **Fix company research 400** - Add logging and validation
2. **Fix resume optimizer 404** - Check build and routing
3. **Update confidential job display** - Show company names
4. **Add cache controls** - Give users refresh button

**Estimated Time:** 2-3 hours for all fixes
