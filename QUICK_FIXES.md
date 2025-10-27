# 🔧 QUICK FIXES - Priority Order

## 1. ✅ Job Description Missing (FIXED IN CODE)
**Issue**: Jobs don't have descriptions, cover letters are generic

**Root Cause**: 
- Perplexity JobListing has `summary` field
- Scraper JobListing has `description` field  
- Job aggregator already maps `summary` → `description`

**Status**: Already handled in job-aggregator.ts line 391

---

## 2. 🚨 PDF Generation Failing (DOCKER FIX NEEDED)
**Issue**: No attachments in emails

**Quick Fix**:
Add to Dockerfile after line 41:
```dockerfile
# Copy PDFKit fonts
RUN mkdir -p /app/.next/server/chunks/data
COPY --from=builder /app/node_modules/pdfkit/js/data/*.afm /app/.next/server/chunks/data/
```

**Alternative**: Use Puppeteer for PDF generation (already installed)

---

## 3. 🔧 Cover Letter "I am for" Bug (NEEDS INVESTIGATION)
**Issue**: Cover letters start with "I am for [position]"

**Location**: `src/lib/perplexity-intelligence.ts` - cover letter generation

**Quick Check**:
1. Search for cover letter template
2. Find variable replacement logic
3. Check if job title is being inserted correctly

---

## 4. 📧 Email Domain Not Verified (RESEND SETUP)
**Issue**: Emails only send to your own address

**Quick Fix**:
1. Go to https://resend.com/domains
2. Add your domain (e.g., careerlever.ai)
3. Add DNS records
4. Update FROM address in code to use verified domain

**Current**: `onboarding@resend.dev`
**Should be**: `noreply@yourdomain.com`

---

## 5. 🗺️ Location Too Broad (RESUME PARSER)
**Issue**: Using "Canada" instead of "Edmonton, AB"

**Quick Fix**: Add fallback in job search API
```typescript
// If location is too broad, use a default
let searchLocation = location
if (!location || location.length < 5 || /^(canada|usa|united states)$/i.test(location)) {
  searchLocation = 'Edmonton, AB' // Or get from user profile
}
```

---

## 6. 📄 Resume Templates Not Loading (JSON PARSING)
**Issue**: JSON parsing fails for resume variants

**Quick Fix**: Add better error handling and fallback
```typescript
try {
  // Parse JSON
} catch (error) {
  // Return original resume as variant A and B
  return {
    variantA: originalResume,
    variantB: originalResume,
    recommendations: ['Unable to generate variants, using original']
  }
}
```

---

## Priority Actions (Next 30 Minutes):

### 1. Fix PDF Generation (5 min)
- Update Dockerfile
- Redeploy

### 2. Verify Domain for Email (10 min)
- Add domain to Resend
- Update DNS
- Update FROM address

### 3. Fix Location Fallback (5 min)
- Add location validation
- Use user profile location as fallback

### 4. Test Cover Letter Generation (10 min)
- Find the "I am for" bug
- Fix template
- Test with real job

---

## Testing Commands:

```bash
# Test PDF generation locally
npm run dev
# Upload resume
# Try to send application

# Test cover letter
# Check console for [COVER_LETTER] logs

# Test job search
# Check console for [JOB_AGGREGATOR] logs
```

---

## Notes:

- Most issues are deployment-related (Docker, Resend)
- Job search system is working (returned Perplexity results)
- Scrapers not triggered because Perplexity returned enough results
- Need to verify scraper functionality separately
